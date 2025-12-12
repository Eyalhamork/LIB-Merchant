// lib/supabase/transactions.ts

import { supabase } from './client';
import type { Transaction } from '@/types';

/**
 * Get all transactions for a shop
 */
export async function getTransactions(
  shopId: string,
  startDate?: string,
  endDate?: string
): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select(`
      *,
      employee:profiles!transactions_employee_id_fkey(id, name),
      customer:customers(id, name),
      items:transaction_items(
        *,
        shop_product:shop_products(
          id,
          product:products(id, name, unit)
        )
      ),
      payments:transaction_payments(*),
      cash_session:cash_sessions(id, session_date),
      voided_by_profile:profiles!transactions_voided_by_fkey(id, name)
    `)
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get a single transaction with full details
 */
export async function getTransaction(transactionId: string): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      employee:profiles!transactions_employee_id_fkey(id, name, role),
      customer:customers(id, name, phone, credit_balance),
      items:transaction_items(
        *,
        shop_product:shop_products(
          *,
          product:products(*)
        )
      ),
      payments:transaction_payments(*),
      cash_session:cash_sessions(
        id,
        session_date,
        opening_balance,
        status
      ),
      voided_by_profile:profiles!transactions_voided_by_fkey(id, name)
    `)
    .eq('id', transactionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data;
}

/**
 * Void a transaction
 */
export async function voidTransaction(
  transactionId: string,
  voidedBy: string,
  reason: string
) {
  try {
    // Get the transaction with items
    const transaction = await getTransaction(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status === 'voided') {
      throw new Error('Transaction is already voided');
    }

    // Check if transaction is from today
    const txnDate = new Date(transaction.created_at).toDateString();
    const today = new Date().toDateString();
    if (txnDate !== today) {
      throw new Error('Can only void transactions from the current business day');
    }

    // 1. Update transaction status
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'voided',
        voided_at: new Date().toISOString(),
        voided_by: voidedBy,
        void_reason: reason,
      })
      .eq('id', transactionId);

    if (updateError) throw updateError;

    // 2. Restore inventory
    if (transaction.items) {
      for (const item of transaction.items) {
        // Get current quantity
        const { data: shopProduct } = await supabase
          .from('shop_products')
          .select('current_quantity')
          .eq('id', item.shop_product_id)
          .single();

        if (shopProduct) {
          const newQuantity = shopProduct.current_quantity + item.quantity;

          // Update quantity
          await supabase
            .from('shop_products')
            .update({ current_quantity: newQuantity })
            .eq('id', item.shop_product_id);

          // Log stock movement
          await supabase.from('stock_movements').insert({
            shop_id: transaction.shop_id,
            shop_product_id: item.shop_product_id,
            movement_type: 'adjustment',
            quantity_change: item.quantity,
            quantity_before: shopProduct.current_quantity,
            quantity_after: newQuantity,
            reference_type: 'void',
            reference_id: transactionId,
            user_id: voidedBy,
            notes: `Transaction voided: ${reason}`,
          });
        }
      }
    }

    // 3. Reverse cash session amounts (if applicable)
    if (transaction.cash_session_id && transaction.payments) {
      const cashPayment = transaction.payments.find((p) => p.payment_method === 'cash');
      
      if (cashPayment) {
        const { data: session } = await supabase
          .from('cash_sessions')
          .select('cash_sales_total')
          .eq('id', transaction.cash_session_id)
          .single();

        if (session) {
          await supabase
            .from('cash_sessions')
            .update({
              cash_sales_total: session.cash_sales_total - cashPayment.amount,
            })
            .eq('id', transaction.cash_session_id);
        }
      }
    }

    // 4. Reverse customer credit (if credit sale)
    if (transaction.customer_id && transaction.payments) {
      const creditPayment = transaction.payments.find((p) => p.payment_method === 'credit');
      
      if (creditPayment) {
        const { data: customer } = await supabase
          .from('customers')
          .select('credit_balance')
          .eq('id', transaction.customer_id)
          .single();

        if (customer) {
          await supabase
            .from('customers')
            .update({
              credit_balance: customer.credit_balance - creditPayment.amount,
            })
            .eq('id', transaction.customer_id);
        }
      }
    }

    // 5. Log activity
    await supabase.from('activity_log').insert({
      shop_id: transaction.shop_id,
      user_id: voidedBy,
      activity_type: 'sale_voided',
      reference_type: 'transaction',
      reference_id: transactionId,
      description: `Voided transaction ${transaction.receipt_number}`,
      metadata: {
        receipt_number: transaction.receipt_number,
        amount: transaction.total_amount,
        reason: reason,
      },
    });

    return true;
  } catch (error) {
    console.error('Void transaction error:', error);
    throw error;
  }
}

/**
 * Get transaction statistics for a date range
 */
export async function getTransactionStats(
  shopId: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await supabase
    .from('transactions')
    .select('total_amount, discount_amount, status, created_at, payments:transaction_payments(payment_method, amount)')
    .eq('shop_id', shopId)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (error) throw error;

  const completed = data.filter((t) => t.status === 'completed');
  const voided = data.filter((t) => t.status === 'voided');

  const stats = {
    total_transactions: data.length,
    completed_transactions: completed.length,
    voided_transactions: voided.length,
    total_sales: completed.reduce((sum, t) => sum + t.total_amount, 0),
    total_discounts: completed.reduce((sum, t) => sum + t.discount_amount, 0),
    by_payment_method: {
      cash: 0,
      mtn_momo: 0,
      orange_money: 0,
      credit: 0,
    },
  };

  // Calculate by payment method
  completed.forEach((txn) => {
    txn.payments?.forEach((payment: any) => {
      if (payment.payment_method in stats.by_payment_method) {
        stats.by_payment_method[payment.payment_method as keyof typeof stats.by_payment_method] += payment.amount;
      }
    });
  });

  return stats;
}

/**
 * Get today's transactions
 */
export async function getTodayTransactions(shopId: string): Promise<Transaction[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getTransactions(shopId, today.toISOString(), tomorrow.toISOString());
}

/**
 * Get transactions for an employee
 */
export async function getEmployeeTransactions(
  shopId: string,
  employeeId: string,
  startDate?: string,
  endDate?: string
): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select(`
      *,
      employee:profiles!transactions_employee_id_fkey(id, name),
      customer:customers(id, name),
      items:transaction_items(
        *,
        shop_product:shop_products(
          id,
          product:products(id, name)
        )
      ),
      payments:transaction_payments(*)
    `)
    .eq('shop_id', shopId)
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}
