// lib/sync-service.ts

'use client';

import { supabase } from './supabase/client';
import type { OfflineTransaction, SyncStatus } from '@/types';
import { generateReceiptNumber } from './utils';

export interface SyncResult {
  localId: string;
  status: SyncStatus;
  error?: string;
  transactionId?: string;
}

export class SyncService {
  /**
   * Sync a single offline transaction
   */
  static async syncTransaction(
    offlineTransaction: OfflineTransaction
  ): Promise<SyncResult> {
    try {
      // 1. Validate stock availability for all items
      const stockValidation = await this.validateStock(offlineTransaction);
      if (!stockValidation.valid) {
        return {
          localId: offlineTransaction.local_id,
          status: 'conflict',
          error: stockValidation.error,
        };
      }

      // 2. Create transaction in database
      const { data: transaction, error: txnError } = await supabase
        .from('transactions')
        .insert({
          shop_id: offlineTransaction.shop_id,
          employee_id: offlineTransaction.employee_id,
          customer_id: offlineTransaction.customer_id,
          subtotal: offlineTransaction.subtotal,
          discount_amount: offlineTransaction.discount_amount,
          total_amount: offlineTransaction.total_amount,
          receipt_number: generateReceiptNumber(
            new Date(offlineTransaction.created_at),
            0
          ),
          local_id: offlineTransaction.local_id,
          sync_status: 'synced',
          synced_at: new Date().toISOString(),
          created_at: offlineTransaction.created_at, // Preserve original timestamp
        })
        .select()
        .single();

      if (txnError) throw txnError;

      // 3. Insert transaction items
      const items = offlineTransaction.items.map((item) => ({
        transaction_id: transaction.id,
        shop_product_id: item.shop_product_id,
        quantity: item.quantity,
        price_at_sale: item.price,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(items);

      if (itemsError) throw itemsError;

      // 4. Insert payments
      const payments = offlineTransaction.payments.map((payment) => ({
        transaction_id: transaction.id,
        payment_method: payment.method,
        amount: payment.amount,
        amount_given: payment.amount_given,
        change_given: payment.change_given,
        reference_number: payment.reference_number,
      }));

      const { error: paymentsError } = await supabase
        .from('transaction_payments')
        .insert(payments);

      if (paymentsError) throw paymentsError;

      // 5. Update inventory (deduct stock)
      for (const item of offlineTransaction.items) {
        const { error: stockError } = await supabase.rpc('deduct_stock', {
          p_shop_product_id: item.shop_product_id,
          p_quantity: item.quantity,
        });

        if (stockError) throw stockError;
      }

      // 6. Update customer credit if applicable
      const creditPayment = offlineTransaction.payments.find(
        (p) => p.method === 'credit'
      );
      if (creditPayment && offlineTransaction.customer_id) {
        const { error: creditError } = await supabase.rpc(
          'add_customer_credit',
          {
            p_customer_id: offlineTransaction.customer_id,
            p_amount: creditPayment.amount,
          }
        );

        if (creditError) throw creditError;
      }

      // 7. Log activity
      await supabase.from('activity_log').insert({
        shop_id: offlineTransaction.shop_id,
        user_id: offlineTransaction.employee_id,
        activity_type: 'sale_completed',
        reference_type: 'transaction',
        reference_id: transaction.id,
        description: `Offline sale synced: ${transaction.receipt_number}`,
        metadata: {
          synced_from_offline: true,
          original_timestamp: offlineTransaction.created_at,
        },
      });

      return {
        localId: offlineTransaction.local_id,
        status: 'synced',
        transactionId: transaction.id,
      };
    } catch (error: any) {
      console.error('Sync transaction error:', error);
      return {
        localId: offlineTransaction.local_id,
        status: 'failed',
        error: error.message || 'Failed to sync transaction',
      };
    }
  }

  /**
   * Sync multiple transactions
   */
  static async syncTransactions(
    transactions: OfflineTransaction[]
  ): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    for (const transaction of transactions) {
      const result = await this.syncTransaction(transaction);
      results.push(result);
    }

    return results;
  }

  /**
   * Validate stock availability
   */
  private static async validateStock(
    transaction: OfflineTransaction
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const productIds = transaction.items.map((item) => item.shop_product_id);

      const { data: products, error } = await supabase
        .from('shop_products')
        .select('id, current_quantity, product:products(name)')
        .in('id', productIds);

      if (error) throw error;

      // Check each item
      for (const item of transaction.items) {
        const product = products?.find((p) => p.id === item.shop_product_id);

        if (!product) {
          return {
            valid: false,
            error: `Product not found`,
          };
        }

        if (product.current_quantity < item.quantity) {
          return {
            valid: false,
            error: `Insufficient stock for ${product.product?.name}. Available: ${product.current_quantity}, Required: ${item.quantity}`,
          };
        }
      }

      return { valid: true };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Stock validation failed',
      };
    }
  }

  /**
   * Retry failed transaction
   */
  static async retryTransaction(
    transaction: OfflineTransaction
  ): Promise<SyncResult> {
    return this.syncTransaction(transaction);
  }

  /**
   * Get sync statistics
   */
  static getSyncStats(transactions: OfflineTransaction[]) {
    return {
      total: transactions.length,
      pending: transactions.filter((t) => t.sync_status === 'pending').length,
      synced: transactions.filter((t) => t.sync_status === 'synced').length,
      conflict: transactions.filter((t) => t.sync_status === 'conflict').length,
      failed: transactions.filter((t) => t.sync_status === 'failed').length,
    };
  }
}
