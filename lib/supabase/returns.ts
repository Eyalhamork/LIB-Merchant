// lib/supabase/returns-updated.ts

import { supabase } from './client';
import type { ReturnReason, RefundMethod, PaymentMethod } from '@/types';

interface ProcessReturnData {
  shop_id: string;
  original_transaction_id: string;
  employee_id: string;
  customer_id?: string;
  cash_session_id?: string;
  refund_method: RefundMethod;
  items: {
    shop_product_id: string;
    quantity: number;
    price_at_sale: number;
    reason: ReturnReason;
    reason_notes: string;
    restore_to_stock: boolean;
  }[];
  notes?: string;
}

interface ProcessExchangeData extends ProcessReturnData {
  exchange_items: {
    shop_product_id: string;
    quantity: number;
    price: number;
  }[];
  payment_due: number;
  payment_method?: PaymentMethod;
  amount_given?: number;
}

/**
 * Search for transactions to return
 */
export async function searchTransactions(shopId: string, query: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      items:transaction_items(
        *,
        shop_product:shop_products(
          *,
          product:products(*)
        )
      ),
      payments:transaction_payments(*),
      customer:customers(*)
    `)
    .eq('shop_id', shopId)
    .eq('status', 'completed')
    .or(`receipt_number.ilike.%${query}%,notes.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
}

/**
 * Get all returns for a shop
 */
