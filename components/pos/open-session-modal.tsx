// components/pos/open-session-modal.tsx

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { openCashSession } from '@/lib/supabase/pos';
import { formatCurrency, parseNumber } from '@/lib/utils';
import { toast } from 'sonner';
import { DollarSign, AlertCircle, Calculator } from 'lucide-react';
import type { CashSession } from '@/types';

interface OpenSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: CashSession) => void;
}

export function OpenSessionModal({
  isOpen,
  onClose,
  onSuccess,
}: OpenSessionModalProps) {
  const { profile } = useAuth();
  const [openingBalance, setOpeningBalance] = useState('');
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState('');

  // Quick amount buttons
  const quickAmounts = [0, 500, 1000, 2000, 5000, 10000];

  const handleQuickAmount = (amount: number) => {
    setOpeningBalance(amount.toString());
    setError('');
  };

  const handleOpenSession = async () => {
    const balance = parseNumber(openingBalance);

    // Validation
    if (isNaN(balance) || balance < 0) {
      setError('Please enter a valid opening balance');
      return;
    }

    if (!profile?.shop_id || !profile?.id) {
      toast.error('User profile not found');
      return;
    }

    setIsOpening(true);
    setError('');

    try {
      const session = await openCashSession(
        profile.shop_id,
        profile.id,
        balance
      );

      toast.success('Cash session opened successfully');
      onSuccess(session);
    } catch (error: any) {
      console.error('Open session error:', error);
      setError(error.message || 'Failed to open cash session');
      toast.error('Failed to open session');
    } finally {
      setIsOpening(false);
    }
  };

  const handleClose = () => {
    if (!isOpening) {
      setOpeningBalance('');
      setError('');
      onClose();
    }
  };

  const parsedBalance = parseNumber(openingBalance);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Open Cash Session</h3>
            <p className="text-sm text-gray-500">Count your starting cash</p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Instructions */}
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <Calculator className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-emerald-900">
            <p className="font-medium mb-1">How to count your opening balance:</p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Count all cash currently in your drawer</li>
              <li>Enter the total amount below</li>
              <li>This will be your starting point for the day</li>
            </ol>
          </div>
        </div>

        {/* Opening Balance Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Opening Balance (LRD) <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            inputMode="decimal"
            value={openingBalance}
            onChange={(e) => {
              setOpeningBalance(e.target.value);
              setError('');
            }}
            placeholder="0.00"
            className="text-lg text-center font-semibold"
          />
          {parsedBalance > 0 && !isNaN(parsedBalance) && (
            <p className="text-sm text-gray-600 text-center">
              {formatCurrency(parsedBalance)}
            </p>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Quick Amount Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Amounts
          </label>
          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => handleQuickAmount(amount)}
                className={`p-3 text-sm font-medium rounded-lg border-2 transition-colors ${
                  parsedBalance === amount
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-600'
                    : 'border-gray-300 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50'
                }`}
              >
                {amount === 0 ? 'Zero' : formatCurrency(amount)}
              </button>
            ))}
          </div>
        </div>

        {/* Info Alert */}
        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-900">
            <p className="font-medium mb-1">Important</p>
            <ul className="space-y-1">
              <li>• Make sure to count accurately</li>
              <li>• This cannot be changed later without owner approval</li>
              <li>• All cash sales will be tracked from this starting point</li>
            </ul>
          </div>
        </div>

        {/* Session Info */}
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Date:</span>
            <span className="font-medium text-gray-900">
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Employee:</span>
            <span className="font-medium text-gray-900">{profile?.name}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Time:</span>
            <span className="font-medium text-gray-900">
              {new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isOpening}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleOpenSession}
            disabled={isOpening || !openingBalance || parsedBalance < 0}
            className="flex-1"
          >
            {isOpening ? (
              <>
                <Spinner className="mr-2" />
                Opening...
              </>
            ) : (
              'Open Session'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
