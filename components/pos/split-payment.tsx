// components/pos/split-payment.tsx

'use client';

import { Plus, X } from 'lucide-react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { PaymentSelector } from './payment-selector';
import { formatCurrency, cn } from '@/lib/utils';
import type { PaymentMethod, PaymentEntry } from '@/types';

interface SplitPaymentProps {
  totalAmount: number;
  payments: PaymentEntry[];
  onAddPayment: (payment: PaymentEntry) => void;
  onRemovePayment: (index: number) => void;
  requireCustomerForCredit?: boolean;
  hasCustomer?: boolean;
}

export function SplitPayment({
  totalAmount,
  payments,
  onAddPayment,
  onRemovePayment,
  requireCustomerForCredit = true,
  hasCustomer = false,
}: SplitPaymentProps) {
  const [selectedMethod, setSelectedMethod] = React.useState<PaymentMethod>('cash');
  const [amount, setAmount] = React.useState('');

  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = totalAmount - paidAmount;
  const usedMethods = payments.map((p) => p.method);

  const handleAddPayment = () => {
    const paymentAmount = parseFloat(amount);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return;
    }

    if (paymentAmount > remaining) {
      // Auto-adjust to remaining amount
      onAddPayment({
        method: selectedMethod,
        amount: remaining,
      });
    } else {
      onAddPayment({
        method: selectedMethod,
        amount: paymentAmount,
      });
    }

    setAmount('');
  };

  const handleSetExactRemaining = () => {
    setAmount(remaining.toFixed(2));
  };

  const canAddPayment =
    amount &&
    parseFloat(amount) > 0 &&
    remaining > 0 &&
    (selectedMethod !== 'credit' || !requireCustomerForCredit || hasCustomer);

  return (
    <div className="space-y-4">
      {/* Total & Remaining */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <div className="flex items-center justify-between text-lg">
          <span className="font-medium text-gray-700">Total Amount:</span>
          <span className="font-bold text-gray-900">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        {remaining > 0 && (
          <div className="flex items-center justify-between text-base pt-2 border-t border-gray-300">
            <span className="font-medium text-amber-700">Remaining:</span>
            <span className="font-bold text-amber-600">
              {formatCurrency(remaining)}
            </span>
          </div>
        )}

        {remaining === 0 && paidAmount > 0 && (
          <div className="flex items-center justify-center gap-2 text-green-600 pt-2 border-t border-gray-300">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">Payment Complete</span>
          </div>
        )}
      </div>

      {/* Existing Payments */}
      {payments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Payments Added:</h4>
          {payments.map((payment, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded capitalize">
                  {payment.method.replace('_', ' ')}
                </span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(payment.amount)}
                </span>
              </div>

              <button
                onClick={() => onRemovePayment(index)}
                className="text-red-600 hover:text-red-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Payment Form */}
      {remaining > 0 && (
        <div className="space-y-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700">Add Payment:</h4>

          {/* Payment Method Selector */}
          <PaymentSelector
            selectedMethod={selectedMethod}
            onChange={setSelectedMethod}
            usedMethods={usedMethods}
          />

          {/* Credit Warning */}
          {selectedMethod === 'credit' && requireCustomerForCredit && !hasCustomer && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <svg
                className="h-5 w-5 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Please select a customer to use credit payment</span>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                max={remaining}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1"
              />
              <Button
                variant="secondary"
                onClick={handleSetExactRemaining}
                className="whitespace-nowrap"
              >
                {formatCurrency(remaining)}
              </Button>
            </div>
          </div>

          {/* Add Button */}
          <Button
            onClick={handleAddPayment}
            disabled={!canAddPayment}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Payment
          </Button>
        </div>
      )}
    </div>
  );
}

// React import for useState
import React from 'react';
