// components/pos/product-grid.tsx

'use client';

import { useState } from 'react';
import { Star, Package } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ShopProduct } from '@/types';

interface ProductGridProps {
  products: ShopProduct[];
  hasActiveSession?: boolean;
  onSessionRequired?: () => void;
}

export default function ProductGrid({
  products,
  hasActiveSession = true,
  onSessionRequired
}: ProductGridProps) {
  const { addItem } = useCartStore();
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Get unique categories
  const categories = Array.from(
    new Set(products.map((p) => p.product?.category).filter(Boolean))
  ) as string[];

  // Filter products by category
  const filteredProducts =
    filterCategory === 'all'
      ? products
      : products.filter((p) => p.product?.category === filterCategory);

  const handleAddToCart = (product: ShopProduct) => {
    if (!hasActiveSession) {
      toast.error('Please open a cash session first');
      onSessionRequired?.();
      return;
    }
    addItem(product, 1);
  };

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterCategory('all')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              filterCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            All ({products.length})
          </button>
          {categories.map((category) => {
            const count = products.filter(
              (p) => p.product?.category === category
            ).length;
            return (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  filterCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filteredProducts.map((product) => (
          <button
            key={product.id}
            onClick={() => handleAddToCart(product)}
            disabled={product.current_quantity <= 0 || !hasActiveSession}
            className={cn(
              'relative p-3 border-2 rounded-lg text-left transition-all',
              product.current_quantity > 0 && hasActiveSession
                ? 'border-gray-200 hover:border-blue-500 hover:shadow-md cursor-pointer bg-white'
                : 'border-gray-100 opacity-50 cursor-not-allowed bg-gray-50'
            )}
          >
            {/* Favorite Badge */}
            {product.is_favorite && (
              <div className="absolute top-2 right-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </div>
            )}

            {/* Product Image Placeholder */}
            {product.product?.image_url ? (
              <img
                src={product.product.image_url}
                alt={product.product.name}
                className="w-full h-20 object-cover rounded mb-2"
              />
            ) : (
              <div className="w-full h-20 bg-gray-100 rounded mb-2 flex items-center justify-center">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
            )}

            {/* Product Info */}
            <div className="space-y-1">
              <h3 className="font-medium text-sm text-gray-900 line-clamp-2 min-h-[2.5rem]">
                {product.product?.name}
              </h3>

              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(product.selling_price)}
              </p>

              {/* Stock Info */}
              <div className="flex items-center justify-between text-xs">
                <span
                  className={cn(
                    'font-medium',
                    product.current_quantity <= 0
                      ? 'text-red-600'
                      : product.current_quantity <= product.reorder_level
                      ? 'text-amber-600'
                      : 'text-green-600'
                  )}
                >
                  {product.current_quantity <= 0
                    ? 'Out of stock'
                    : product.current_quantity <= product.reorder_level
                    ? 'Low stock'
                    : `Stock: ${product.current_quantity}`}
                </span>
                {product.product?.unit && product.current_quantity > 0 && (
                  <span className="text-gray-500">{product.product.unit}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* No filtered results */}
      {filteredProducts.length === 0 && filterCategory !== 'all' && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products in this category</p>
          <button
            onClick={() => setFilterCategory('all')}
            className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            View all products
          </button>
        </div>
      )}
    </div>
  );
}
