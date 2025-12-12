// app/(dashboard)/products/page.tsx

'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useProducts } from '@/hooks/use-products';
import { ProductList } from '@/components/products/product-list';
import Button from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import EmptyState from '@/components/ui/empty-state';
import { Plus, Package } from 'lucide-react';
import Link from 'next/link';

export default function ProductsPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { products, isLoading, reload } = useProducts(profile?.shop_id);

  // Check permissions
  const canManageProducts =
    profile?.role === 'owner' || profile?.role === 'supervisor';

  if (isLoading) {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Products</h1>
              <p className="text-sm text-gray-500">
                Manage your inventory and pricing
              </p>
            </div>
            {canManageProducts && (
              <Link href="/products/add">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {products.length === 0 ? (
          <EmptyState
            icon={<Package />}
            title="No products yet"
            description="Add your first product to start managing inventory"
            action={
              canManageProducts ? (
                <Link href="/products/add">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ProductList
            products={products}
            shopId={profile?.shop_id || ''}
            onProductClick={(product) => router.push(`/products/${product.id}`)}
            onEdit={
              canManageProducts
                ? (product) => router.push(`/products/${product.id}`)
                : undefined
            }
            showCostPrice={profile?.role === 'owner'}
            onFavoriteToggle={reload}
          />
        )}
      </div>
    </div>
  );
}
