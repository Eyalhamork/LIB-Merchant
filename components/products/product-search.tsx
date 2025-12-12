// components/products/product-search.tsx

'use client';

import { useState } from 'react';
import Input from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { useProductSearch } from '@/hooks/use-products';
import { Search, X } from 'lucide-react';

interface ProductSearchProps {
  shopId: string;
  value: string;
  onChange: (value: string) => void;
  onProductSelect?: (product: any) => void;
  placeholder?: string;
}

export function ProductSearch({
  shopId,
  value,
  onChange,
  onProductSelect,
  placeholder = 'Search products...',
}: ProductSearchProps) {
  const { products, isSearching } = useProductSearch(shopId, value);
  const [showResults, setShowResults] = useState(false);

  const handleClear = () => {
    onChange('');
    setShowResults(false);
  };

  const handleProductClick = (product: any) => {
    if (onProductSelect) {
      onProductSelect(product);
    }
    setShowResults(false);
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {isSearching && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <Spinner size="sm" />
          </div>
        )}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && value && onProductSelect && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowResults(false)}
          />

          {/* Results */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            {products.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                {isSearching ? 'Searching...' : 'No products found'}
              </div>
            ) : (
              <div className="py-2">
                {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleProductClick(product)}
                    className="w-full px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Product Image */}
                      {product.product?.image_url ? (
                        <img
                          src={product.product.image_url}
                          alt={product.product.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                          <span className="text-xs text-gray-400">No img</span>
                        </div>
                      )}

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {product.product?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {product.product?.category}
                          {product.current_quantity > 0
                            ? ` • ${product.current_quantity} in stock`
                            : ' • Out of stock'}
                        </p>
                      </div>

                      {/* Price */}
                      <p className="font-medium text-gray-900">
                        {product.selling_price.toFixed(2)} LRD
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
