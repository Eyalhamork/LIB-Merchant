// components/customers/customer-form.tsx

'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import { createCustomer, updateCustomer } from '@/lib/supabase/customers';
import type { Customer } from '@/types';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

interface CustomerFormProps {
  shopId: string;
  customer?: Customer; // If provided, it's edit mode
  onSuccess: (customer: Customer) => void;
  onCancel?: () => void;
}

export function CustomerForm({
  shopId,
  customer,
  onSuccess,
  onCancel,
}: CustomerFormProps) {
  const isEditMode = !!customer;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || '',
    credit_limit: customer?.credit_limit?.toString() || '',
    notes: customer?.notes || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.phone && formData.phone.replace(/\D/g, '').length < 7) {
      newErrors.phone = 'Invalid phone number';
    }

    if (formData.credit_limit) {
      const limit = parseFloat(formData.credit_limit);
      if (isNaN(limit) || limit < 0) {
        newErrors.credit_limit = 'Credit limit must be a positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const data = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        credit_limit: formData.credit_limit
          ? parseFloat(formData.credit_limit)
          : undefined,
        notes: formData.notes.trim() || undefined,
      };

      let result: Customer;

      if (isEditMode) {
        result = await updateCustomer(customer.id, shopId, data);
        toast.success('Customer updated successfully');
      } else {
        result = await createCustomer(shopId, data);
        toast.success('Customer added successfully');
      }

      onSuccess(result);
    } catch (error: any) {
      console.error('Customer form error:', error);
      toast.error(error.message || 'Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Customer Name <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => {
            setFormData({ ...formData, name: e.target.value });
            setErrors({ ...errors, name: '' });
          }}
          placeholder="Enter customer name"
          error={errors.name}
        />
        {errors.name && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {errors.name}
          </p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Phone Number
        </label>
        <Input
          type="tel"
          value={formData.phone}
          onChange={(e) => {
            setFormData({ ...formData, phone: e.target.value });
            setErrors({ ...errors, phone: '' });
          }}
          placeholder="0770123456"
          error={errors.phone}
        />
        {errors.phone && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {errors.phone}
          </p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value });
            setErrors({ ...errors, email: '' });
          }}
          placeholder="customer@example.com"
          error={errors.email}
        />
        {errors.email && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {errors.email}
          </p>
        )}
      </div>

      {/* Address */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Address</label>
        <Input
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Enter address"
        />
      </div>

      {/* Credit Limit */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Credit Limit (LRD)
        </label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={formData.credit_limit}
          onChange={(e) => {
            setFormData({ ...formData, credit_limit: e.target.value });
            setErrors({ ...errors, credit_limit: '' });
          }}
          placeholder="Optional - maximum credit allowed"
          error={errors.credit_limit}
        />
        {errors.credit_limit && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {errors.credit_limit}
          </p>
        )}
        <p className="text-xs text-gray-500">
          Leave empty for no limit. Prevents credit sales exceeding this amount.
        </p>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Add any additional notes about this customer..."
          rows={3}
        />
      </div>

      {/* Info Box */}
      {!isEditMode && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-emerald-900">About Customer Records</p>
              <p className="text-xs text-emerald-700 mt-1">
                Customer records help track credit sales and purchase history. Only name
                is required, but adding contact information helps with credit follow-ups.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting
            ? isEditMode
              ? 'Updating...'
              : 'Adding...'
            : isEditMode
            ? 'Update Customer'
            : 'Add Customer'}
        </Button>
      </div>
    </form>
  );
}
