// store/cart-store.ts

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, ShopProduct, Customer } from '@/types';

interface CartStore {
  items: CartItem[];
  customer: Customer | null;
  discountAmount: number;
  
  // Actions
  addItem: (product: ShopProduct, quantity?: number) => void;
  updateQuantity: (shopProductId: string, quantity: number) => void;
  removeItem: (shopProductId: string) => void;
  clearCart: () => void;
  setCustomer: (customer: Customer | null) => void;
  setDiscountAmount: (amount: number) => void;
  
  // Computed
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  getTotalQuantity: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      customer: null,
      discountAmount: 0,
      
      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existing = items.find(i => i.shop_product_id === product.id);
        
        // Check stock
        if (product.current_quantity < quantity) {
          return; // Not enough stock
        }
        
        if (existing) {
          const newQuantity = existing.quantity + quantity;
          
          // Check stock for new quantity
          if (product.current_quantity < newQuantity) {
            return; // Not enough stock
          }
          
          set({
            items: items.map(i => 
              i.shop_product_id === product.id
                ? { 
                    ...i, 
                    quantity: newQuantity, 
                    subtotal: newQuantity * i.price 
                  }
                : i
            )
          });
        } else {
          set({
            items: [...items, {
              shop_product_id: product.id,
              product: product,
              quantity: quantity,
              price: product.selling_price,
              subtotal: quantity * product.selling_price
            }]
          });
        }
      },
      
      updateQuantity: (shopProductId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(shopProductId);
          return;
        }
        
        set({
          items: get().items.map(i =>
            i.shop_product_id === shopProductId
              ? { 
                  ...i, 
                  quantity, 
                  subtotal: quantity * i.price 
                }
              : i
          )
        });
      },
      
      removeItem: (shopProductId) => {
        set({ 
          items: get().items.filter(i => i.shop_product_id !== shopProductId) 
        });
      },
      
      clearCart: () => set({ 
        items: [], 
        customer: null, 
        discountAmount: 0 
      }),
      
      setCustomer: (customer) => set({ customer }),
      
      setDiscountAmount: (amount) => set({ discountAmount: amount }),
      
      getSubtotal: () => {
        return get().items.reduce((sum, i) => sum + i.subtotal, 0);
      },
      
      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().discountAmount;
        return Math.max(0, subtotal - discount);
      },
      
      getItemCount: () => {
        return get().items.length;
      },
      
      getTotalQuantity: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },
    }),
    {
      name: 'shopmanager-cart',
    }
  )
);
