// app/(dashboard)/settings/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getProfile, getShopSettings } from '@/lib/supabase/settings';
import { Profile, Shop } from '@/types';
import { ProfileTab } from '@/components/settings/profile-tab';
import { SecurityTab } from '@/components/settings/security-tab';
import { ShopSettingsTab } from '@/components/settings/shop-settings-tab';
import { SubscriptionTab } from '@/components/settings/subscription-tab';
import Spinner from '@/components/ui/spinner';
import { User, Shield, Store, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabId = 'profile' | 'security' | 'shop' | 'subscription';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: Tab[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'shop', label: 'Shop Settings', icon: Store },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Load profile
      const profileData = await getProfile(user.id);
      setProfile(profileData);

      // Load shop settings
      if (profileData.shop_id) {
        const shopData = await getShopSettings(profileData.shop_id);
        setShop(shopData);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile || !shop) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Failed to load settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your account, security, and shop preferences
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Tabs - Desktop */}
          <div className="hidden sm:block border-b border-gray-200">
            <nav className="flex -mb-px">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors',
                      activeTab === tab.id
                        ? 'border-emerald-600 text-emerald-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tabs - Mobile */}
          <div className="sm:hidden border-b border-gray-200">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as TabId)}
              className="block w-full py-3 px-4 text-sm font-medium text-gray-700 bg-white border-0 focus:ring-0"
            >
              {TABS.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <ProfileTab profile={profile} onUpdate={loadData} />
            )}
            {activeTab === 'security' && <SecurityTab profile={profile} />}
            {activeTab === 'shop' && (
              <ShopSettingsTab shop={shop} profile={profile} onUpdate={loadData} />
            )}
            {activeTab === 'subscription' && (
              <SubscriptionTab shop={shop} onUpdate={loadData} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
