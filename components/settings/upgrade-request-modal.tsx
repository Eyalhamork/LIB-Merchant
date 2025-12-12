// components/settings/upgrade-request-modal.tsx

'use client';

import { useState } from 'react';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import Textarea from '@/components/ui/textarea';
import { SubscriptionPlan } from '@/types';
import { requestUpgrade } from '@/lib/supabase/subscription';
import { toast } from 'sonner';
import { Crown, Check, Zap } from 'lucide-react';

interface UpgradeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: SubscriptionPlan;
  shopId: string;
  shopName: string;
  onSuccess: () => void;
}

export function UpgradeRequestModal({
  isOpen,
  onClose,
  currentPlan,
  shopId,
  shopName,
  onSuccess,
}: UpgradeRequestModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(
    currentPlan === 'starter' ? 'professional' : 'starter'
  );
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const plans = {
    starter: {
      name: 'Starter Plan',
      price: '500 LRD/month',
      icon: Zap,
      color: 'blue',
      features: [
        'Up to 500 products',
        'Basic reporting',
        '2 employee accounts',
        'Email support',
        'Mobile app access',
      ],
    },
    professional: {
      name: 'Professional Plan',
      price: '1,000 LRD/month',
      icon: Crown,
      color: 'purple',
      features: [
        'Unlimited products',
        'Advanced analytics & reports',
        'Unlimited employees',
        'Priority support',
        'Mobile app access',
        'Custom categories',
        'Export data (CSV/Excel)',
        'Multi-location support',
      ],
    },
  };

  const handleSubmit = async () => {
    if (selectedPlan === currentPlan) {
      toast.error('Please select a different plan');
      return;
    }

    setIsSubmitting(true);

    try {
      await requestUpgrade({
        shop_id: shopId,
        current_plan: currentPlan,
        requested_plan: selectedPlan,
        message: message.trim() || undefined,
      });

      toast.success('Upgrade request submitted successfully! We will contact you shortly.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Upgrade request error:', error);
      toast.error('Failed to submit upgrade request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlanDetails = (plan: SubscriptionPlan) => {
    return plans[plan];
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Plan Upgrade">
      <div className="space-y-6">
        <p className="text-sm text-gray-600">
          Select the plan you'd like to upgrade to and we'll contact you to complete the
          process.
        </p>

        {/* Plan Selection */}
        <div className="space-y-3">
          {(['starter', 'professional'] as SubscriptionPlan[]).map((plan) => {
            const details = getPlanDetails(plan);
            const Icon = details.icon;
            const isCurrent = plan === currentPlan;

            return (
              <label
                key={plan}
                className={`block cursor-pointer ${isCurrent ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="plan"
                  value={plan}
                  checked={selectedPlan === plan}
                  onChange={(e) => setSelectedPlan(e.target.value as SubscriptionPlan)}
                  disabled={isCurrent}
                  className="sr-only peer"
                />
                <div
                  className={`border-2 rounded-lg p-4 transition-all ${
                    selectedPlan === plan && !isCurrent
                      ? `border-${details.color}-600 bg-${details.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isCurrent ? 'bg-gray-50' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-full bg-${details.color}-100 flex items-center justify-center`}
                      >
                        <Icon className={`h-5 w-5 text-${details.color}-600`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{details.name}</h3>
                        <p className="text-sm text-gray-600">{details.price}</p>
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                        Current Plan
                      </span>
                    )}
                  </div>

                  <ul className="space-y-2">
                    {details.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </label>
            );
          })}
        </div>

        {/* Additional Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Message (Optional)
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Let us know if you have any questions or special requirements..."
            rows={3}
          />
        </div>

        {/* Contact Information */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h4 className="font-medium text-emerald-900 mb-2">What happens next?</h4>
          <ul className="text-sm text-emerald-800 space-y-1">
            <li>• We'll review your upgrade request</li>
            <li>• Our team will contact you within 24 hours</li>
            <li>• You'll receive payment instructions</li>
            <li>• Your account will be upgraded upon payment confirmation</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedPlan === currentPlan}
            className="flex-1"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
