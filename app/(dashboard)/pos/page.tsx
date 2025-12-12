// app/(dashboard)/pos/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCashSession } from '@/hooks/use-cash-session';
import { getPOSProducts } from '@/lib/supabase/pos';
import { useCartStore } from '@/store/cart-store';
import ProductSearch from '@/components/pos/product-search';
import ProductGrid from '@/components/pos/product-grid';
import Cart from '@/components/pos/cart';
import CheckoutModal from '@/components/pos/checkout-modal';
import { OpenSessionModal } from '@/components/pos/open-session-modal';
import { SessionStatusBadge } from '@/components/cash-session/session-status-badge';
import Spinner from '@/components/ui/spinner';
import EmptyState from '@/components/ui/empty-state';
import { ShoppingCart, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { ShopProduct } from '@/types';

export default function POSPage() {
  const { profile } = useAuth();
  const { clearCart } = useCartStore();
  const {
    activeSession,
    hasActiveSession,
    isLoading: isSessionLoading,
  } = useCashSession();

  // State
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ShopProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showOpenSession, setShowOpenSession] = useState(false);

  // Check for active session when component mounts
  useEffect(() => {
    if (!isSessionLoading && !hasActiveSession) {
      // Show prompt to open session
      setShowOpenSession(true);
    }
  }, [isSessionLoading, hasActiveSession]);

  // Load products
  useEffect(() => {
    if (profile?.shop_id) {
      loadProducts();
    }
  }, [profile?.shop_id]);

  // Filter products by category
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(
        products.filter((p) => p.product?.category === selectedCategory)
      );
    }
  }, [selectedCategory, products]);

  const loadProducts = async () => {
    if (!profile?.shop_id) return;

    setIsLoading(true);
    try {
      const data = await getPOSProducts(profile.shop_id);
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Load products error:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchResults = (results: ShopProduct[]) => {
    setFilteredProducts(results);
    setSelectedCategory('all'); // Reset category filter when searching
  };

  const handleCheckoutComplete = () => {
    setShowCheckout(false);
    clearCart();
    toast.success('Sale completed successfully!');
  };

  const handleSessionOpened = () => {
    setShowOpenSession(false);
    // The useCashSession hook will automatically detect the new session
  };

  // Get unique categories from products
  const categories = Array.from(
    new Set(products.map((p) => p.product?.category).filter(Boolean))
  ).sort() as string[];

  // Show loading while checking session
  if (isSessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Session Alert Banner */}
      {!hasActiveSession && (
        <div className="bg-amber-50 border-b border-amber-200 p-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <p className="text-sm font-medium text-amber-900">
                No active cash session. Please open a session to start making sales.
              </p>
            </div>
            <button
              onClick={() => setShowOpenSession(true)}
              className="px-4 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
            >
              Open Session
            </button>
          </div>
        </div>
      )}

      {/* Header with Session Status */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Point of Sale</h1>
        <SessionStatusBadge session={activeSession} />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row bg-gray-50 overflow-hidden">
        {/* Left Side - Products */}
        <div className="flex-1 flex flex-col bg-white border-r border-gray-200">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <ProductSearch
            shopId={profile?.shop_id || ''}
            onResults={handleSearchResults}
            onSelect={() => {
              // Product search component handles adding to cart
            }}
            hasActiveSession={hasActiveSession}
            onSessionRequired={() => setShowOpenSession(true)}
          />
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                All Products
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Spinner size="lg" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon={<ShoppingCart className="w-12 h-12" />}
              title="No products found"
              description="Try adjusting your search or category filter"
            />
          ) : (
            <ProductGrid
              products={filteredProducts}
              hasActiveSession={hasActiveSession}
              onSessionRequired={() => setShowOpenSession(true)}
            />
          )}
        </div>
      </div>

        {/* Right Side - Cart */}
        <div className="w-full lg:w-96 xl:w-[28rem] flex flex-col bg-white shadow-xl lg:shadow-none">
          <Cart
            onCheckout={() => setShowCheckout(true)}
            cashSession={activeSession}
          />
        </div>
      </div>

      {/* Open Session Modal */}
      <OpenSessionModal
        isOpen={showOpenSession}
        onClose={() => setShowOpenSession(false)}
        onSuccess={handleSessionOpened}
      />

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          onSuccess={handleCheckoutComplete}
          cashSession={activeSession}
        />
      )}
    </div>
  );
}
