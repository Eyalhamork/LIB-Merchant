// components/returns/refund-method-step.tsx

'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/button';
import Textarea from '@/components/ui/textarea';
import Spinner from '@/components/ui/spinner';
import { formatCurrency } from '@/lib/utils';
import type { Transaction, RefundMethod } from '@/types';

interface ReturnItem {
  shop_product_id: string;
  product_name: string;
  quantity: number;
  price_at_sale: number;
  reason: string;
  reason_notes: string;
  restore_to_stock: boolean;
}

interface RefundMethodStepProps {
  transaction: Transaction;
  returnItems: ReturnItem[];
  onProcess: (method: RefundMethod, notes: string) => void;
  onBack: () => void;
  isProcessing: boolean;
}

interface RefundBreakdown {
  method: string;
  amount: number;
}

export function RefundMethodStep({
  transaction,
  returnItems,
  onProcess,
  onBack,
  isProcessing,
}: RefundMethodStepProps) {
  const [selectedMethod, setSelectedMethod] = useState<RefundMethod>('cash');
  const [notes, setNotes] = useState('');
  const [refundBreakdown, setRefundBreakdown] = useState<RefundBreakdown[]>([]);

  const totalRefund = returnItems.reduce(
    (sum, item) => sum + item.quantity * item.price_at_sale,
    0
  );

  useEffect(() => {
    // Calculate refund breakdown based on original payments
    if (selectedMethod === 'cash' && transaction.payments) {
      const breakdown: RefundBreakdown[] = [];
      let remaining = totalRefund;

      // Priority: Cash first
      const cashPayment = transaction.payments.find((p) => p.payment_method === 'cash');
      if (cashPayment && remaining > 0) {
        const cashRefund = Math.min(remaining, cashPayment.amount);
        breakdown.push({
          method: 'Cash',
          amount: cashRefund,
        });
        remaining -= cashRefund;
      }

      // Then Mobile Money
      if (remaining > 0) {
        const momoPayments = transaction.payments.filter(
          (p) => p.payment_method === 'mtn_momo' || p.payment_method === 'orange_money'
        );

        for (const payment of momoPayments) {
          if (remaining <= 0) break;

          const momoRefund = Math.min(remaining, payment.amount);
          breakdown.push({
            method: payment.payment_method === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money',
            amount: momoRefund,
          });
          remaining -= momoRefund;
        }
      }

      // If still remaining, note that credit cannot be auto-refunded
      if (remaining > 0) {
        breakdown.push({
          method: 'Requires Owner Approval',
          amount: remaining,
        });
      }

      setRefundBreakdown(breakdown);
    } else {
      setRefundBreakdown([]);
    }
  }, [selectedMethod, transaction.payments, totalRefund]);

  const handleSubmit = () => {
    onProcess(selectedMethod, notes);
  };

  const getMethodLabel = (method: RefundMethod) => {
    switch (method) {
      case 'cash':
        return 'Cash Refund';
      case 'credit_to_account':
        return 'Credit to Customer Account';
      case 'exchange':
        return 'Exchange for Other Items';
      default:
        return method;
    }
  };

  const getMethodDescription = (method: RefundMethod) => {
    switch (method) {
      case 'cash':
        return 'Refund cash to customer. Follows payment priority rules.';
      case 'credit_to_account':
        return 'Add refund amount to customer credit balance for future purchases.';
      case 'exchange':
        return 'Customer exchanges returned items for other products.';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Select Refund Method
        </h2>
        <p className="text-sm text-gray-600">
          Choose how to refund the customer
        </p>
      </div>

      {/* Refund Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-blue-900">Total Refund Amount</p>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(totalRefund)}
          </p>
        </div>
        <div className="text-sm text-blue-700">
          <p>{returnItems.length} item(s) being returned</p>
        </div>
      </div>

      {/* Refund Method Options */}
      <div className="space-y-3">
        <label className="block">
          <input
            type="radio"
            name="refund_method"
            value="cash"
            checked={selectedMethod === 'cash'}
            onChange={(e) => setSelectedMethod(e.target.value as RefundMethod)}
            className="sr-only peer"
          />
          <div className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 peer-checked:border-blue-600 peer-checked:bg-blue-50 transition-colors">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:border-blue-600 peer-checked:bg-blue-600 flex items-center justify-center">
                  {selectedMethod === 'cash' && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="font-medium text-gray-900">{getMethodLabel('cash')}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {getMethodDescription('cash')}
                </p>
              </div>
            </div>
          </div>
        </label>

        <label className="block">
          <input
            type="radio"
            name="refund_method"
            value="credit_to_account"
            checked={selectedMethod === 'credit_to_account'}
            onChange={(e) => setSelectedMethod(e.target.value as RefundMethod)}
            className="sr-only peer"
            disabled={!transaction.customer_id}
          />
          <div className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed transition-colors">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:border-blue-600 peer-checked:bg-blue-600 flex items-center justify-center">
                  {selectedMethod === 'credit_to_account' && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="font-medium text-gray-900">
                  {getMethodLabel('credit_to_account')}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {getMethodDescription('credit_to_account')}
                </p>
                {!transaction.customer_id && (
                  <p className="text-sm text-red-600 mt-1">
                    Not available - no customer linked to original transaction
                  </p>
                )}
              </div>
            </div>
          </div>
        </label>

        <label className="block">
          <input
            type="radio"
            name="refund_method"
            value="exchange"
            checked={selectedMethod === 'exchange'}
            onChange={(e) => setSelectedMethod(e.target.value as RefundMethod)}
            className="sr-only peer"
          />
          <div className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 peer-checked:border-blue-600 peer-checked:bg-blue-50 transition-colors">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:border-blue-600 peer-checked:bg-blue-600 flex items-center justify-center">
                  {selectedMethod === 'exchange' && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="font-medium text-gray-900">{getMethodLabel('exchange')}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {getMethodDescription('exchange')}
                </p>
              </div>
            </div>
          </div>
        </label>
      </div>

      {/* Refund Breakdown (for cash refunds) */}
      {selectedMethod === 'cash' && refundBreakdown.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Refund Breakdown</h3>
          <div className="space-y-2">
            {refundBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{item.method}</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
          {refundBreakdown.some((b) => b.method === 'Requires Owner Approval') && (
            <p className="text-xs text-amber-600 mt-3">
              ⚠️ Part of the refund requires owner approval as it exceeds the original payment methods.
            </p>
          )}
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Additional Notes (Optional)
        </label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional notes about this return..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Spinner className="mr-2" />
              Processing...
            </>
          ) : (
            'Process Return'
          )}
        </Button>
      </div>
    </div>
  );
}
