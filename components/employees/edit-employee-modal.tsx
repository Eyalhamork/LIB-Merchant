// components/employees/edit-employee-modal.tsx

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import {
  updateEmployee,
  deactivateEmployee,
  activateEmployee,
  setupEmployeePIN,
} from '@/lib/supabase/employees';
import { ConfirmDeactivateModal } from './confirm-deactivate-modal';
import { Profile, UserRole } from '@/types';
import { toast } from 'sonner';
import { AlertCircle, UserX, UserCheck, Key } from 'lucide-react';

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Profile;
  onSuccess: () => void;
}

export function EditEmployeeModal({
  isOpen,
  onClose,
  employee,
  onSuccess,
}: EditEmployeeModalProps) {
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showConfirmDeactivate, setShowConfirmDeactivate] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [formData, setFormData] = useState({
    name: employee.name,
    phone: employee.phone || '',
    role: employee.role as UserRole,
    can_change_prices: employee.can_change_prices ?? true,
    can_process_returns: employee.can_process_returns ?? true,
    can_void_transactions: employee.can_void_transactions ?? true,
    discount_limit_percent: employee.discount_limit_percent ?? 10,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isOwner = employee.role === 'owner';

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (
      formData.discount_limit_percent < 0 ||
      formData.discount_limit_percent > 100
    ) {
      newErrors.discount_limit_percent = 'Must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validate()) return;
    if (!profile?.shop_id) return;

    setIsSubmitting(true);

    try {
      await updateEmployee(employee.id, profile.shop_id, profile.id, {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        role: formData.role,
        can_change_prices:
          formData.role === 'supervisor' ? formData.can_change_prices : undefined,
        can_process_returns:
          formData.role === 'supervisor' ? formData.can_process_returns : undefined,
        can_void_transactions:
          formData.role === 'supervisor' ? formData.can_void_transactions : undefined,
        discount_limit_percent:
          formData.role === 'supervisor' ? formData.discount_limit_percent : undefined,
      });

      toast.success('Employee updated successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Update employee error:', error);
      toast.error(error.message || 'Failed to update employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!profile?.shop_id) return;

    setIsSubmitting(true);
    setShowConfirmDeactivate(false);

    try {
      if (employee.is_active) {
        await deactivateEmployee(employee.id, profile.shop_id, profile.id);
        toast.success(`${employee.name} has been deactivated`);
      } else {
        await activateEmployee(employee.id, profile.shop_id, profile.id);
        toast.success(`${employee.name} has been activated`);
      }
      onSuccess();
    } catch (error: any) {
      console.error('Toggle status error:', error);
      toast.error(error.message || 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetupPin = async () => {
    if (!newPin || !/^\d{4,6}$/.test(newPin)) {
      toast.error('PIN must be 4-6 digits');
      return;
    }

    if (!profile?.shop_id) return;

    setIsSubmitting(true);

    try {
      await setupEmployeePIN(employee.id, profile.shop_id, profile.id, newPin);
      toast.success('PIN set up successfully');
      setShowPinSetup(false);
      setNewPin('');
      onSuccess();
    } catch (error: any) {
      console.error('Setup PIN error:', error);
      toast.error(error.message || 'Failed to set up PIN');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Edit Employee">
        <div className="space-y-4">
          {/* Owner Warning */}
          {isOwner && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900">
                  This is the shop owner account. Role and permissions cannot be changed.
                </p>
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Basic Information
            </h3>

            {/* Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setErrors({ ...errors, name: '' });
                }}
                placeholder="Enter full name"
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0770123456"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <div className="flex items-center gap-2">
                {employee.is_active ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <UserCheck className="h-4 w-4" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    <UserX className="h-4 w-4" />
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Role & Permissions */}
          {!isOwner && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Role & Permissions
              </h3>

              {/* Role */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Role <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as UserRole })
                  }
                >
                  <option value="employee">Employee</option>
                  <option value="supervisor">Supervisor</option>
                </Select>
              </div>

              {/* Supervisor Permissions */}
              {formData.role === 'supervisor' && (
                <div className="space-y-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-sm font-medium text-emerald-900 mb-2">
                    Supervisor Permissions
                  </p>

                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={formData.can_change_prices}
                      onChange={(e) =>
                        setFormData({ ...formData, can_change_prices: e.target.checked })
                      }
                      className="mt-1"
                    />
                    <div>
                      <span className="text-sm text-gray-900">Can change prices</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={formData.can_process_returns}
                      onChange={(e) =>
                        setFormData({ ...formData, can_process_returns: e.target.checked })
                      }
                      className="mt-1"
                    />
                    <div>
                      <span className="text-sm text-gray-900">Can process returns</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={formData.can_void_transactions}
                      onChange={(e) =>
                        setFormData({ ...formData, can_void_transactions: e.target.checked })
                      }
                      className="mt-1"
                    />
                    <div>
                      <span className="text-sm text-gray-900">Can void transactions</span>
                    </div>
                  </label>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900">
                      Discount Limit (%)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount_limit_percent}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discount_limit_percent: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                    {errors.discount_limit_percent && (
                      <p className="text-sm text-red-600">{errors.discount_limit_percent}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PIN Management */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  PIN Code
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {employee.pin_code ? 'PIN is set up' : 'No PIN set up'}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowPinSetup(!showPinSetup)}
              >
                <Key className="h-4 w-4 mr-1" />
                {employee.pin_code ? 'Change PIN' : 'Set Up PIN'}
              </Button>
            </div>

            {showPinSetup && (
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700">
                  New 4-6 Digit PIN
                </label>
                <Input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter new PIN"
                  className="text-center tracking-widest"
                />
                <Button
                  onClick={handleSetupPin}
                  disabled={isSubmitting || !newPin}
                  size="sm"
                  className="w-full"
                >
                  {isSubmitting ? 'Setting up...' : 'Save PIN'}
                </Button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
            {/* Update Button */}
            <Button onClick={handleUpdate} disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Updating...' : 'Update Employee'}
            </Button>

            {/* Toggle Status Button */}
            {!isOwner && (
              <Button
                variant="secondary"
                onClick={() => setShowConfirmDeactivate(true)}
                disabled={isSubmitting}
                className="w-full"
              >
                {employee.is_active ? (
                  <>
                    <UserX className="h-4 w-4 mr-2" />
                    Deactivate Employee
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Activate Employee
                  </>
                )}
              </Button>
            )}

            {/* Close Button */}
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmDeactivateModal
        isOpen={showConfirmDeactivate}
        onClose={() => setShowConfirmDeactivate(false)}
        onConfirm={handleToggleStatus}
        employeeName={employee.name}
        isActivating={!employee.is_active}
      />
    </>
  );
}