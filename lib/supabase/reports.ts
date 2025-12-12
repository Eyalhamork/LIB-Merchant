// lib/supabase/reports.ts

import { supabase } from './client';

// ==================
// SALES REPORTS
// ==================

export async function getSalesReport(
  shopId: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('shop_id', shopId)
    .eq('status', 'completed')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getSalesByDay(
  shopId: string,
  startDate: string,
  endDate: string
) {
  // Group sales by day
  const { data, error } = await supabase.rpc('get_sales_by_day', {
    p_shop_id: shopId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    // Fallback if function doesn't exist - do client-side grouping
    const transactions = await getSalesReport(shopId, startDate, endDate);
    
    const grouped = transactions.reduce((acc: any, txn) => {
      const date = new Date(txn.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          total_sales: 0,
          transaction_count: 0,
          total_discount: 0,
        };
      }
      acc[date].total_sales += txn.total_amount;
      acc[date].transaction_count += 1;
      acc[date].total_discount += txn.discount_amount;
      return acc;
    }, {});

    return Object.values(grouped);
  }

  return data;
}

export async function getSalesByPaymentMethod(
  shopId: string,
  startDate: string,
  endDate: string
) {
  const { data: transactions } = await supabase
    .from('transactions')
    .select('id')
    .eq('shop_id', shopId)
    .eq('status', 'completed')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (!transactions || transactions.length === 0) {
    return [];
  }

  const transactionIds = transactions.map((t) => t.id);

  const { data: payments, error } = await supabase
    .from('transaction_payments')
    .select('payment_method, amount')
    .in('transaction_id', transactionIds);

  if (error) throw error;

  // Group by payment method
  const grouped = payments.reduce((acc: any, payment) => {
    const method = payment.payment_method;
    if (!acc[method]) {
      acc[method] = {
        method,
        total_amount: 0,
        transaction_count: 0,
      };
    }
    acc[method].total_amount += payment.amount;
    acc[method].transaction_count += 1;
    return acc;
  }, {});

  return Object.values(grouped);
}

export async function getTopSellingProducts(
  shopId: string,
  startDate: string,
  endDate: string,
  limit: number = 10
) {
  const { data: transactions } = await supabase
    .from('transactions')
    .select('id')
    .eq('shop_id', shopId)
    .eq('status', 'completed')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (!transactions || transactions.length === 0) {
    return [];
  }

  const transactionIds = transactions.map((t) => t.id);

  const { data: items, error } = await supabase
    .from('transaction_items')
    .select(`
      shop_product_id,
      quantity,
      subtotal,
      shop_products!inner (
        product_id,
        selling_price,
        products (
          name,
          category,
          unit
        )
      )
    `)
    .in('transaction_id', transactionIds);

  if (error) throw error;

  // Group by product
  const grouped = items.reduce((acc: any, item) => {
    const productId = item.shop_product_id;
    if (!acc[productId]) {
      acc[productId] = {
        product_id: productId,
        product_name: item.shop_products.products.name,
        category: item.shop_products.products.category,
        unit: item.shop_products.products.unit,
        quantity_sold: 0,
        total_revenue: 0,
        times_sold: 0,
      };
    }
    acc[productId].quantity_sold += item.quantity;
    acc[productId].total_revenue += item.subtotal;
    acc[productId].times_sold += 1;
    return acc;
  }, {});

  return Object.values(grouped)
    .sort((a: any, b: any) => b.total_revenue - a.total_revenue)
    .slice(0, limit);
}

// ==================
// EMPLOYEE REPORTS
// ==================

export async function getEmployeePerformance(
  shopId: string,
  startDate: string,
  endDate: string
) {
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      employee_id,
      total_amount,
      profiles!inner (
        name,
        role
      )
    `)
    .eq('shop_id', shopId)
    .eq('status', 'completed')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (error) throw error;

  // Group by employee
  const grouped = transactions.reduce((acc: any, txn) => {
    const employeeId = txn.employee_id;
    if (!acc[employeeId]) {
      acc[employeeId] = {
        employee_id: employeeId,
        employee_name: txn.profiles.name,
        role: txn.profiles.role,
        total_sales: 0,
        transaction_count: 0,
        average_sale: 0,
      };
    }
    acc[employeeId].total_sales += txn.total_amount;
    acc[employeeId].transaction_count += 1;
    return acc;
  }, {});

  // Calculate averages
  Object.values(grouped).forEach((emp: any) => {
    emp.average_sale = emp.total_sales / emp.transaction_count;
  });

  return Object.values(grouped).sort((a: any, b: any) => b.total_sales - a.total_sales);
}

// ==================
// INVENTORY REPORTS
// ==================

export async function getInventoryReport(shopId: string) {
  const { data, error } = await supabase
    .from('shop_products')
    .select(`
      *,
      product:products (
        name,
        category,
        unit
      )
    `)
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .order('current_quantity', { ascending: true });

  if (error) throw error;

  return data.map((item) => ({
    product_id: item.id,
    product_name: item.product.name,
    category: item.product.category,
    unit: item.product.unit,
    current_quantity: item.current_quantity,
    reorder_level: item.reorder_level,
    cost_price: item.cost_price,
    selling_price: item.selling_price,
    stock_value: item.current_quantity * item.cost_price,
    potential_revenue: item.current_quantity * item.selling_price,
    is_low_stock: item.current_quantity <= item.reorder_level,
  }));
}

export async function getInventoryValuation(shopId: string) {
  const items = await getInventoryReport(shopId);

  const totals = items.reduce(
    (acc, item) => {
      acc.total_items += 1;
      acc.total_quantity += item.current_quantity;
      acc.total_cost_value += item.stock_value;
      acc.total_potential_revenue += item.potential_revenue;
      if (item.is_low_stock) {
        acc.low_stock_items += 1;
      }
      return acc;
    },
    {
      total_items: 0,
      total_quantity: 0,
      total_cost_value: 0,
      total_potential_revenue: 0,
      low_stock_items: 0,
      potential_profit: 0,
    }
  );

  totals.potential_profit = totals.total_potential_revenue - totals.total_cost_value;

  return totals;
}

export async function getLowStockProducts(shopId: string) {
  const { data, error } = await supabase
    .from('shop_products')
    .select(`
      *,
      product:products (
        name,
        category,
        unit
      )
    `)
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .order('current_quantity', { ascending: true });

  if (error) throw error;

  return data.filter((item) => item.current_quantity <= item.reorder_level);
}

export async function getStockMovementHistory(
  shopId: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await supabase
    .from('stock_movements')
    .select(`
      *,
      shop_product:shop_products!inner (
        product:products (
          name,
          category
        )
      ),
      user:profiles (
        name
      )
    `)
    .eq('shop_id', shopId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ==================
// SUMMARY STATS
// ==================

export async function getDashboardStats(
  shopId: string,
  startDate: string,
  endDate: string
) {
  // Get transactions
  const transactions = await getSalesReport(shopId, startDate, endDate);

  // Get transaction IDs
  const transactionIds = transactions.map((t) => t.id);

  // Get payments
  let payments: any[] = [];
  if (transactionIds.length > 0) {
    const { data } = await supabase
      .from('transaction_payments')
      .select('payment_method, amount')
      .in('transaction_id', transactionIds);
    payments = data || [];
  }

  // Calculate stats
  const stats = {
    total_sales: transactions.reduce((sum, t) => sum + t.total_amount, 0),
    total_transactions: transactions.length,
    total_discount: transactions.reduce((sum, t) => sum + t.discount_amount, 0),
    average_sale: 0,
    cash_sales: 0,
    momo_sales: 0,
    credit_sales: 0,
  };

  stats.average_sale = stats.total_transactions > 0 
    ? stats.total_sales / stats.total_transactions 
    : 0;

  // Group payments by method
  payments.forEach((payment) => {
    if (payment.payment_method === 'cash') {
      stats.cash_sales += payment.amount;
    } else if (
      payment.payment_method === 'mtn_momo' ||
      payment.payment_method === 'orange_money'
    ) {
      stats.momo_sales += payment.amount;
    } else if (payment.payment_method === 'credit') {
      stats.credit_sales += payment.amount;
    }
  });

  return stats;
}

export async function getCreditSummary(shopId: string) {
  const { data: customers, error } = await supabase
    .from('customers')
    .select('credit_balance, name')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .gt('credit_balance', 0)
    .order('credit_balance', { ascending: false });

  if (error) throw error;

  const summary = {
    total_outstanding: customers.reduce((sum, c) => sum + c.credit_balance, 0),
    customer_count: customers.length,
    customers: customers.slice(0, 5), // Top 5
  };

  return summary;
}
