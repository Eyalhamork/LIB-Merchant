// lib/supabase/pos.ts

import { supabase } from './client';
import type { PaymentMethod, CartItem, Customer } from '@/types';

interface CreateSaleParams {
  shop_id: string;
  employee_id: string;
  customer_id?: string;
  cash_session_id?: string;
  items: CartItem[];
  payments: {
    method: PaymentMethod;
    amount: number;
    amount_given?: number;
    change_given?: number;
    reference_number?: string;
  }[];
  discount_amount?: number;
  notes?: string;
}

interface SaleResult {
  transaction_id: string;
  receipt_number: string;
  total_amount: number;
}

/**
 * Check if user has active cash session
 */
export async function getActiveCashSession(employeeId: string) {
  const { data, error } = await supabase
    .from('cash_sessions')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('status', 'open')
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data;
}

/**
 * Open a new cash session
 */
export async function openCashSession(
  shopId: string,
  employeeId: string,
  openingBalance: number
) {
  const { data, error } = await supabase
    .from('cash_sessions')
    .insert({
      shop_id: shopId,
      employee_id: employeeId,
      opening_balance: openingBalance,
      session_date: new Date().toISOString().split('T')[0],
      status: 'open',
    })
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await supabase.from('activity_log').insert({
    shop_id: shopId,
    user_id: employeeId,
    activity_type: 'session_opened',
    description: `Opened cash session with ${openingBalance} LRD`,
    metadata: {
      session_id: data.id,
      opening_balance: openingBalance,
    },
  });

  return data;
}

/**
 * Validate stock availability for cart items
 */
