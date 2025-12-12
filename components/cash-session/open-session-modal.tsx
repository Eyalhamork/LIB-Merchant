// components/cash-session/open-session-modal.tsx

'use client';

import { useState } from 'react';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { DollarSign, AlertCircle } from 'lucide-react';

interface OpenSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: (openingBalance: number) => Promise<boolean>;
  isOpening: boolean;
}

export function OpenSessionModal({
  isOpen,
  onClose,
  onOpen,
  isOpening,
}: OpenSessionModalProps) {
  const [openingBalance, setOpeningBalance] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const balance = parseFloat(openingBalance);

    if (isNaN(balance) || balance < 0) {
      setError('Please enter a valid amount (0 or greater)');
      return;
    }

    const success = await onOpen(balance);
    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setOpeningBalance('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Open Cash Session">
      <div className="space-y-4">
        {/* Info */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                Start Your Day
              </h4>
              <p className="text-sm text-blue-700">
                Count the cash in your drawer and enter the amount below. This will be
                your opening balance for today.
              </p>
            </div>
          </div>
        </div>

        {/* Opening Balance Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Opening Balance (LRD) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="number"
              min="0"
              step="0.01"
              value={openingBalance}
              onChange={(e) => {
                setOpeningBalance(e.target.value);
                setError('');
              }}
              placeholder="0.00"
              className="pl-10 text-lg font-medium"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <p className="text-xs text-gray-500">
            This is the total cash you have in your drawer right now
          </p>
        </div>

        {/* Quick Amount Buttons */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Quick amounts:</p>
          <div className="grid grid-cols-4 gap-2">
            {[0, 500, 1000, 5000].map((amount) => (
              <button
                key={amount}
                onClick={() => setOpeningBalance(amount.toString())}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {amount === 0 ? 'Zero' : `${amount}`}
              </button>
            ))}
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
            onClick={handleSubmit}
            disabled={isOpening || !openingBalance}
            className="flex-1"
          >
            {isOpening ? 'Opening...' : 'Open Session'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}