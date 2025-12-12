// app/(dashboard)/inventory/adjust/page.tsx

'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import AdjustmentForm from '@/components/inventory/adjustment-form';
import { ArrowLeft } from 'lucide-react';

export default function AdjustInventoryPage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const handleSuccess = () => {
    router.push('/inventory');
  };

  // Role-based access check
  // Positive adjustments: Owner or Supervisor
  // Negative adjustments: Owner only (PIN required)
  if (profile && profile.role !== 'owner' && profile.role !== 'supervisor') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 max-w-md text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to adjust inventory.
          </p>
          <Button onClick={() => router.push('/inventory')}>
            Back to Inventory
          </Button>
        </Card>
      </div>
    );
  }

  if (!profile || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Adjust Inventory</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manually adjust stock quantities
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-6">
          <AdjustmentForm
            shopId={profile.shop_id}
            userId={user.id}
            userRole={profile.role}
            onSuccess={handleSuccess}
            onCancel={() => router.back()}
          />
        </Card>
      </div>
    </div>
  );
}
