// components/auth/shop-details-step.tsx

'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import Textarea from '@/components/ui/textarea';

const BUSINESS_TYPES = [
  { value: 'provision', label: 'Provision Shop' },
  { value: 'hardware', label: 'Hardware Store' },
  { value: 'phone_electronics', label: 'Phone/Electronics Shop' },
  { value: 'cosmetics', label: 'Cosmetics/Beauty Supply' },
  { value: 'general', label: 'General Retail' },
];

interface ShopDetailsStepProps {
  initialData: {
    shop_name: string;
    business_type: string;
    address: string;
    shop_phone: string;
  };
  onSubmit: (data: {
    shop_name: string;
    business_type: string;
    address: string;
    shop_phone: string;
  }) => void;
  onBack: () => void;
}

export function ShopDetailsStep({ initialData, onSubmit, onBack }: ShopDetailsStepProps) {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.shop_name.trim()) {
      newErrors.shop_name = 'Shop name is required';
    }

    if (!formData.business_type) {
      newErrors.business_type = 'Please select a business type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Shop Details
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Tell us about your shop
        </p>
      </div>

      <div>
        <label htmlFor="shop_name" className="block text-sm font-medium text-gray-700 mb-1">
          Shop Name *
        </label>
        <Input
          id="shop_name"
          type="text"
          value={formData.shop_name}
          onChange={(e) => handleChange('shop_name', e.target.value)}
          placeholder="e.g., John's Provision Shop"
          error={errors.shop_name}
        />
        {errors.shop_name && (
          <p className="mt-1 text-sm text-red-600">{errors.shop_name}</p>
        )}
      </div>

      <div>
        <label htmlFor="business_type" className="block text-sm font-medium text-gray-700 mb-1">
          Business Type *
        </label>
        <Select
          id="business_type"
          value={formData.business_type}
          onChange={(e) => handleChange('business_type', e.target.value)}
          error={errors.business_type}
        >
          <option value="">Select business type</option>
          {BUSINESS_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </Select>
        {errors.business_type && (
          <p className="mt-1 text-sm text-red-600">{errors.business_type}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          We'll pre-load relevant products for your business type
        </p>
      </div>

      <div>
        <label htmlFor="shop_phone" className="block text-sm font-medium text-gray-700 mb-1">
          Shop Phone Number
        </label>
        <Input
          id="shop_phone"
          type="tel"
          value={formData.shop_phone}
          onChange={(e) => handleChange('shop_phone', e.target.value)}
          placeholder="+231 770 123 456"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Shop Address (Optional)
        </label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="Enter your shop's physical address"
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          className="flex-1"
        >
          Back
        </Button>
        <Button type="submit" className="flex-1">
          Continue
        </Button>
      </div>
    </form>
  );
}
