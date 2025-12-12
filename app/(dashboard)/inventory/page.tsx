// app/(dashboard)/inventory/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useInventory } from '@/hooks/use-inventory';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Spinner from '@/components/ui/spinner';
import LowStockList from '@/components/inventory/low-stock-list';
import StockMovementsList from '@/components/inventory/stock-movements-list';
import {
  Package,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  RotateCcw,
  Edit,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

type ViewFilter = 'all' | 'low_stock' | 'out_of_stock';

export default function InventoryPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { stats, lowStockProducts, isLoadingStats, isLoadingLowStock, fetchStats, fetchLowStock } =
    useInventory(profile?.shop_id || '');

  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [showMovements, setShowMovements] = useState(false);

  useEffect(() => {
    if (profile?.shop_id) {
      fetchStats();
      fetchLowStock();
    }
  }, [profile?.shop_id]);

  const handleRefresh = () => {
    fetchStats();
    fetchLowStock();
  };

  const filteredLowStock = lowStockProducts?.filter((product) => {
    if (viewFilter === 'out_of_stock') {
      return product.current_quantity === 0;
    } else if (viewFilter === 'low_stock') {
      return product.current_quantity > 0 && product.current_quantity <= product.reorder_level;
    }
    return true;
  });

  // Role-based access check
  const canManageInventory = profile?.role === 'owner' || profile?.role === 'supervisor';

  if (!profile) {
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
              <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage your shop's stock levels
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Summary Cards */}
        {isLoadingStats ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Products */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Products</span>
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.totalProducts || 0}
              </div>
            </Card>

            {/* Low Stock */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Low Stock</span>
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-amber-600">
                {stats?.lowStockCount || 0}
              </div>
            </Card>

            {/* Out of Stock */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Out of Stock</span>
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600">
                {stats?.outOfStockCount || 0}
              </div>
            </Card>

            {/* Total Value */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Inventory Value</span>
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.totalInventoryValue || 0)}
              </div>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        {canManageInventory && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                onClick={() => router.push('/inventory/restock')}
                className="w-full"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Restock Products
              </Button>
              <Button
                onClick={() => router.push('/inventory/adjust')}
                variant="secondary"
                className="w-full"
              >
                <Edit className="h-4 w-4 mr-2" />
                Adjust Stock
              </Button>
              <Button
                onClick={() => setShowMovements(!showMovements)}
                variant="secondary"
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {showMovements ? 'Hide' : 'View'} Movements
              </Button>
            </div>
          </Card>
        )}

        {/* Stock Movements (if toggled) */}
        {showMovements && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Stock Movements
            </h2>
            <StockMovementsList
              shopId={profile.shop_id}
              limit={10}
              showFilters={false}
            />
          </Card>
        )}

        {/* Low Stock Alerts */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Stock Alerts
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setViewFilter('all')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewFilter === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All ({lowStockProducts?.length || 0})
              </button>
              <button
                onClick={() => setViewFilter('low_stock')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewFilter === 'low_stock'
                    ? 'bg-amber-100 text-amber-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Low Stock (
                {lowStockProducts?.filter(
                  (p) => p.current_quantity > 0 && p.current_quantity <= p.reorder_level
                ).length || 0}
                )
              </button>
              <button
                onClick={() => setViewFilter('out_of_stock')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewFilter === 'out_of_stock'
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Out of Stock (
                {lowStockProducts?.filter((p) => p.current_quantity === 0).length || 0}
                )
              </button>
            </div>
          </div>

          {isLoadingLowStock ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <LowStockList
              shopId={profile.shop_id}
              userId={user?.id || ''}
              products={filteredLowStock || []}
              onRefresh={handleRefresh}
            />
          )}
        </Card>

        {/* View All Link */}
        {canManageInventory && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowMovements(true)}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
            >
              View all stock movements
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
