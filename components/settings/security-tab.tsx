// components/settings/security-tab.tsx

'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Modal from '@/components/ui/modal';
import {
  setupOwnerPIN,
  changeOwnerPIN,
  changePassword,
  hasPinSetup,
} from '@/lib/supabase/settings';
import { Profile } from '@/types';
import { toast } from 'sonner';
import { Lock, Key, Shield, AlertCircle, CheckCircle } from 'lucide-react';

interface SecurityTabProps {
  profile: Profile;
}

export function SecurityTab({ profile }: SecurityTabProps) {
  const [pinExists, setPinExists] = useState(false);
  const [isCheckingPin, setIsCheckingPin] = useState(true);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    checkPinStatus();
  }, [profile.id]);

  const checkPinStatus = async () => {
    setIsCheckingPin(true);
    try {
      const hasPin = await hasPinSetup(profile.id);
      setPinExists(hasPin);
    } catch (error) {
      console.error('Error checking PIN status:', error);
    } finally {
      setIsCheckingPin(false);
    }
  };

  // Only show security options to owners
  const isOwner = profile.role === 'owner';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
          <Shield className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
          <p className="text-sm text-gray-500">Manage your password and PIN</p>
        </div>
      </div>

      {/* Security Options */}
      <div className="space-y-4">
        {/* Owner PIN - Owner Only */}
        {isOwner && (
          <div className="p-4 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Key className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Owner PIN</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    4-6 digit PIN required for sensitive operations like negative inventory
                    adjustments
                  </p>
                  {!isCheckingPin && (
                    <div className="flex items-center gap-2 mt-2">
                      {pinExists ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-700 font-medium">
                            PIN is set up
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <span className="text-sm text-amber-700 font-medium">
                            PIN not set up
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => setIsPinModalOpen(true)}
              className="w-full sm:w-auto"
            >
              {pinExists ? 'Change PIN' : 'Set Up PIN'}
            </Button>
          </div>
        )}

        {/* Password */}
        <div className="p-4 border border-gray-200 rounded-lg space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Lock className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Password</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Change your account password for logging in
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full sm:w-auto"
          >
            Change Password
          </Button>
        </div>

        {/* Security Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900">Security Tips</h4>
              <ul className="mt-2 space-y-1 text-sm text-blue-800">
                <li>• Use a strong, unique password</li>
                <li>• Don't share your PIN with anyone</li>
                <li>• Change your password regularly</li>
                {isOwner && <li>• Your PIN protects critical inventory operations</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* PIN Setup/Change Modal */}
      {isOwner && (
        <PinModal
          isOpen={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          userId={profile.id}
          hasExistingPin={pinExists}
          onSuccess={() => {
            checkPinStatus();
            setIsPinModalOpen(false);
          }}
        />
      )}

      {/* Password Change Modal */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}

// PIN Setup/Change Modal Component
function PinModal({
  isOpen,
  onClose,
  userId,
  hasExistingPin,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  hasExistingPin: boolean;
  onSuccess: () => void;
}) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleReset = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setError('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSave = async () => {
    setError('');

    // Validate new PIN
    if (!/^\d{4,6}$/.test(newPin)) {
      setError('PIN must be 4-6 digits');
      return;
    }

    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setIsSaving(true);

    try {
      if (hasExistingPin) {
        // Change existing PIN
        if (!currentPin) {
          setError('Please enter your current PIN');
          setIsSaving(false);
          return;
        }
        await changeOwnerPIN(userId, currentPin, newPin);
        toast.success('PIN changed successfully');
      } else {
        // Set up new PIN
        await setupOwnerPIN(userId, newPin);
        toast.success('PIN set up successfully');
      }

      handleReset();
      onSuccess();
    } catch (err: any) {
      console.error('PIN operation error:', err);
      setError(err.message || 'Failed to save PIN. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={hasExistingPin ? 'Change Owner PIN' : 'Set Up Owner PIN'}
    >
      <div className="space-y-4">
        {/* Info */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-900">
            Your PIN will be required for sensitive operations like negative inventory
            adjustments. Keep it secure and don't share it with anyone.
          </p>
        </div>

        {/* Current PIN (if changing) */}
        {hasExistingPin && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Current PIN <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={currentPin}
              onChange={(e) => {
                setCurrentPin(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              placeholder="Enter current PIN"
              className="text-center text-lg tracking-widest"
            />
          </div>
        )}

        {/* New PIN */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {hasExistingPin ? 'New PIN' : 'PIN'} <span className="text-red-500">*</span>
          </label>
          <Input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={newPin}
            onChange={(e) => {
              setNewPin(e.target.value.replace(/\D/g, ''));
              setError('');
            }}
            placeholder="Enter 4-6 digit PIN"
            className="text-center text-lg tracking-widest"
          />
        </div>

        {/* Confirm PIN */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Confirm PIN <span className="text-red-500">*</span>
          </label>
          <Input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={confirmPin}
            onChange={(e) => {
              setConfirmPin(e.target.value.replace(/\D/g, ''));
              setError('');
            }}
            placeholder="Re-enter PIN"
            className="text-center text-lg tracking-widest"
          />
        </div>

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
            disabled={isSaving}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving ? 'Saving...' : hasExistingPin ? 'Change PIN' : 'Set Up PIN'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Password Change Modal Component
function PasswordModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleReset = () => {
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSave = async () => {
    setError('');

    // Validate password
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSaving(true);

    try {
      await changePassword(newPassword);
      toast.success('Password changed successfully');
      handleReset();
      onSuccess();
    } catch (err: any) {
      console.error('Password change error:', err);
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Change Password">
      <div className="space-y-4">
        {/* Info */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            Choose a strong password with at least 8 characters. You'll use this to log in
            to your account.
          </p>
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            New Password <span className="text-red-500">*</span>
          </label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setError('');
            }}
            placeholder="Enter new password"
          />
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError('');
            }}
            placeholder="Re-enter new password"
          />
        </div>

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
            disabled={isSaving}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving ? 'Saving...' : 'Change Password'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
