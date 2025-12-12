// app/(dashboard)/customers/add/page.tsx

'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { CustomerForm } from '@/components/customers/customer-form';
import Button from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import { ArrowLeft } from 'lucide-react';
import type { Customer } from '@/types';

export default function AddCustomerPage() {
  const router = useRouter();
  const { profile, isLoading } = useAuth();

  const handleSuccess = (customer: Customer) => {
    // Navigate back to customers page after successful creation
    router.push('/customers');
  };

  const handleCancel = () => {
    router.push('/customers');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile?.shop_id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Unable to load shop information</p>
          <Button onClick={() => router.push('/customers')} className="mt-4">
            Back to Customers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/customers')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Add New Customer</h1>
              <p className="text-sm text-gray-500">
                Create a new customer record
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <CustomerForm
            shopId={profile.shop_id}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