export async function getReturns(shopId: string) {
  const { data, error } = await supabase
    .from('returns')
    .select(`
      *,
      employee:profiles!returns_employee_id_fkey(name),
      customer:customers(name),
      items:return_items(*),
      new_transaction:transactions(receipt_number, total_amount)
    `)
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get a single return with details
 */
export async function getReturn(returnId: string) {
  const { data, error } = await supabase
    .from('returns')
    .select(`
      *,
      employee:profiles!returns_employee_id_fkey(name),
      customer:customers(name),
      items:return_items(
        *,
        shop_product:shop_products(
          *,
          product:products(*)
        )
      ),
      original_transaction:transactions(
        *,
        items:transaction_items(*)
      ),
      new_transaction:transactions(
        *,
        items:transaction_items(*)
      )
    `)
    .eq('id', returnId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Process a regular return (cash, credit, or exchange setup)
 */
export async function processReturn(data: ProcessReturnData) {
  try {
    // Calculate total refund
    const totalRefund = data.items.reduce(
      (sum, item) => sum + item.quantity * item.price_at_sale,
      0
    );

    // 1. Create return record
    const { data: returnData, error: returnError } = await supabase
      .from('returns')
      .insert({
        shop_id: data.shop_id,
        original_transaction_id: data.original_transaction_id,
        employee_id: data.employee_id,
        customer_id: data.customer_id,
        cash_session_id: data.cash_session_id,
        total_refund_amount: totalRefund,
        refund_method: data.refund_method,
        notes: data.notes,
      })
      .select()
      .single();

    if (returnError) throw returnError;

    // 2. Create return items
    const returnItems = data.items.map((item) => ({
      return_id: returnData.id,
      shop_product_id: item.shop_product_id,
      quantity: item.quantity,
      refund_amount: item.quantity * item.price_at_sale,
      reason: item.reason,
      reason_notes: item.reason_notes || null,
      restore_to_stock: item.restore_to_stock,
    }));

    const { error: itemsError } = await supabase
      .from('return_items')
      .insert(returnItems);

    if (itemsError) throw itemsError;

    // 3. Update inventory for items being restored to stock
    for (const item of data.items) {
      if (item.restore_to_stock) {
        const { data: shopProduct } = await supabase
          .from('shop_products')
          .select('current_quantity')
          .eq('id', item.shop_product_id)
          .single();

        if (shopProduct) {
          const newQuantity = shopProduct.current_quantity + item.quantity;

          await supabase
            .from('shop_products')
            .update({ current_quantity: newQuantity })
            .eq('id', item.shop_product_id);

          await supabase.from('stock_movements').insert({
            shop_id: data.shop_id,
            shop_product_id: item.shop_product_id,
            movement_type: 'return',
            quantity_change: item.quantity,
            quantity_before: shopProduct.current_quantity,
            quantity_after: newQuantity,
            reference_type: 'return',
            reference_id: returnData.id,
            user_id: data.employee_id,
            notes: `Return - ${item.reason}`,
          });
        }
      }
    }

    // 4. Handle refund method specific actions
    if (data.refund_method === 'credit_to_account' && data.customer_id) {
      const { data: customer } = await supabase
        .from('customers')
        .select('credit_balance')
        .eq('id', data.customer_id)
        .single();

      if (customer) {
        await supabase
          .from('customers')
          .update({
            credit_balance: customer.credit_balance - totalRefund,
          })
          .eq('id', data.customer_id);
      }
    } else if (data.refund_method === 'cash' && data.cash_session_id) {
      const { data: session } = await supabase
        .from('cash_sessions')
        .select('cash_refunds_total')
        .eq('id', data.cash_session_id)
        .single();

      if (session) {
        await supabase
          .from('cash_sessions')
          .update({
            cash_refunds_total: session.cash_refunds_total + totalRefund,
          })
          .eq('id', data.cash_session_id);
      }
    }

    // 5. Log activity
    await supabase.from('activity_log').insert({
      shop_id: data.shop_id,
      user_id: data.employee_id,
      activity_type: 'return_processed',
      reference_type: 'return',
      reference_id: returnData.id,
      description: `Processed return of ${formatCurrency(totalRefund)} via ${data.refund_method}`,
      metadata: {
        original_transaction_id: data.original_transaction_id,
        refund_method: data.refund_method,
        items_count: data.items.length,
        total_refund: totalRefund,
      },
    });

    return returnData;
  } catch (error) {
    console.error('Process return error:', error);
    throw error;
  }
}

/**
 * Process an exchange (return + new sale in one transaction)
 */
export async function processExchange(data: ProcessExchangeData) {
  try {
    // Calculate totals
    const totalRefund = data.items.reduce(
      (sum, item) => sum + item.quantity * item.price_at_sale,
      0
    );
    const exchangeTotal = data.exchange_items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    // 1. Create return record
    const { data: returnData, error: returnError } = await supabase
      .from('returns')
      .insert({
        shop_id: data.shop_id,
        original_transaction_id: data.original_transaction_id,
        employee_id: data.employee_id,
        customer_id: data.customer_id,
        cash_session_id: data.cash_session_id,
        total_refund_amount: totalRefund,
        refund_method: 'exchange',
        notes: data.notes,
      })
      .select()
      .single();

    if (returnError) throw returnError;

    // 2. Create return items and restore inventory
    const returnItems = data.items.map((item) => ({
      return_id: returnData.id,
      shop_product_id: item.shop_product_id,
      quantity: item.quantity,
      refund_amount: item.quantity * item.price_at_sale,
      reason: item.reason,
      reason_notes: item.reason_notes || null,
      restore_to_stock: item.restore_to_stock,
    }));

    await supabase.from('return_items').insert(returnItems);

    // Restore inventory
    for (const item of data.items) {
      if (item.restore_to_stock) {
        const { data: shopProduct } = await supabase
          .from('shop_products')
          .select('current_quantity')
          .eq('id', item.shop_product_id)
          .single();

        if (shopProduct) {
          const newQuantity = shopProduct.current_quantity + item.quantity;
          await supabase
            .from('shop_products')
            .update({ current_quantity: newQuantity })
            .eq('id', item.shop_product_id);

          await supabase.from('stock_movements').insert({
            shop_id: data.shop_id,
            shop_product_id: item.shop_product_id,
            movement_type: 'return',
            quantity_change: item.quantity,
            quantity_before: shopProduct.current_quantity,
            quantity_after: newQuantity,
            reference_type: 'return',
            reference_id: returnData.id,
            user_id: data.employee_id,
            notes: `Exchange return - ${item.reason}`,
          });
        }
      }
    }

    // 3. Create new transaction for exchange items
    const { data: newTransaction, error: txnError } = await supabase
      .from('transactions')
      .insert({
        shop_id: data.shop_id,
        employee_id: data.employee_id,
        customer_id: data.customer_id,
        cash_session_id: data.cash_session_id,
        subtotal: exchangeTotal,
        discount_amount: 0,
        total_amount: data.payment_due > 0 ? data.payment_due : 0,
        notes: `Exchange transaction (Return ID: ${returnData.id.slice(0, 8)})`,
      })
      .select()
      .single();

    if (txnError) throw txnError;

    // 4. Link exchange transaction to return
    await supabase
      .from('returns')
      .update({ new_transaction_id: newTransaction.id })
      .eq('id', returnData.id);

    // 5. Create transaction items
    const transactionItems = data.exchange_items.map((item) => ({
      transaction_id: newTransaction.id,
      shop_product_id: item.shop_product_id,
      quantity: item.quantity,
      price_at_sale: item.price,
      subtotal: item.quantity * item.price,
    }));

    await supabase.from('transaction_items').insert(transactionItems);

    // 6. Deduct inventory
    for (const item of data.exchange_items) {
      const { data: shopProduct } = await supabase
        .from('shop_products')
        .select('current_quantity')
        .eq('id', item.shop_product_id)
        .single();

      if (shopProduct) {
        const newQuantity = shopProduct.current_quantity - item.quantity;
        await supabase
          .from('shop_products')
          .update({ current_quantity: newQuantity })
          .eq('id', item.shop_product_id);

        await supabase.from('stock_movements').insert({
          shop_id: data.shop_id,
          shop_product_id: item.shop_product_id,
          movement_type: 'sale',
          quantity_change: -item.quantity,
          quantity_before: shopProduct.current_quantity,
          quantity_after: newQuantity,
          reference_type: 'transaction',
          reference_id: newTransaction.id,
          user_id: data.employee_id,
          notes: 'Exchange sale',
        });
      }
    }

    // 7. Handle payment if customer owes difference
    if (data.payment_due > 0 && data.payment_method) {
      await supabase.from('transaction_payments').insert({
        transaction_id: newTransaction.id,
        payment_method: data.payment_method,
        amount: data.payment_due,
        amount_given: data.amount_given,
        change_given: data.amount_given ? data.amount_given - data.payment_due : 0,
      });

      // Update cash session if paid in cash
      if (data.payment_method === 'cash' && data.cash_session_id) {
        const { data: session } = await supabase
          .from('cash_sessions')
          .select('cash_sales_total')
          .eq('id', data.cash_session_id)
          .single();

        if (session) {
          await supabase
            .from('cash_sessions')
            .update({
              cash_sales_total: session.cash_sales_total + data.payment_due,
            })
            .eq('id', data.cash_session_id);
        }
      }
    } else if (data.payment_due < 0) {
      // Customer gets refund of difference (treated as return credit applied to exchange)
      const refundAmount = Math.abs(data.payment_due);
      
      // Record as cash refund if applicable
      if (data.cash_session_id) {
        const { data: session } = await supabase
          .from('cash_sessions')
          .select('cash_refunds_total')
          .eq('id', data.cash_session_id)
          .single();

        if (session) {
          await supabase
            .from('cash_sessions')
            .update({
              cash_refunds_total: session.cash_refunds_total + refundAmount,
            })
            .eq('id', data.cash_session_id);
        }
      }
    }

    // 8. Log activity
    await supabase.from('activity_log').insert({
      shop_id: data.shop_id,
      user_id: data.employee_id,
      activity_type: 'return_processed',
      reference_type: 'return',
      reference_id: returnData.id,
      description: `Processed exchange: returned ${formatCurrency(totalRefund)}, new items ${formatCurrency(exchangeTotal)}`,
      metadata: {
        original_transaction_id: data.original_transaction_id,
        new_transaction_id: newTransaction.id,
        refund_method: 'exchange',
        items_count: data.items.length,
        exchange_items_count: data.exchange_items.length,
        total_refund: totalRefund,
        exchange_total: exchangeTotal,
        payment_due: data.payment_due,
      },
    });

    return { returnData, newTransaction };
  } catch (error) {
    console.error('Process exchange error:', error);
    throw error;
  }
}

/**
 * Get return statistics for dashboard
 */
export async function getReturnStats(shopId: string, startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('returns')
    .select('total_refund_amount, refund_method, created_at')
    .eq('shop_id', shopId)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (error) throw error;

  const stats = {
    total_returns: data.length,
    total_refunded: data.reduce((sum, r) => sum + r.total_refund_amount, 0),
    by_method: {
      cash: data.filter((r) => r.refund_method === 'cash').length,
      credit: data.filter((r) => r.refund_method === 'credit_to_account').length,
      exchange: data.filter((r) => r.refund_method === 'exchange').length,
    },
  };

  return stats;
}

// Helper function for formatting
function formatCurrency(amount: number): string {
  return `${amount.toFixed(2)} LRD`;
}