// components/transactions/void-transaction-modal.tsx

'use client';

import { useState } from 'react';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import Textarea from '@/components/ui/textarea';
import Spinner from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { voidTransaction } from '@/lib/supabase/transactions';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { Transaction } from '@/types';

interface VoidTransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
  onSuccess: () => void;
}

export function VoidTransactionModal({
  transaction,
  onClose,
  onSuccess,
}: VoidTransactionModalProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);
  const [error, setError] = useState('');

  const handleVoid = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for voiding this transaction');
      return;
    }

    if (!user) return;

    setIsVoiding(true);
    setError('');

    try {
      await voidTransaction(transaction.id, user.id, reason);
      toast.success('Transaction voided successfully');
      onSuccess();
    } catch (error) {
      console.error('Void transaction error:', error);
      toast.error('Failed to void transaction');
      setError('Failed to void transaction. Please try again.');
    } finally {
      setIsVoiding(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Void Transaction">
      <div className="space-y-4">
        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-amber-900">
                Warning: This action cannot be undone
              </h3>
              <div className="mt-1 text-sm text-amber-700">
                <p>Voiding this transaction will:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Restore inventory to stock</li>
                  <li>Reverse cash session amounts</li>
                  <li>Remove from sales totals</li>
                  <li>Cannot be reversed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="border border-gray-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Receipt Number</p>
            <p className="font-medium text-gray-900">
              {transaction.receipt_number}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="font-medium text-gray-900">
              {formatCurrency(transaction.total_amount)}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Items</p>
            <p className="font-medium text-gray-900">
              {transaction.items?.length || 0}
            </p>
          </div>
          {transaction.customer && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Customer</p>
              <p className="font-medium text-gray-900">
                {transaction.customer.name}
              </p>
            </div>
          )}
        </div>

        {/* Reason Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason for Voiding *
          </label>
          <Textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError('');
            }}
            placeholder="Explain why this transaction is being voided..."
            rows={4}
            error={error}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isVoiding}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleVoid}
            disabled={isVoiding}
            className="flex-1"
          >
            {isVoiding ? (
              <>
                <Spinner className="mr-2" />
                Voiding...
              </>
            ) : (
              'Void Transaction'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
