// components/pos/cart.tsx

'use client';

import { ShoppingCart, Trash2, Tag, User } from 'lucide-react';
import Button from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { CartItemComponent } from './cart-item';
import { useCartStore } from '@/store/cart-store';
import { formatCurrency } from '@/lib/utils';
import type { CashSession } from '@/types';

interface CartProps {
  onCheckout: () => void;
  cashSession: CashSession | null;
}

export default function Cart({ onCheckout, cashSession }: CartProps) {
  const {
    items,
    customer,
    discountAmount,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    getTotal,
  } = useCartStore();

  const subtotal = getSubtotal();
  const total = getTotal();

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Cart</h2>
          {items.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {items.length}
            </span>
          )}
        </div>

        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-700 transition-colors"
            title="Clear cart"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Cart is empty"
            description="Add products to start a sale"
          />
        ) : (
          items.map((item) => (
            <CartItemComponent
              key={item.shop_product_id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
              maxQuantity={item.product.current_quantity}
            />
          ))
        )}
      </div>

      {/* Cart Summary & Checkout */}
      {items.length > 0 && (
        <div className="border-t border-gray-200 bg-white p-4 space-y-3">
          {/* Subtotal */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(subtotal)}
            </span>
          </div>

          {/* Discount */}
          {discountAmount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Discount:</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(discountAmount)}
              </span>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between text-lg font-bold pt-2 border-t border-gray-200">
            <span className="text-gray-900">Total:</span>
            <span className="text-blue-600">{formatCurrency(total)}</span>
          </div>

          {/* Checkout Button */}
          <Button
            onClick={onCheckout}
            disabled={!cashSession}
            className="w-full py-3 text-base"
          >
            {!cashSession ? 'No Active Session' : `Checkout ${formatCurrency(total)}`}
          </Button>
        </div>
      )}
    </div>
  );
}
