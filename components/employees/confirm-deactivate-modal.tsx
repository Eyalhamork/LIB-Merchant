// components/employees/confirm-deactivate-modal.tsx

'use client';

import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import { AlertTriangle, UserCheck, UserX } from 'lucide-react';

interface ConfirmDeactivateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  employeeName: string;
  isActivating: boolean;
}

export function ConfirmDeactivateModal({
  isOpen,
  onClose,
  onConfirm,
  employeeName,
  isActivating,
}: ConfirmDeactivateModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isActivating ? 'Activate Employee' : 'Deactivate Employee'}
    >
      <div className="space-y-4">
        {/* Warning Icon */}
        <div className="flex justify-center">
          <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
            isActivating ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isActivating ? (
              <UserCheck className="h-8 w-8 text-green-600" />
            ) : (
              <UserX className="h-8 w-8 text-red-600" />
            )}
          </div>
        </div>

        {/* Message */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {isActivating ? 'Activate' : 'Deactivate'} {employeeName}?
          </h3>
          <p className="text-sm text-gray-600">
            {isActivating ? (
              <>
                This will restore <strong>{employeeName}</strong>'s access to the system.
                They will be able to log in and perform their assigned duties.
              </>
            ) : (
              <>
                This will prevent <strong>{employeeName}</strong> from logging in and
                accessing the system. You can reactivate them at any time.
              </>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className={`flex-1 ${
              isActivating
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isActivating ? (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Activate
              </>
            ) : (
              <>
                <UserX className="h-4 w-4 mr-2" />
                Deactivate
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
