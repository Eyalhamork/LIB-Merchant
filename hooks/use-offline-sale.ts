// hooks/use-offline-sale.ts

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useOfflineStore } from '@/store/offline-store';
import { createSale } from '@/lib/supabase/pos';
import { generateUUID } from '@/lib/utils';
import type { CartItem, PaymentEntry, Customer } from '@/types';

interface CreateSaleParams {
  items: CartItem[];
  payments: PaymentEntry[];
  customer?: Customer | null;
  discount?: number;
}

interface CreateSaleResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  isQueued?: boolean;
}

export function useOfflineSale() {
  const { profile } = useAuth();
  const { isOnline, addToQueue } = useOfflineStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const createSaleTransaction = async (
    params: CreateSaleParams
  ): Promise<CreateSaleResult> => {
    if (!profile?.shop_id || !profile?.id) {
      return {
        success: false,
        error: 'User profile not found',
      };
    }

    setIsProcessing(true);

    try {
      // Prepare sale data
      const saleData = {
        shop_id: profile.shop_id,
        employee_id: profile.id,
        customer_id: params.customer?.id,
        cash_session_id: undefined as string | undefined, // Will be set by API
        items: params.items,
        payments: params.payments,
        discount_amount: params.discount || 0,
        notes: '',
      };

      if (isOnline) {
        // Online - create sale directly
        const transaction = await createSale(saleData);

        return {
          success: true,
          transactionId: transaction.transaction_id,
        };
      } else {
        // Offline - queue for later
        const localId = generateUUID();

        const offlineTransaction = {
          local_id: localId,
          shop_id: profile.shop_id,
          employee_id: profile.id,
          customer_id: params.customer?.id,
          items: params.items,
          payments: params.payments,
          total_amount: params.items.reduce((sum, item) => sum + item.subtotal, 0),
          discount_amount: params.discount || 0,
          subtotal: params.items.reduce((sum, item) => sum + item.subtotal, 0),
          created_at: new Date().toISOString(),
          sync_status: 'pending' as const,
        };

        addToQueue(offlineTransaction);

        return {
          success: true,
          transactionId: localId,
          isQueued: true,
        };
      }
    } catch (error: any) {
      console.error('Create sale error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create sale',
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    createSale: createSaleTransaction,
    isProcessing,
  };
}
