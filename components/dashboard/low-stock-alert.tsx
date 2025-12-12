// components/dashboard/low-stock-alert.tsx
'use client';

import { formatQuantity, isLowStock } from '@/lib/utils';
import { AlertTriangle, Package, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import type { ShopProduct } from '@/types';

interface LowStockAlertProps {
  products: ShopProduct[];
  isLoading?: boolean;
}

export default function LowStockAlert({ products, isLoading = false }: LowStockAlertProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alert</h3>
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
          {products.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {products.length}
            </span>
          )}
        </div>
        <Link
          href="/inventory"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Restock
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">All products well-stocked</p>
          <p className="text-sm text-gray-400 mt-1">No items need restocking</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.slice(0, 8).map((shopProduct: any) => {
            const product = shopProduct.product;
            const stockLevel = shopProduct.current_quantity;
            const reorderLevel = shopProduct.reorder_level;
            const isCritical = stockLevel === 0;
            const percentOfReorder = (stockLevel / reorderLevel) * 100;

            return (
              <Link
                key={shopProduct.id}
                href={`/products/${shopProduct.product_id}`}
                className={`block p-3 rounded-lg border transition-colors ${
                  isCritical
                    ? 'border-red-300 bg-red-50 hover:bg-red-100'
                    : 'border-amber-200 bg-amber-50 hover:bg-amber-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {isCritical ? (
                        <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      )}
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {product?.name || 'Unknown Product'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className={isCritical ? 'text-red-700' : 'text-amber-700'}>
                        Current: <span className="font-semibold">
                          {formatQuantity(stockLevel, product?.unit)}
                        </span>
                      </span>
                      <span className="text-gray-500">
                        Reorder at: {formatQuantity(reorderLevel, product?.unit)}
                      </span>
                    </div>

                    {/* Stock level bar */}
                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isCritical
                            ? 'bg-red-600'
                            : percentOfReorder < 25
                            ? 'bg-amber-600'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(percentOfReorder, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="ml-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                        isCritical
                          ? 'bg-red-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      {isCritical ? 'Out of Stock' : 'Low'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}

          {products.length > 8 && (
            <Link
              href="/inventory"
              className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
            >
              View {products.length - 8} more products
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
