// app/(auth)/register/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import { OwnerInfoStep } from '@/components/auth/owner-info-step';
import { ShopDetailsStep } from '@/components/auth/shop-details-step';
import { TermsStep } from '@/components/auth/terms-step';
import { registerUser } from '@/lib/supabase/auth';
import { toast } from 'sonner';

type RegistrationStep = 'owner-info' | 'shop-details' | 'terms';

interface OwnerInfo {
  name: string;
  email: string;
  password: string;
  phone: string;
}

interface ShopDetails {
  shop_name: string;
  business_type: string;
  address: string;
  shop_phone: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('owner-info');
  const [isLoading, setIsLoading] = useState(false);

  // Form data state
  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo>({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const [shopDetails, setShopDetails] = useState<ShopDetails>({
    shop_name: '',
    business_type: '',
    address: '',
    shop_phone: '',
  });

  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleOwnerInfoSubmit = (data: OwnerInfo) => {
    setOwnerInfo(data);
    setCurrentStep('shop-details');
  };

  const handleShopDetailsSubmit = (data: ShopDetails) => {
    setShopDetails(data);
    setCurrentStep('terms');
  };

  const handleTermsSubmit = async (accepted: boolean) => {
    if (!accepted) {
      toast.error('You must accept the terms and conditions to continue');
      return;
    }

    setIsLoading(true);

    try {
      // Register user with all collected data
      await registerUser({
        ...ownerInfo,
        ...shopDetails,
      });

      toast.success('Account created successfully! Setting up your shop...');
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create account');
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'shop-details') {
      setCurrentStep('owner-info');
    } else if (currentStep === 'terms') {
      setCurrentStep('shop-details');
    }
  };

  const getStepNumber = () => {
    switch (currentStep) {
      case 'owner-info':
        return 1;
      case 'shop-details':
        return 2;
      case 'terms':
        return 3;
      default:
        return 1;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ShopManager</h1>
          <p className="text-gray-600 mt-2">Start your 30-day free trial</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {getStepNumber()} of 3
            </span>
            <span className="text-sm text-gray-500">
              {currentStep === 'owner-info' && 'Your Information'}
              {currentStep === 'shop-details' && 'Shop Details'}
              {currentStep === 'terms' && 'Terms & Conditions'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(getStepNumber() / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Registration Form Card */}
        <Card className="p-6">
          {currentStep === 'owner-info' && (
            <OwnerInfoStep
              initialData={ownerInfo}
              onSubmit={handleOwnerInfoSubmit}
            />
          )}

          {currentStep === 'shop-details' && (
            <ShopDetailsStep
              initialData={shopDetails}
              onSubmit={handleShopDetailsSubmit}
              onBack={handleBack}
            />
          )}

          {currentStep === 'terms' && (
            <TermsStep
              accepted={termsAccepted}
              onSubmit={handleTermsSubmit}
              onBack={handleBack}
              isLoading={isLoading}
            />
          )}
        </Card>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
