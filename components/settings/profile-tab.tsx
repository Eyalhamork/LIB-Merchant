// components/settings/profile-tab.tsx

'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { updateProfile } from '@/lib/supabase/settings';
import { Profile } from '@/types';
import { toast } from 'sonner';
import { User } from 'lucide-react';

interface ProfileTabProps {
  profile: Profile;
  onUpdate: () => void;
}

export function ProfileTab({ profile, onUpdate }: ProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: profile.name,
    phone: profile.phone || '',
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsSaving(true);

    try {
      await updateProfile(profile.id, {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
      });

      toast.success('Profile updated successfully');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile.name,
      phone: profile.phone || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
          <User className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
          <p className="text-sm text-gray-500">Update your personal details</p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Full Name <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={!isEditing}
            placeholder="Enter your full name"
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={!isEditing}
            placeholder="Enter your phone number"
          />
        </div>

        {/* Role (Read-only) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 capitalize">
            {profile.role}
          </div>
        </div>

        {/* Last Login (Read-only) */}
        {profile.last_login_at && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Last Login
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
              {new Date(profile.last_login_at).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
            Edit Profile
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
