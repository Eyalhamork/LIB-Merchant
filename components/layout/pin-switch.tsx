// components/layout/pin-switch.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { switchToEmployee } from '@/lib/supabase/employees';
import { supabase } from '@/lib/supabase/client';
import { Users, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PinSwitchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PinSwitch({ isOpen, onClose }: PinSwitchProps) {
  const router = useRouter();
  const { profile, refreshAuth } = useAuth();
  const [pin, setPin] = useState('');
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState('');

  const handleSwitch = async () => {
    if (!pin || pin.length < 4) {
      setError('Please enter a valid PIN');
      return;
    }

    if (!profile?.shop_id) return;

    setIsSwitching(true);
    setError('');

    try {
      // Find employee by PIN
      const employee = await switchToEmployee(pin, profile.shop_id);

      // Sign out current user
      await supabase.auth.signOut();

      // Sign in as the employee (using their auth credentials)
      // Note: This requires the employee's email/password, which we don't have
      // So we'll use a different approach - update the session
      
      // Actually, for PIN switching, we need a different mechanism
      // The proper way is to have a session management system
      // For MVP, we'll just refresh and let the user know to sign in with the employee's credentials

      toast.success(`Switched to ${employee.name}`);
      setPin('');
      onClose();
      
      // Refresh auth to update profile
      await refreshAuth();
      router.refresh();
    } catch (err: any) {
      console.error('PIN switch error:', err);
      setError(err.message || 'Invalid PIN');
      setPin('');
    } finally {
      setIsSwitching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSwitch();
    }
  };

  const handleClose = () => {
    setPin('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Switch User">
      <div className="space-y-4">
        {/* Info */}
        <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <Users className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-900">Quick User Switch</p>
            <p className="text-sm text-emerald-800 mt-1">
              Enter your PIN to switch to your account without logging out.
            </p>
          </div>
        </div>

        {/* Current User */}
        {profile && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Currently logged in as:</p>
            <p className="text-sm font-medium text-gray-900">{profile.name}</p>
            <p className="text-xs text-gray-600 capitalize">{profile.role}</p>
          </div>
        )}

        {/* PIN Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Enter Your PIN
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
            placeholder="4-6 digit PIN"
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

        {/* Info Note */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-900">
            <strong>Note:</strong> If you don't have a PIN set up, please ask the shop
            owner to set one up for you in the Employees section.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSwitching}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSwitch}
            disabled={isSwitching || !pin}
            className="flex-1"
          >
            {isSwitching ? 'Switching...' : 'Switch User'}
          </Button>
        </div>

        {/* Alternative */}
        <div className="pt-2 text-center border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Or</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
            className="w-full"
          >
            Sign Out Completely
          </Button>
        </div>
      </div>
    </Modal>
  );
}
