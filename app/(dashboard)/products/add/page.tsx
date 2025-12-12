// app/(dashboard)/products/add/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { ProductForm } from '@/components/products/product-form';
import { createShopProduct } from '@/lib/supabase/products';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function AddProductPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check permissions
  const canAdd = profile?.role === 'owner' || profile?.role === 'supervisor';

  if (!canAdd) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Permission Denied
          </h3>
          <p className="text-sm text-gray-500">
            Only owners and supervisors can add products.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (formData: any) => {
    if (!user || !profile) return;

    setIsSubmitting(true);

    try {
      await createShopProduct(profile.shop_id, user.id, {
        name: formData.name,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        description: formData.description || undefined,
        image_url: formData.image_url || undefined,
        barcode: formData.barcode || undefined,
        unit: formData.unit,
        cost_price: parseFloat(formData.cost_price) || 0,
        selling_price: parseFloat(formData.selling_price),
        current_quantity: parseFloat(formData.current_quantity),
        reorder_level: parseFloat(formData.reorder_level),
        is_favorite: formData.is_favorite,
      });

      toast.success('Product added successfully');
      router.push('/products');
    } catch (error: any) {
      console.error('Add product error:', error);
      toast.error(error.message || 'Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Add Product</h1>
              <p className="text-sm text-gray-500">Create a new product</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="p-6">
          <ProductForm
            shopId={profile.shop_id}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            mode="add"
          />
        </Card>
      </div>
    </div>
  );
}
