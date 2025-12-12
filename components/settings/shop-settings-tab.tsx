// components/settings/shop-settings-tab.tsx

'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import { updateShopSettings } from '@/lib/supabase/settings';
import { Shop, Profile } from '@/types';
import { toast } from 'sonner';
import { Store, Settings } from 'lucide-react';

interface ShopSettingsTabProps {
  shop: Shop;
  profile: Profile;
  onUpdate: () => void;
}

const BUSINESS_TYPES = [
  { value: 'provision', label: 'Provision Shop' },
  { value: 'hardware', label: 'Hardware Store' },
  { value: 'phone_electronics', label: 'Phone/Electronics Shop' },
  { value: 'cosmetics', label: 'Cosmetics/Beauty' },
  { value: 'general', label: 'General Retail' },
];

export function ShopSettingsTab({ shop, profile, onUpdate }: ShopSettingsTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: shop.name,
    phone: shop.phone || '',
    address: shop.address || '',
    business_type: shop.business_type || '',
    low_stock_threshold: shop.low_stock_threshold,
    discrepancy_alert_threshold: shop.discrepancy_alert_threshold,
    supervisor_enabled: shop.supervisor_enabled,
  });

  // Only owners can edit shop settings
  const isOwner = profile.role === 'owner';

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Shop name is required');
      return;
    }

    if (formData.low_stock_threshold < 0) {
      toast.error('Low stock threshold must be 0 or greater');
      return;
    }

    if (formData.discrepancy_alert_threshold < 0) {
      toast.error('Discrepancy threshold must be 0 or greater');
      return;
    }

    setIsSaving(true);

    try {
      await updateShopSettings(shop.id, profile.id, {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        business_type: formData.business_type || undefined,
        low_stock_threshold: formData.low_stock_threshold,
        discrepancy_alert_threshold: formData.discrepancy_alert_threshold,
        supervisor_enabled: formData.supervisor_enabled,
      });

      toast.success('Shop settings updated successfully');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Shop settings update error:', error);
      toast.error('Failed to update shop settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: shop.name,
      phone: shop.phone || '',
      address: shop.address || '',
      business_type: shop.business_type || '',
      low_stock_threshold: shop.low_stock_threshold,
      discrepancy_alert_threshold: shop.discrepancy_alert_threshold,
      supervisor_enabled: shop.supervisor_enabled,
    });
    setIsEditing(false);
  };

  if (!isOwner) {
    return (
      <div className="text-center py-12">
        <Settings className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Owner Access Required</h3>
        <p className="text-sm text-gray-500">
          Only the shop owner can modify shop settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
          <Store className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Shop Settings</h2>
          <p className="text-sm text-gray-500">Configure your shop details and preferences</p>
        </div>
      </div>

      {/* Shop Settings Form */}
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Basic Information
          </h3>

          {/* Shop Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Shop Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditing}
              placeholder="Enter shop name"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing}
              placeholder="Enter phone number"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <Input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={!isEditing}
              placeholder="Enter shop address"
            />
          </div>

          {/* Business Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Business Type</label>
            <Select
              value={formData.business_type}
              onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
              disabled={!isEditing}
            >
              <option value="">Select business type</option>
              {BUSINESS_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Inventory Settings */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Inventory Settings
          </h3>

          {/* Low Stock Threshold */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Low Stock Threshold
            </label>
            <Input
              type="number"
              min="0"
              value={formData.low_stock_threshold}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  low_stock_threshold: parseInt(e.target.value) || 0,
                })
              }
              disabled={!isEditing}
            />
            <p className="text-xs text-gray-500">
              Products with quantity at or below this level will show as low stock
            </p>
          </div>

          {/* Discrepancy Alert Threshold */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Cash Discrepancy Alert Threshold (LRD)
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.discrepancy_alert_threshold}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discrepancy_alert_threshold: parseFloat(e.target.value) || 0,
                })
              }
              disabled={!isEditing}
            />
            <p className="text-xs text-gray-500">
              You'll be alerted when cash session discrepancy exceeds this amount
            </p>
          </div>
        </div>

        {/* Staff Settings */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Staff Settings
          </h3>

          {/* Enable Supervisor Role */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="supervisor_enabled"
              checked={formData.supervisor_enabled}
              onChange={(e) =>
                setFormData({ ...formData, supervisor_enabled: e.target.checked })
              }
              disabled={!isEditing}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <label
                htmlFor="supervisor_enabled"
                className="block text-sm font-medium text-gray-700 cursor-pointer"
              >
                Enable Supervisor Role
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Allow assigning employees as supervisors with elevated permissions (price
                changes, returns, voids)
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Info (Read-only) */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Subscription
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-500">Status</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 capitalize">
                {shop.subscription_status}
              </div>
            </div>

            {/* Plan */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-500">Plan</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 capitalize">
                {shop.subscription_plan}
              </div>
            </div>
          </div>

          {/* Trial/Expiration Date */}
          {shop.trial_ends_at && shop.subscription_status === 'trial' && (
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-500">
                Trial Ends On
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                {new Date(shop.trial_ends_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
            Edit Settings
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 sm:flex-none"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