export async function validateStockAvailability(items: CartItem[]): Promise<{
  valid: boolean;
  errors: { product_name: string; available: number; requested: number }[];
}> {
  const errors: { product_name: string; available: number; requested: number }[] = [];

  for (const item of items) {
    const { data: product } = await supabase
      .from('shop_products')
      .select('current_quantity')
      .eq('id', item.shop_product_id)
      .single();

    if (!product || product.current_quantity < item.quantity) {
      errors.push({
        product_name: item.product.product?.name || 'Unknown',
        available: product?.current_quantity || 0,
        requested: item.quantity,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate payment amounts match total
 */
export function validatePayments(
  payments: { method: PaymentMethod; amount: number }[],
  totalAmount: number
): { valid: boolean; error?: string } {
  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  if (Math.abs(paidAmount - totalAmount) > 0.01) {
    return {
      valid: false,
      error: `Payment total (${paidAmount.toFixed(2)}) does not match transaction total (${totalAmount.toFixed(2)})`,
    };
  }

  return { valid: true };
}

/**
 * Generate receipt number
 */
async function generateReceiptNumber(shopId: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');

  const { count } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('shop_id', shopId)
    .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00Z');

  const receiptCount = (count || 0) + 1;
  return `RCP-${today}-${receiptCount.toString().padStart(4, '0')}`;
}

/**
 * Create a complete sale transaction
 */
export async function createSale(params: CreateSaleParams): Promise<SaleResult> {
  const {
    shop_id,
    employee_id,
    customer_id,
    cash_session_id,
    items,
    payments,
    discount_amount = 0,
    notes,
  } = params;

  // Validate stock availability
  const stockValidation = await validateStockAvailability(items);
  if (!stockValidation.valid) {
    throw new Error(
      `Insufficient stock: ${stockValidation.errors.map(e => `${e.product_name} (available: ${e.available}, requested: ${e.requested})`).join(', ')}`
    );
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const total_amount = subtotal - discount_amount;

  // Validate payments
  const paymentValidation = validatePayments(payments, total_amount);
  if (!paymentValidation.valid) {
    throw new Error(paymentValidation.error);
  }

  // Generate receipt number
  const receipt_number = await generateReceiptNumber(shop_id);

  // Create transaction
  const { data: transaction, error: txnError } = await supabase
    .from('transactions')
    .insert({
      shop_id,
      employee_id,
      customer_id,
      cash_session_id,
      subtotal,
      discount_amount,
      total_amount,
      receipt_number,
      notes,
      status: 'completed',
      sync_status: 'synced',
    })
    .select()
    .single();

  if (txnError) throw txnError;

  // Insert transaction items
  const transactionItems = items.map(item => ({
    transaction_id: transaction.id,
    shop_product_id: item.shop_product_id,
    quantity: item.quantity,
    price_at_sale: item.price,
    subtotal: item.subtotal,
  }));

  const { error: itemsError } = await supabase
    .from('transaction_items')
    .insert(transactionItems);

  if (itemsError) throw itemsError;

  // Insert payments
  const transactionPayments = payments.map(payment => ({
    transaction_id: transaction.id,
    payment_method: payment.method,
    amount: payment.amount,
    amount_given: payment.amount_given,
    change_given: payment.change_given,
    reference_number: payment.reference_number,
  }));

  const { error: paymentsError } = await supabase
    .from('transaction_payments')
    .insert(transactionPayments);

  if (paymentsError) throw paymentsError;

  // Update inventory
  for (const item of items) {
    const { data: product } = await supabase
      .from('shop_products')
      .select('current_quantity')
      .eq('id', item.shop_product_id)
      .single();

    if (!product) continue;

    const newQuantity = product.current_quantity - item.quantity;

    await supabase
      .from('shop_products')
      .update({
        current_quantity: newQuantity,
        last_sold_at: new Date().toISOString(),
      })
      .eq('id', item.shop_product_id);

    // Log stock movement
    await supabase.from('stock_movements').insert({
      shop_id,
      shop_product_id: item.shop_product_id,
      movement_type: 'sale',
      quantity_change: -item.quantity,
      quantity_before: product.current_quantity,
      quantity_after: newQuantity,
      reference_type: 'transaction',
      reference_id: transaction.id,
      user_id: employee_id,
      notes: `Sale - ${receipt_number}`,
    });
  }

  // Update cash session (if cash payment exists)
  const cashPayment = payments.find(p => p.method === 'cash');
  if (cashPayment && cash_session_id) {
    const { data: session } = await supabase
      .from('cash_sessions')
      .select('cash_sales_total')
      .eq('id', cash_session_id)
      .single();

    if (session) {
      await supabase
        .from('cash_sessions')
        .update({
          cash_sales_total: session.cash_sales_total + cashPayment.amount,
        })
        .eq('id', cash_session_id);
    }
  }

  // Update customer credit (if credit payment exists)
  const creditPayment = payments.find(p => p.method === 'credit');
  if (creditPayment && customer_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('credit_balance, total_purchases, total_credit_used')
      .eq('id', customer_id)
      .single();

    if (customer) {
      await supabase
        .from('customers')
        .update({
          credit_balance: customer.credit_balance + creditPayment.amount,
          total_purchases: customer.total_purchases + total_amount,
          total_credit_used: customer.total_credit_used + creditPayment.amount,
          last_purchase_at: new Date().toISOString(),
        })
        .eq('id', customer_id);
    }
  }

  // Log activity
  await supabase.from('activity_log').insert({
    shop_id,
    user_id: employee_id,
    activity_type: creditPayment ? 'credit_sale' : 'sale_completed',
    reference_type: 'transaction',
    reference_id: transaction.id,
    description: `Sale completed: ${receipt_number} - ${total_amount} LRD`,
    metadata: {
      receipt_number,
      total_amount,
      items_count: items.length,
      payment_methods: payments.map(p => p.method),
      customer_id,
    },
  });

  return {
    transaction_id: transaction.id,
    receipt_number: transaction.receipt_number,
    total_amount: transaction.total_amount,
  };
}

/**
 * Get products for POS (active, with stock)
 */
export async function getPOSProducts(shopId: string) {
  const { data, error } = await supabase
    .from('shop_products')
    .select(`
      *,
      product:products(*)
    `)
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .order('is_favorite', { ascending: false })
    .order('product(name)', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Search products for POS
 */
export async function searchPOSProducts(shopId: string, query: string) {
  const { data, error } = await supabase
    .from('shop_products')
    .select(`
      *,
      product:products!inner(*)
    `)
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .or(
      `product.name.ilike.%${query}%,product.barcode.ilike.%${query}%`
    )
    .limit(20);

  if (error) throw error;
  return data || [];
}

/**
 * Get customers for POS (for credit sales)
 */
export async function getPOSCustomers(shopId: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

/**
 * Search customers
 */
export async function searchPOSCustomers(shopId: string, query: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(10);

  if (error) throw error;
  return data || [];
}
