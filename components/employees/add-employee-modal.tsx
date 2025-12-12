// components/employees/add-employee-modal.tsx

'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { createEmployee } from '@/lib/supabase/employees';
import { UserRole } from '@/types';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddEmployeeModal({ isOpen, onClose, onSuccess }: AddEmployeeModalProps) {
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'employee' as UserRole,
    pin_code: '',
    // Supervisor permissions
    can_change_prices: true,
    can_process_returns: true,
    can_void_transactions: true,
    discount_limit_percent: 10,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.pin_code && !/^\d{4,6}$/.test(formData.pin_code)) {
      newErrors.pin_code = 'PIN must be 4-6 digits';
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

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!profile?.shop_id) return;

    setIsSubmitting(true);

    try {
      await createEmployee(profile.shop_id, profile.id, {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        role: formData.role,
        pin_code: formData.pin_code || undefined,
        can_change_prices:
          formData.role === 'supervisor' ? formData.can_change_prices : undefined,
        can_process_returns:
          formData.role === 'supervisor' ? formData.can_process_returns : undefined,
        can_void_transactions:
          formData.role === 'supervisor' ? formData.can_void_transactions : undefined,
        discount_limit_percent:
          formData.role === 'supervisor' ? formData.discount_limit_percent : undefined,
      });

      toast.success('Employee added successfully');
      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error('Add employee error:', error);
      toast.error(error.message || 'Failed to add employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'employee',
      pin_code: '',
      can_change_prices: true,
      can_process_returns: true,
      can_void_transactions: true,
      discount_limit_percent: 10,
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Employee">
      <div className="space-y-4">
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

          {/* Email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setErrors({ ...errors, email: '' });
              }}
              placeholder="employee@example.com"
            />
            {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
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

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Password <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                setErrors({ ...errors, password: '' });
              }}
              placeholder="Minimum 8 characters"
            />
            {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
          </div>
        </div>

        {/* Role & Permissions */}
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
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            >
              <option value="employee">Employee</option>
              <option value="supervisor">Supervisor</option>
            </Select>
            <p className="text-xs text-gray-500">
              {formData.role === 'supervisor'
                ? 'Supervisors have elevated permissions for daily operations'
                : 'Employees can only record sales'}
            </p>
          </div>

          {/* Supervisor Permissions */}
          {formData.role === 'supervisor' && (
            <div className="space-y-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">
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
                  <p className="text-xs text-gray-600">
                    Allow editing product selling prices
                  </p>
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
                  <p className="text-xs text-gray-600">Allow handling customer returns</p>
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
                  <p className="text-xs text-gray-600">
                    Allow voiding sales (same day only)
                  </p>
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

        {/* PIN Setup */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            PIN Code (Optional)
          </h3>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              4-6 Digit PIN
            </label>
            <Input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={formData.pin_code}
              onChange={(e) => {
                setFormData({ ...formData, pin_code: e.target.value.replace(/\D/g, '') });
                setErrors({ ...errors, pin_code: '' });
              }}
              placeholder="Optional quick switch PIN"
              className="text-center tracking-widest"
            />
            {errors.pin_code && <p className="text-sm text-red-600">{errors.pin_code}</p>}
            <p className="text-xs text-gray-500">
              PIN allows quick switching between users on the same device
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900">
              The employee will receive login credentials via email. Make sure the email
              address is correct.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Adding...' : 'Add Employee'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
