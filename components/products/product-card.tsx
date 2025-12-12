// components/products/product-card.tsx

'use client';

import { useState } from 'react';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import { LowStockBadge } from './low-stock-badge';
import { toggleFavorite } from '@/lib/supabase/products';
import { formatCurrency, formatQuantity } from '@/lib/utils';
import { Star, Package, Edit } from 'lucide-react';
import { toast } from 'sonner';
import type { ShopProduct } from '@/types';

interface ProductCardProps {
  product: ShopProduct;
  onProductClick?: (product: ShopProduct) => void;
  onEdit?: (product: ShopProduct) => void;
  showCostPrice?: boolean;
  onFavoriteToggle?: () => void;
}

export function ProductCard({
  product,
  onProductClick,
  onEdit,
  showCostPrice = false,
  onFavoriteToggle,
}: ProductCardProps) {
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    setIsTogglingFavorite(true);

    try {
      await toggleFavorite(product.id, product.shop_id);
      toast.success(
        product.is_favorite ? 'Removed from favorites' : 'Added to favorites'
      );
      if (onFavoriteToggle) {
        onFavoriteToggle();
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
      toast.error('Failed to update favorite');
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(product);
    }
  };

  return (
    <Card
      className={`p-4 hover:shadow-md transition-shadow ${
        onProductClick ? 'cursor-pointer' : ''
      }`}
      onClick={() => onProductClick?.(product)}
    >
      <div className="flex items-start gap-4">
        {/* Product Image */}
        <div className="flex-shrink-0">
          {product.product?.image_url ? (
            <img
              src={product.product.image_url}
              alt={product.product.name}
              className="h-20 w-20 rounded-lg object-cover"
            />
          ) : (
            <div className="h-20 w-20 rounded-lg bg-gray-100 flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          {/* Name and Favorite */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {product.product?.name}
              </h3>
              <p className="text-sm text-gray-500">{product.product?.category}</p>
            </div>

            <div className="flex items-center gap-1">
              {/* Favorite Star */}
              <button
                type="button"
                onClick={handleFavoriteToggle}
                disabled={isTogglingFavorite}
                className="p-1 text-gray-400 hover:text-yellow-500 transition-colors disabled:opacity-50"
              >
                <Star
                  className={`h-5 w-5 ${
                    product.is_favorite
                      ? 'fill-yellow-500 text-yellow-500'
                      : ''
                  }`}
                />
              </button>

              {/* Edit Button */}
              {onEdit && (
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="p-1 text-gray-400 hover:text-emerald-700 transition-colors"
                >
                  <Edit className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Stock Status */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <LowStockBadge
              currentQuantity={product.current_quantity}
              reorderLevel={product.reorder_level}
              unit={product.product?.unit}
            />
            {product.is_favorite && (
              <Badge className="bg-yellow-100 text-yellow-800">
                Favorite
              </Badge>
            )}
          </div>

          {/* Prices and Quantity */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-gray-600">Price</p>
              <p className="font-medium text-gray-900">
                {formatCurrency(product.selling_price)}
              </p>
            </div>

            {showCostPrice && (
              <div>
                <p className="text-gray-600">Cost</p>
                <p className="font-medium text-gray-900">
                  {formatCurrency(product.cost_price)}
                </p>
              </div>
            )}

            <div>
              <p className="text-gray-600">In Stock</p>
              <p
                className={`font-medium ${
                  product.current_quantity === 0
                    ? 'text-red-600'
                    : product.current_quantity <= product.reorder_level
                    ? 'text-amber-600'
                    : 'text-gray-900'
                }`}
              >
                {formatQuantity(product.current_quantity, product.product?.unit)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
