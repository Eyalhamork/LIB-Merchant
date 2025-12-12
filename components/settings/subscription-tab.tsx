// components/settings/subscription-tab.tsx

'use client';

import { useState } from 'react';
import { Shop, SubscriptionStatus, SubscriptionPlan } from '@/types';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { UpgradeRequestModal } from './upgrade-request-modal';
import { BillingHistory } from './billing-history';
import {
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Crown,
  Zap,
  ArrowUpCircle,
  Receipt,
} from 'lucide-react';

interface SubscriptionTabProps {
  shop: Shop;
  onUpdate?: () => void;
}

export function SubscriptionTab({ shop, onUpdate }: SubscriptionTabProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showBillingHistory, setShowBillingHistory] = useState(false);

  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case 'trial':
        return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getPlanIcon = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'starter':
        return <Zap className="h-5 w-5 text-blue-600" />;
      case 'professional':
        return <Crown className="h-5 w-5 text-purple-600" />;
      default:
        return <CreditCard className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPlanName = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'starter':
        return 'Starter Plan';
      case 'professional':
        return 'Professional Plan';
      default:
        return plan;
    }
  };

  const getPlanFeatures = (plan: SubscriptionPlan) => {
    const features = {
      starter: [
        'Up to 500 products',
        'Basic reporting',
        '2 employee accounts',
        'Email support',
        'Mobile app access',
      ],
      professional: [
        'Unlimited products',
        'Advanced analytics & reports',
        'Unlimited employees',
        'Priority support',
        'Mobile app access',
        'Custom categories',
        'Export data (CSV/Excel)',
        'Multi-location support',
      ],
    };

    return features[plan] || [];
  };

  const getStatusColor = (status: SubscriptionStatus) => {
    switch (status) {
      case 'trial':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'active':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'expired':
      case 'cancelled':
        return 'bg-red-50 border-red-200 text-red-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getExpiryDate = () => {
    if (shop.subscription_status === 'trial' && shop.trial_ends_at) {
      return shop.trial_ends_at;
    }
    if (shop.subscription_status === 'active' && shop.subscription_expires_at) {
      return shop.subscription_expires_at;
    }
    return null;
  };

  const expiryDate = getExpiryDate();
  const daysRemaining = expiryDate
    ? Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const handleUpgradeSuccess = () => {
    setShowUpgradeModal(false);
    if (onUpdate) {
      onUpdate();
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Current Subscription</h2>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowBillingHistory(!showBillingHistory)}
            >
              <Receipt className="h-4 w-4 mr-2" />
              Billing History
            </Button>
            {shop.subscription_plan === 'starter' && (
              <Button size="sm" onClick={() => setShowUpgradeModal(true)}>
                <ArrowUpCircle className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
            )}
          </div>
        </div>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              {getPlanIcon(shop.subscription_plan)}
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {getPlanName(shop.subscription_plan)}
                </h3>
                <div className="mt-1">{getStatusBadge(shop.subscription_status)}</div>
              </div>
            </div>
          </div>

          {/* Status Details */}
          <div className="space-y-4">
            {/* Trial/Expiry Information */}
            {expiryDate && (
              <div className={`p-4 rounded-lg border ${getStatusColor(shop.subscription_status)}`}>
                <div className="flex items-start gap-3">
                  {shop.subscription_status === 'trial' ? (
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  ) : shop.subscription_status === 'active' ? (
                    <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">
                      {shop.subscription_status === 'trial'
                        ? 'Trial Period'
                        : shop.subscription_status === 'active'
                        ? 'Subscription Active'
                        : 'Subscription Ended'}
                    </p>
                    <p className="text-sm mt-1">
                      {shop.subscription_status === 'trial' ||
                      shop.subscription_status === 'active' ? (
                        <>
                          {shop.subscription_status === 'trial' ? 'Trial ends' : 'Renews'} on{' '}
                          <span className="font-medium">{formatDate(expiryDate)}</span>
                          {daysRemaining !== null && daysRemaining > 0 && (
                            <span className="ml-2">
                              ({daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining)
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          Ended on <span className="font-medium">{formatDate(expiryDate)}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription Details */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Started</span>
                </div>
                <p className="font-medium text-gray-900">{formatDate(shop.created_at)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <CreditCard className="h-4 w-4" />
                  <span>Plan Type</span>
                </div>
                <p className="font-medium text-gray-900">
                  {shop.subscription_plan === 'starter' ? 'Starter' : 'Professional'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Billing History */}
      {showBillingHistory && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h2>
          <BillingHistory shopId={shop.id} />
        </div>
      )}

      {/* Plan Features */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Plan Features</h2>

        <Card className="p-6">
          <ul className="space-y-3">
            {getPlanFeatures(shop.subscription_plan).map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Upgrade Section (Starter Plan Only) */}
      {shop.subscription_plan === 'starter' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Upgrade to Professional
          </h2>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Crown className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Get More with Professional
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  Unlock unlimited products, advanced analytics, and priority support to grow
                  your business.
                </p>
                <div className="flex gap-3">
                  <Button onClick={() => setShowUpgradeModal(true)}>
                    <ArrowUpCircle className="h-4 w-4 mr-2" />
                    Request Upgrade
                  </Button>
                  <div className="p-3 bg-white rounded-lg border border-purple-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">Or contact us:</span>
                      <br />
                      Email: support@shopmanager.com
                      <br />
                      Phone: +231 XXX XXXX XXX
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Contact Support */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h2>

        <Card className="p-6">
          <p className="text-sm text-gray-700 mb-4">
            Have questions about your subscription or need assistance? Our support team is here
            to help.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">Email:</span>
              <span className="text-blue-600">support@shopmanager.com</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">Phone:</span>
              <span className="text-gray-700">+231 XXX XXXX XXX</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">Hours:</span>
              <span className="text-gray-700">Monday - Friday, 9AM - 5PM GMT</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Upgrade Request Modal */}
      {showUpgradeModal && (
        <UpgradeRequestModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentPlan={shop.subscription_plan}
          shopId={shop.id}
          shopName={shop.name}
          onSuccess={handleUpgradeSuccess}
        />
      )}
    </div>
  );
}
