// components/shared/confirm-dialog.tsx
'use client';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  isLoading = false,
}: ConfirmDialogProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: '⚠️',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          buttonVariant: 'bg-red-600 hover:bg-red-700',
        };
      case 'warning':
        return {
          icon: '⚡',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          buttonVariant: 'bg-yellow-600 hover:bg-yellow-700',
        };
      default:
        return {
          icon: 'ℹ️',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          buttonVariant: 'bg-emerald-600 hover:bg-emerald-700',
        };
    }
  };

  const styles = getVariantStyles();

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-4">
        {/* Icon */}
        <div className="flex justify-center">
          <div className={`${styles.iconBg} ${styles.iconColor} rounded-full p-3 text-2xl`}>
            {styles.icon}
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        {/* Message */}
        <div className="text-center">
          <p className="text-sm text-gray-600">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 text-white ${styles.buttonVariant}`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
