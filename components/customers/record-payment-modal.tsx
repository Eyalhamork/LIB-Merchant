// components/customers/record-payment-modal.tsx

'use client';

import { useState } from 'react';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import Textarea from '@/components/ui/textarea';
import Spinner from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { recordCreditPayment } from '@/lib/supabase/credit-payments';
import { formatCurrency } from '@/lib/utils';
import type { Customer, PaymentMethod } from '@/types';
import { toast } from 'sonner';
import { AlertCircle, DollarSign } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  cashSessionId?: string;
  onSuccess: () => void;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  customer,
  cashSessionId,
  onSuccess,
}: RecordPaymentModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'cash' as PaymentMethod,
    notes: '',
  });
  const [error, setError] = useState('');

  const handleReset = () => {
    setFormData({
      amount: '',
      payment_method: 'cash',
      notes: '',
    });
    setError('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const validate = () => {
    const amount = parseFloat(formData.amount);

    if (!formData.amount || isNaN(amount) || amount <= 0) {
      setError('Please enter a valid payment amount');
      return false;
    }

    if (amount > customer.credit_balance) {
      setError(
        `Payment amount (${formatCurrency(amount)}) exceeds credit balance (${formatCurrency(
          customer.credit_balance
        )})`
      );
      return false;
    }

    // If cash payment but no active session, warn
    if (formData.payment_method === 'cash' && !cashSessionId) {
      setError('No active cash session. Please open a cash session first.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate() || !user) return;

    setIsSubmitting(true);

    try {
      await recordCreditPayment({
        shop_id: user.profile.shop_id,
        customer_id: customer.id,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        recorded_by: user.id,
        cash_session_id:
          formData.payment_method === 'cash' ? cashSessionId : undefined,
        notes: formData.notes.trim() || undefined,
      });

      toast.success('Payment recorded successfully');
      handleReset();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Record payment error:', err);
      setError(err.message || 'Failed to record payment');
      toast.error('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Record Credit Payment">
      <div className="space-y-4">
        {/* Customer Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-blue-900">{customer.name}</p>
              {customer.phone && (
                <p className="text-sm text-blue-700 mt-1">{customer.phone}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-700">Current Balance</p>
              <p className="text-xl font-bold text-blue-900">
                {formatCurrency(customer.credit_balance)}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Amount */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Payment Amount (LRD) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="number"
              min="0"
              step="0.01"
              max={customer.credit_balance}
              value={formData.amount}
              onChange={(e) => {
                setFormData({ ...formData, amount: e.target.value });
                setError('');
              }}
              placeholder="0.00"
              className="pl-10"
              autoFocus
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Maximum: {formatCurrency(customer.credit_balance)}</span>
            {formData.amount && parseFloat(formData.amount) > 0 && (
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, amount: customer.credit_balance.toString() })
                }
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Pay in Full
              </button>
            )}
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Payment Method <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.payment_method}
            onChange={(e) =>
              setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })
            }
          >
            <option value="cash">Cash</option>
            <option value="mtn_momo">MTN MoMo</option>
            <option value="orange_money">Orange Money</option>
          </Select>
          {formData.payment_method === 'cash' && !cashSessionId && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              Warning: No active cash session
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Notes (Optional)
          </label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Add any additional notes..."
            rows={3}
          />
        </div>

        {/* Remaining Balance Preview */}
        {formData.amount && parseFloat(formData.amount) > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700 font-medium">
                New Balance After Payment
              </span>
              <span className="text-lg font-bold text-green-900">
                {formatCurrency(customer.credit_balance - parseFloat(formData.amount))}
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <Spinner className="mr-2" />
                Recording...
              </>
            ) : (
              'Record Payment'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
