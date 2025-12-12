// app/(dashboard)/inventory/restock/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import RestockForm from '@/components/inventory/restock-form';
import RestockBulk from '@/components/inventory/restock-bulk';
import { ArrowLeft, Package, Layers } from 'lucide-react';

type RestockMode = 'single' | 'bulk';

export default function RestockPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [mode, setMode] = useState<RestockMode>('single');

  const handleSuccess = () => {
    router.push('/inventory');
  };

  // Role-based access check
  if (profile && profile.role !== 'owner' && profile.role !== 'supervisor') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 max-w-md text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to restock products.
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
              <h1 className="text-xl font-bold text-gray-900">Restock Products</h1>
              <p className="text-sm text-gray-500 mt-1">
                Add inventory to your products
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mode Selection */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode('single')}
              className={`p-4 border-2 rounded-lg transition-colors ${
                mode === 'single'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Package
                  className={`h-6 w-6 ${
                    mode === 'single' ? 'text-blue-600' : 'text-gray-400'
                  }`}
                />
              </div>
              <div className="text-sm font-medium text-gray-900">Single Product</div>
              <div className="text-xs text-gray-500 mt-1">
                Restock one product at a time
              </div>
            </button>

            <button
              onClick={() => setMode('bulk')}
              className={`p-4 border-2 rounded-lg transition-colors ${
                mode === 'bulk'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Layers
                  className={`h-6 w-6 ${
                    mode === 'bulk' ? 'text-blue-600' : 'text-gray-400'
                  }`}
                />
              </div>
              <div className="text-sm font-medium text-gray-900">Bulk Restock</div>
              <div className="text-xs text-gray-500 mt-1">
                Restock multiple products at once
              </div>
            </button>
          </div>
        </div>

        {/* Form */}
        <Card className="p-6">
          {mode === 'single' ? (
            <RestockForm
              shopId={profile.shop_id}
              userId={user.id}
              onSuccess={handleSuccess}
              onCancel={() => router.back()}
            />
          ) : (
            <RestockBulk
              shopId={profile.shop_id}
              userId={user.id}
              onSuccess={handleSuccess}
              onCancel={() => router.back()}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
