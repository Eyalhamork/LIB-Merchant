// components/pos/close-session-modal.tsx

'use client';

import { useState } from 'react';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import Spinner from '@/components/ui/spinner';
import { closeCashSession } from '@/lib/supabase/pos';
import { formatCurrency, parseNumber } from '@/lib/utils';
import { toast } from 'sonner';
import { DollarSign, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import type { CashSession } from '@/types';

interface CloseSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: CashSession;
  onSuccess: () => void;
}

export function CloseSessionModal({
  isOpen,
  onClose,
  session,
  onSuccess,
}: CloseSessionModalProps) {
  const [closingBalance, setClosingBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState('');

  // Calculate expected balance
  const expectedBalance =
    session.opening_balance +
    session.cash_sales_total +
    session.cash_credit_payments -
    session.cash_refunds_total;

  const parsedClosing = parseNumber(closingBalance);
  const discrepancy = parsedClosing - expectedBalance;
  const hasDiscrepancy = discrepancy !== 0;
  const isOverage = discrepancy > 0;
  const isShortage = discrepancy < 0;

  // Check if discrepancy exceeds alert threshold (from shop settings)
  const exceedsThreshold = Math.abs(discrepancy) > 500; // This should come from shop settings

  const handleCloseSession = async () => {
    const closing = parseNumber(closingBalance);

    // Validation
    if (isNaN(closing) || closing < 0) {
      setError('Please enter a valid closing balance');
      return;
    }

    if (hasDiscrepancy && !notes.trim()) {
      setError('Please provide notes explaining the discrepancy');
      return;
    }

    setIsClosing(true);
    setError('');

    try {
      await closeCashSession(session.id, closing, notes.trim() || undefined);

      toast.success('Cash session closed successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Close session error:', error);
      setError(error.message || 'Failed to close cash session');
      toast.error('Failed to close session');
    } finally {
      setIsClosing(false);
    }
  };

  const handleClose = () => {
    if (!isClosing) {
      setClosingBalance('');
      setNotes('');
      setError('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Close Cash Session</h3>
            <p className="text-sm text-gray-500">End of day reconciliation</p>
          </div>
        </div>
      }
      size="lg"
    >
      <div className="space-y-6">
        {/* Session Summary */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Session Date:</span>
            <span className="font-medium text-gray-900">
              {new Date(session.session_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Opened at:</span>
            <span className="font-medium text-gray-900">
              {new Date(session.opened_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Cash Breakdown */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 mb-3">Cash Activity</h4>
          
          <div className="flex items-center justify-between text-sm py-2">
            <span className="text-gray-600">Opening Balance:</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(session.opening_balance)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm py-2">
            <span className="text-gray-600">Cash Sales:</span>
            <span className="font-medium text-green-600">
              +{formatCurrency(session.cash_sales_total)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm py-2">
            <span className="text-gray-600">Credit Payments:</span>
            <span className="font-medium text-green-600">
              +{formatCurrency(session.cash_credit_payments)}
            </span>
          </div>

          {session.cash_refunds_total > 0 && (
            <div className="flex items-center justify-between text-sm py-2">
              <span className="text-gray-600">Cash Refunds:</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(session.cash_refunds_total)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-lg font-bold pt-3 border-t border-gray-200">
            <span>Expected Balance:</span>
            <span className="text-emerald-600">{formatCurrency(expectedBalance)}</span>
          </div>
        </div>

        {/* Closing Balance Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Actual Closing Balance (LRD) <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            inputMode="decimal"
            value={closingBalance}
            onChange={(e) => {
              setClosingBalance(e.target.value);
              setError('');
            }}
            placeholder="Count cash in drawer"
            className="text-lg text-center font-semibold"
          />
          {parsedClosing > 0 && !isNaN(parsedClosing) && (
            <p className="text-sm text-gray-600 text-center">
              {formatCurrency(parsedClosing)}
            </p>
          )}
        </div>

        {/* Discrepancy Display */}
        {closingBalance && !isNaN(parsedClosing) && hasDiscrepancy && (
          <div
            className={`p-4 rounded-lg border-2 ${
              isOverage
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {isOverage ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
              <div className="flex-1">
                <p
                  className={`font-semibold ${
                    isOverage ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {isOverage ? 'Overage' : 'Shortage'}
                </p>
                <p
                  className={`text-2xl font-bold ${
                    isOverage ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {isOverage ? '+' : ''}
                  {formatCurrency(discrepancy)}
                </p>
              </div>
            </div>

            {exceedsThreshold && (
              <div className="mt-3 flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-amber-900">
                  This discrepancy exceeds the alert threshold and will be flagged for
                  owner review.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Perfect Match */}
        {closingBalance && !isNaN(parsedClosing) && !hasDiscrepancy && (
          <div className="p-4 rounded-lg border-2 bg-green-50 border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Perfect Match!</p>
                <p className="text-sm text-green-700">
                  Your closing balance matches the expected amount exactly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notes - Required if discrepancy */}
        {closingBalance && !isNaN(parsedClosing) && hasDiscrepancy && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Explanation <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setError('');
              }}
              placeholder="Explain the discrepancy (required)..."
              rows={3}
            />
            <p className="text-xs text-gray-500">
              Please provide details about why the cash count doesn't match the expected
              amount.
            </p>
          </div>
        )}

        {/* Optional Notes */}
        {closingBalance && !isNaN(parsedClosing) && !hasDiscrepancy && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Notes (Optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about today's session..."
              rows={2}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isClosing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCloseSession}
            disabled={isClosing || !closingBalance || parsedClosing < 0}
            className="flex-1"
          >
            {isClosing ? (
              <>
                <Spinner className="mr-2" />
                Closing...
              </>
            ) : (
              'Close Session'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
