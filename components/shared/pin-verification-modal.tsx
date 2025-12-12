// components/shared/pin-verification-modal.tsx

'use client';

import { useState } from 'react';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { verifyOwnerPIN } from '@/lib/supabase/settings';
import { AlertCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface PinVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  userId: string;
  title?: string;
  description?: string;
}

export function PinVerificationModal({
  isOpen,
  onClose,
  onVerified,
  userId,
  title = 'Owner PIN Required',
  description = 'This action requires owner verification. Please enter your PIN to continue.',
}: PinVerificationModalProps) {
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!pin || pin.length < 4) {
      setError('Please enter a valid PIN');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const isValid = await verifyOwnerPIN(userId, pin);

      if (isValid) {
        toast.success('PIN verified');
        setPin('');
        onVerified();
        onClose();
      } else {
        setError('Incorrect PIN. Please try again.');
        setPin('');
      }
    } catch (err) {
      console.error('PIN verification error:', err);
      setError('Failed to verify PIN. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setPin('');
    setError('');
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="space-y-4">
        {/* Icon and description */}
        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <Lock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-900">{description}</p>
        </div>

        {/* PIN Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Owner PIN
          </label>
          <Input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ''));
              setError('');
            }}
            onKeyPress={handleKeyPress}
            placeholder="Enter 4-6 digit PIN"
            className="text-center text-2xl tracking-widest"
            autoFocus
          />
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isVerifying}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying || !pin}
            className="flex-1"
          >
            {isVerifying ? 'Verifying...' : 'Verify PIN'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
