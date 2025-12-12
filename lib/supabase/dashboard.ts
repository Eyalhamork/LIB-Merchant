// lib/supabase/dashboard.ts

import { supabase } from './client';

/**
 * Get today's sales summary
 */
export async function getTodaysSummary(shopId: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's transactions
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select(`
        total_amount,
        discount_amount,
        status,
        payments:transaction_payments(payment_method, amount)
      `)
      .eq('shop_id', shopId)
      .eq('status', 'completed')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (txError) throw txError;

    // Calculate totals
    const totalSales = transactions?.reduce((sum, t) => sum + t.total_amount, 0) || 0;
    const totalDiscount = transactions?.reduce((sum, t) => sum + t.discount_amount, 0) || 0;
    const totalTransactions = transactions?.length || 0;

    // Calculate by payment method
    let cashSales = 0;
    let momoSales = 0;
    let orangeMoneySales = 0;
    let creditSales = 0;

    transactions?.forEach((txn) => {
      txn.payments?.forEach((payment: any) => {
        switch (payment.payment_method) {
          case 'cash':
            cashSales += payment.amount;
            break;
          case 'mtn_momo':
            momoSales += payment.amount;
            break;
          case 'orange_money':
            orangeMoneySales += payment.amount;
            break;
          case 'credit':
            creditSales += payment.amount;
            break;
        }
      });
    });

    // Get active cash session
    const { data: activeSession } = await supabase
      .from('cash_sessions')
      .select('*')
      .eq('shop_id', shopId)
      .eq('status', 'open')
      .single();

    return {
      totalSales,
      totalDiscount,
      totalTransactions,
      cashSales,
      momoSales,
      orangeMoneySales,
      creditSales,
      activeSession,
    };
  } catch (error) {
    console.error('Get today summary error:', error);
    throw error;
  }
}

/**
 * Get recent transactions (last 10)
 */
export async function getRecentTransactions(shopId: string, limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        employee:profiles!transactions_employee_id_fkey(id, name),
        customer:customers(id, name),
        items:transaction_items(
          quantity,
          price_at_sale,
          shop_product:shop_products(
            product:products(name)
          )
        ),
        payments:transaction_payments(payment_method, amount)
      `)
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get recent transactions error:', error);
    throw error;
  }
}

/**
 * Get low stock products
 */
export async function getLowStockProducts(shopId: string) {
  try {
    const { data, error } = await supabase
      .from('shop_products')
      .select(`
        *,
        product:products(*)
      `)
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .filter('current_quantity', 'lte', 'reorder_level')
      .order('current_quantity', { ascending: true })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get low stock products error:', error);
    throw error;
  }
}

/**
 * Get outstanding credit summary
 */
export async function getOutstandingCredit(shopId: string) {
  try {
    // Get customers with credit balance > 0
    const { data: customers, error: custError } = await supabase
      .from('customers')
      .select('id, name, phone, credit_balance, last_purchase_at')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .gt('credit_balance', 0)
      .order('credit_balance', { ascending: false })
      .limit(10);

    if (custError) throw custError;

    // Calculate total outstanding
    const totalOutstanding = customers?.reduce((sum, c) => sum + c.credit_balance, 0) || 0;
    const customersWithCredit = customers?.length || 0;

    return {
      totalOutstanding,
      customersWithCredit,
      topCustomers: customers || [],
    };
  } catch (error) {
    console.error('Get outstanding credit error:', error);
    throw error;
  }
}

/**
 * Get sales trend (last 7 days)
 */
export async function getSalesTrend(shopId: string) {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('transactions')
      .select('total_amount, created_at')
      .eq('shop_id', shopId)
      .eq('status', 'completed')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const salesByDate: { [key: string]: number } = {};
    data?.forEach((txn) => {
      const date = new Date(txn.created_at).toLocaleDateString('en-US');
      salesByDate[date] = (salesByDate[date] || 0) + txn.total_amount;
    });

    return Object.entries(salesByDate).map(([date, amount]) => ({
      date,
      amount,
    }));
  } catch (error) {
    console.error('Get sales trend error:', error);
    throw error;
  }
}
