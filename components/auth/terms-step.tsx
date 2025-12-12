// components/auth/terms-step.tsx

'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';

interface TermsStepProps {
  accepted: boolean;
  onSubmit: (accepted: boolean) => void;
  onBack: () => void;
  isLoading: boolean;
}

export function TermsStep({ accepted, onSubmit, onBack, isLoading }: TermsStepProps) {
  const [termsAccepted, setTermsAccepted] = useState(accepted);
  const [privacyAccepted, setPrivacyAccepted] = useState(accepted);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAccepted || !privacyAccepted) {
      setError('You must accept both terms and privacy policy to continue');
      return;
    }

    setError('');
    onSubmit(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Terms & Conditions
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Please review and accept our terms to complete registration
        </p>
      </div>

      {/* Trial Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900">
              30-Day Free Trial
            </h3>
            <div className="mt-1 text-sm text-blue-700">
              <p>Your free trial includes:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Full access to all features</li>
                <li>Up to 3 employees</li>
                <li>500 products</li>
                <li>No credit card required</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Terms Scrollable Box */}
      <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50">
        <h3 className="font-medium text-gray-900 mb-3">Terms of Service</h3>
        
        <div className="text-sm text-gray-700 space-y-3">
          <p>
            <strong>1. Account Registration:</strong> You must provide accurate information
            when creating your account. You are responsible for maintaining the security
            of your account credentials.
          </p>

          <p>
            <strong>2. Trial Period:</strong> Your account includes a 30-day free trial.
            After the trial period, continued use requires an active subscription.
          </p>

          <p>
            <strong>3. Data Ownership:</strong> You retain full ownership of all data
            entered into ShopManager. We do not claim any rights to your business data.
          </p>

          <p>
            <strong>4. Service Availability:</strong> While we strive for 99.5% uptime,
            we cannot guarantee uninterrupted service. Scheduled maintenance will be
            communicated in advance.
          </p>

          <p>
            <strong>5. Acceptable Use:</strong> You agree not to use ShopManager for any
            illegal purposes or in violation of Liberian laws and regulations.
          </p>

          <p>
            <strong>6. Payment Terms:</strong> Subscription fees are charged monthly in
            advance. You may cancel your subscription at any time.
          </p>

          <p>
            <strong>7. Termination:</strong> We reserve the right to suspend or terminate
            accounts that violate these terms or engage in fraudulent activity.
          </p>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-3">
        <label className="flex items-start">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => {
              setTermsAccepted(e.target.checked);
              setError('');
            }}
            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">
            I have read and agree to the{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              Terms of Service
            </a>
          </span>
        </label>

        <label className="flex items-start">
          <input
            type="checkbox"
            checked={privacyAccepted}
            onChange={(e) => {
              setPrivacyAccepted(e.target.checked);
              setError('');
            }}
            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">
            I agree to the{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              Privacy Policy
            </a>
          </span>
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Spinner className="mr-2" />
              Creating Account...
            </>
          ) : (
            'Complete Registration'
          )}
        </Button>
      </div>
    </form>
  );
}
