// components/cash-session/close-session-modal.tsx

'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';
import type { CashSession } from '@/types';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface CloseSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseSession: (closingBalance: number, notes?: string) => Promise<boolean>;
  session: CashSession;
  expectedBalance: number;
  discrepancyThreshold: number;
  isClosing: boolean;
}

export function CloseSessionModal({
  isOpen,
  onClose,
  onCloseSession,
  session,
  expectedBalance,
  discrepancyThreshold,
  isClosing,
}: CloseSessionModalProps) {
  const [closingBalance, setClosingBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [discrepancy, setDiscrepancy] = useState(0);
  const [showDiscrepancyWarning, setShowDiscrepancyWarning] = useState(false);

  useEffect(() => {
    if (closingBalance) {
      const balance = parseFloat(closingBalance);
      if (!isNaN(balance)) {
        const diff = balance - expectedBalance;
        setDiscrepancy(diff);
        setShowDiscrepancyWarning(Math.abs(diff) > discrepancyThreshold);
      }
    } else {
      setDiscrepancy(0);
      setShowDiscrepancyWarning(false);
    }
  }, [closingBalance, expectedBalance, discrepancyThreshold]);

  const handleSubmit = async () => {
    const balance = parseFloat(closingBalance);

    if (isNaN(balance) || balance < 0) {
      return;
    }

    // Require notes if high discrepancy
    if (showDiscrepancyWarning && !notes.trim()) {
      return;
    }

    const success = await onCloseSession(balance, notes.trim() || undefined);
    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setClosingBalance('');
    setNotes('');
    setDiscrepancy(0);
    setShowDiscrepancyWarning(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Close Cash Session">
      <div className="space-y-4">
        {/* Session Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-gray-900 mb-3">Session Summary</h4>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Opening Balance:</span>
            <span className="font-medium">
              {formatCurrency(session.opening_balance)}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Cash Sales:</span>
            <span className="font-medium text-green-600">
              +{formatCurrency(session.cash_sales_total)}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Credit Payments:</span>
            <span className="font-medium text-green-600">
              +{formatCurrency(session.cash_credit_payments)}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Cash Refunds:</span>
            <span className="font-medium text-red-600">
              -{formatCurrency(session.cash_refunds_total)}
            </span>
          </div>

          <div className="flex justify-between text-base pt-2 border-t border-gray-300">
            <span className="font-semibold text-gray-900">Expected Balance:</span>
            <span className="font-bold text-gray-900">
              {formatCurrency(expectedBalance)}
            </span>
          </div>
        </div>

        {/* Closing Balance Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Actual Closing Balance (LRD) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="number"
              min="0"
              step="0.01"
              value={closingBalance}
              onChange={(e) => setClosingBalance(e.target.value)}
              placeholder="0.00"
              className="pl-10 text-lg font-medium"
              autoFocus
            />
          </div>
          <p className="text-xs text-gray-500">
            Count all the cash in your drawer right now
          </p>
        </div>

        {/* Discrepancy Display */}
        {closingBalance && !isNaN(parseFloat(closingBalance)) && (
          <div
            className={`p-4 rounded-lg border ${
              Math.abs(discrepancy) < 0.01
                ? 'bg-green-50 border-green-200'
                : discrepancy > 0
                ? 'bg-blue-50 border-blue-200'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {Math.abs(discrepancy) < 0.01 ? (
                  <>
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 font-bold">✓</span>
                    </div>
                    <span className="font-medium text-green-900">Balanced!</span>
                  </>
                ) : discrepancy > 0 ? (
                  <>
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Surplus</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-5 w-5 text-amber-600" />
                    <span className="font-medium text-amber-900">Shortage</span>
                  </>
                )}
              </div>
              <span
                className={`text-lg font-bold ${
                  Math.abs(discrepancy) < 0.01
                    ? 'text-green-900'
                    : discrepancy > 0
                    ? 'text-blue-900'
                    : 'text-amber-900'
                }`}
              >
                {Math.abs(discrepancy) < 0.01
                  ? '0.00 LRD'
                  : `${discrepancy > 0 ? '+' : '-'}${formatCurrency(
                      Math.abs(discrepancy)
                    )}`}
              </span>
            </div>
          </div>
        )}

        {/* High Discrepancy Warning */}
        {showDiscrepancyWarning && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-900">
                  High Discrepancy Alert
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  The discrepancy exceeds the threshold of{' '}
                  {formatCurrency(discrepancyThreshold)}. Please explain the difference
                  below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notes (Required for high discrepancy) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Notes {showDiscrepancyWarning && <span className="text-red-500">*</span>}
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              showDiscrepancyWarning
                ? 'Explain the discrepancy...'
                : 'Optional notes about this session...'
            }
            rows={3}
          />
        </div>

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
            onClick={handleSubmit}
            disabled={
              isClosing ||
              !closingBalance ||
              isNaN(parseFloat(closingBalance)) ||
              (showDiscrepancyWarning && !notes.trim())
            }
            className="flex-1"
          >
            {isClosing ? 'Closing...' : 'Close Session'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}