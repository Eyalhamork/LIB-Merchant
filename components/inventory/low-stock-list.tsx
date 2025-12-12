// components/inventory/low-stock-list.tsx

'use client';

import { useState } from 'react';
import type { ShopProduct } from '@/types';
import Button from '@/components/ui/button';
import Modal from '@/components/ui/modal';
import EmptyState from '@/components/ui/empty-state';
import RestockForm from './restock-form';
import { AlertCircle, Package, TrendingUp, ArrowUpCircle } from 'lucide-react';
import { formatQuantity, formatDate, formatRelativeTime } from '@/lib/utils';

interface LowStockListProps {
  shopId: string;
  userId: string;
  products: ShopProduct[];
  threshold?: number;
  onRefresh?: () => void;
}

export default function LowStockList({
  shopId,
  userId,
  products,
  threshold,
  onRefresh,
}: LowStockListProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [sortBy, setSortBy] = useState<'quantity' | 'last_restocked'>('quantity');

  const handleRestockClick = (productId: string) => {
    setSelectedProductId(productId);
    setShowRestockModal(true);
  };

  const handleRestockSuccess = () => {
    setShowRestockModal(false);
    setSelectedProductId(null);
    onRefresh?.();
  };

  const getStockStatus = (product: ShopProduct) => {
    if (product.current_quantity === 0) {
      return {
        label: 'Out of Stock',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        borderColor: 'border-red-200',
      };
    } else if (product.current_quantity <= product.reorder_level) {
      return {
        label: 'Low Stock',
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-200',
      };
    }
    return {
      label: 'Normal',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
    };
  };

  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'quantity') {
      return a.current_quantity - b.current_quantity;
    } else {
      // Sort by last_restocked (oldest first)
      const dateA = a.last_restocked_at ? new Date(a.last_restocked_at).getTime() : 0;
      const dateB = b.last_restocked_at ? new Date(b.last_restocked_at).getTime() : 0;
      return dateA - dateB;
    }
  });

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<Package />}
        title="No low stock items"
        description="All products are adequately stocked. Great job!"
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Sort Controls */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {products.length} product{products.length !== 1 ? 's' : ''} need attention
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'quantity' | 'last_restocked')}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="quantity">Lowest Stock</option>
              <option value="last_restocked">Oldest Restock</option>
            </select>
          </div>
        </div>

        {/* Products List */}
        <div className="space-y-3">
          {sortedProducts.map((product) => {
            const status = getStockStatus(product);
            const isOutOfStock = product.current_quantity === 0;

            return (
              <div
                key={product.id}
                className={`bg-white border-2 rounded-lg p-4 ${
                  isOutOfStock ? status.borderColor : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-3">
                      {product.product?.image_url ? (
                        <img
                          src={product.product.image_url}
                          alt={product.product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {product.product?.name}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}
                          >
                            {isOutOfStock && (
                              <AlertCircle className="h-3 w-3 mr-1" />
                            )}
                            {status.label}
                          </span>
                        </div>

                        {product.product?.category && (
                          <p className="text-xs text-gray-500">
                            {product.product.category}
                          </p>
                        )}

                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Current:</span>
                            <span
                              className={`ml-1 font-medium ${
                                isOutOfStock ? 'text-red-600' : 'text-gray-900'
                              }`}
                            >
                              {formatQuantity(
                                product.current_quantity,
                                product.product?.unit
                              )}
                            </span>
                          </div>

                          <div>
                            <span className="text-gray-600">Reorder Level:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {formatQuantity(
                                product.reorder_level,
                                product.product?.unit
                              )}
                            </span>
                          </div>

                          <div className="col-span-2">
                            <span className="text-gray-600">Last Restocked:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {product.last_restocked_at
                                ? formatRelativeTime(product.last_restocked_at)
                                : 'Never'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    size="sm"
                    onClick={() => handleRestockClick(product.id)}
                    className="flex-shrink-0"
                  >
                    <ArrowUpCircle className="h-4 w-4 mr-1" />
                    Restock
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Restock Modal */}
      <Modal
        isOpen={showRestockModal}
        onClose={() => {
          setShowRestockModal(false);
          setSelectedProductId(null);
        }}
        title="Restock Product"
      >
        <RestockForm
          shopId={shopId}
          userId={userId}
          preselectedProductId={selectedProductId || undefined}
          onSuccess={handleRestockSuccess}
          onCancel={() => {
            setShowRestockModal(false);
            setSelectedProductId(null);
          }}
        />
      </Modal>
    </>
  );
}
