// components/pos/cart-item.tsx

'use client';

import { Minus, Plus, X, Package } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import type { CartItem } from '@/types';

interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (shopProductId: string, quantity: number) => void;
  onRemove: (shopProductId: string) => void;
  maxQuantity?: number;
}

export default function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  maxQuantity,
}: CartItemProps) {
  const handleIncrement = () => {
    const newQuantity = item.quantity + 1;
    if (maxQuantity && newQuantity > maxQuantity) {
      return; // Don't allow exceeding stock
    }
    onUpdateQuantity(item.shop_product_id, newQuantity);
  };

  const handleDecrement = () => {
    const newQuantity = item.quantity - 1;
    if (newQuantity < 1) {
      onRemove(item.shop_product_id);
    } else {
      onUpdateQuantity(item.shop_product_id, newQuantity);
    }
  };

  const handleQuantityChange = (value: string) => {
    const newQuantity = parseInt(value) || 0;
    if (newQuantity < 1) {
      onRemove(item.shop_product_id);
    } else if (maxQuantity && newQuantity > maxQuantity) {
      onUpdateQuantity(item.shop_product_id, maxQuantity);
    } else {
      onUpdateQuantity(item.shop_product_id, newQuantity);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
      {/* Product Info & Remove Button */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
            {item.product.product?.name || 'Unknown Product'}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatCurrency(item.price)} × {item.quantity}
          </p>
        </div>

        <button
          onClick={() => onRemove(item.shop_product_id)}
          className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
          title="Remove from cart"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Quantity Controls & Subtotal */}
      <div className="flex items-center justify-between gap-3">
        {/* Quantity Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDecrement}
            className={cn(
              'w-8 h-8 rounded-md border-2 flex items-center justify-center transition-colors',
              'hover:bg-gray-100 active:bg-gray-200'
            )}
            title="Decrease quantity"
          >
            <Minus className="h-4 w-4 text-gray-700" />
          </button>

          <input
            type="number"
            min="1"
            max={maxQuantity}
            value={item.quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="w-14 text-center font-medium text-gray-900 border-2 border-gray-200 rounded-md py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleIncrement}
            disabled={maxQuantity !== undefined && item.quantity >= maxQuantity}
            className={cn(
              'w-8 h-8 rounded-md border-2 flex items-center justify-center transition-colors',
              maxQuantity !== undefined && item.quantity >= maxQuantity
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-100 active:bg-gray-200'
            )}
            title="Increase quantity"
          >
            <Plus className="h-4 w-4 text-gray-700" />
          </button>
        </div>

        {/* Subtotal */}
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(item.subtotal)}
          </p>
          {maxQuantity !== undefined && (
            <p className="text-xs text-gray-500">
              Max: {maxQuantity}
            </p>
          )}
        </div>
      </div>

      {/* Low Stock Warning */}
      {maxQuantity !== undefined && item.quantity >= maxQuantity && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2 py-1.5 rounded">
          <Package className="h-3 w-3" />
          <span>Maximum available quantity reached</span>
        </div>
      )}
    </div>
  );
}
