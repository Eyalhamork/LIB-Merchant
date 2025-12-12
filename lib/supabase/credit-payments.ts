// lib/supabase/credit-payments.ts

import { supabase } from './client';
import { reduceCustomerCredit } from './customers';
import type { PaymentMethod, CreditPayment } from '@/types';

/**
 * Record a credit payment from a customer
 */
export async function recordCreditPayment(data: {
  shop_id: string;
  customer_id: string;
  amount: number;
  payment_method: PaymentMethod;
  recorded_by: string;
  cash_session_id?: string;
  notes?: string;
}) {
  // Validate amount
  if (data.amount <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }

  // Get customer to check balance
  const { data: customer } = await supabase
    .from('customers')
    .select('credit_balance, name')
    .eq('id', data.customer_id)
    .single();

  if (!customer) {
    throw new Error('Customer not found');
  }

  if (data.amount > customer.credit_balance) {
    throw new Error(
      `Payment amount (${data.amount}) exceeds credit balance (${customer.credit_balance})`
    );
  }

  // Insert credit payment record
  const { data: payment, error: paymentError } = await supabase
    .from('credit_payments')
    .insert({
      shop_id: data.shop_id,
      customer_id: data.customer_id,
      amount: data.amount,
      payment_method: data.payment_method,
      recorded_by: data.recorded_by,
      cash_session_id: data.cash_session_id,
      notes: data.notes,
    })
    .select()
    .single();

  if (paymentError) throw paymentError;

  // Update customer credit balance
  await reduceCustomerCredit(data.customer_id, data.amount);

  // If cash payment, update cash session
  if (data.payment_method === 'cash' && data.cash_session_id) {
    const { data: session } = await supabase
      .from('cash_sessions')
      .select('cash_credit_payments')
      .eq('id', data.cash_session_id)
      .single();

    if (session) {
      await supabase
        .from('cash_sessions')
        .update({
          cash_credit_payments: session.cash_credit_payments + data.amount,
        })
        .eq('id', data.cash_session_id);
    }
  }

  // Log activity
  await supabase.from('activity_log').insert({
    shop_id: data.shop_id,
    user_id: data.recorded_by,
    activity_type: 'credit_payment',
    reference_type: 'credit_payment',
    reference_id: payment.id,
    description: `Recorded credit payment of ${data.amount} from ${customer.name}`,
    metadata: {
      customer_id: data.customer_id,
      customer_name: customer.name,
      amount: data.amount,
      payment_method: data.payment_method,
    },
  });

  return payment;
}

/**
 * Get credit payment history for a customer
 */
export async function getCreditPaymentHistory(customerId: string) {
  const { data, error } = await supabase
    .from('credit_payments')
    .select(`
      *,
      recorder:profiles!credit_payments_recorded_by_fkey(id, name),
      cash_session:cash_sessions(id, session_date)
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get all credit payments for a shop in a date range
 */
export async function getCreditPayments(
  shopId: string,
  startDate?: string,
  endDate?: string
) {
  let query = supabase
    .from('credit_payments')
    .select(`
      *,
      customer:customers(id, name, phone),
      recorder:profiles!credit_payments_recorded_by_fkey(id, name),
      cash_session:cash_sessions(id, session_date)
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
  return data;
}

/**
 * Get credit payment statistics for a date range
 */
export async function getCreditPaymentStats(
  shopId: string,
  startDate: string,
  endDate: string
) {
  const { data: payments, error } = await supabase
    .from('credit_payments')
    .select('amount, payment_method, created_at')
    .eq('shop_id', shopId)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (error) throw error;

  const stats = {
    total_payments: payments.length,
    total_amount: payments.reduce((sum, p) => sum + p.amount, 0),
    by_method: {
      cash: payments.filter((p) => p.payment_method === 'cash')
        .reduce((sum, p) => sum + p.amount, 0),
      mtn_momo: payments.filter((p) => p.payment_method === 'mtn_momo')
        .reduce((sum, p) => sum + p.amount, 0),
      orange_money: payments.filter((p) => p.payment_method === 'orange_money')
        .reduce((sum, p) => sum + p.amount, 0),
    },
  };

  return stats;
}

/**
 * Get today's credit payments
 */
export async function getTodayCreditPayments(shopId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getCreditPayments(
    shopId,
    today.toISOString(),
    tomorrow.toISOString()
  );
}
