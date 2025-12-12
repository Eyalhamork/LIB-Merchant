// components/pos/product-search.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Barcode } from 'lucide-react';
import { searchPOSProducts } from '@/lib/supabase/pos';
import { debounce } from '@/lib/utils';
import { toast } from 'sonner';
import type { ShopProduct } from '@/types';

interface ProductSearchProps {
  shopId: string;
  onResults: (products: ShopProduct[]) => void;
  onSelect: (product: ShopProduct) => void;
  hasActiveSession?: boolean;
  onSessionRequired?: () => void;
}

export default function ProductSearch({
  shopId,
  onResults,
  onSelect,
  hasActiveSession = true,
  onSessionRequired
}: ProductSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ShopProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Debounced search
  const debouncedSearch = useRef(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const products = await searchPOSProducts(shopId, searchQuery);
        setResults(products);
        setShowResults(true);
        onResults(products);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
        onResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300)
  ).current;

  useEffect(() => {
    debouncedSearch(query);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (product: ShopProduct) => {
    if (!hasActiveSession) {
      toast.error('Please open a cash session first');
      onSessionRequired?.();
      return;
    }
    onSelect(product);
    setQuery('');
    setResults([]);
    setShowResults(false);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setShowResults(true)}
          placeholder="Search products by name or barcode..."
          className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isSearching && (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          )}
          {query && (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <Barcode className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50"
        >
          {results.map((product) => (
            <button
              key={product.id}
              onClick={() => handleSelect(product)}
              disabled={product.current_quantity <= 0}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {product.product?.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                    <span className="font-semibold text-blue-600">
                      {product.selling_price.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      LRD
                    </span>
                    <span
                      className={
                        product.current_quantity <= product.reorder_level
                          ? 'text-red-600 font-medium'
                          : 'text-gray-600'
                      }
                    >
                      Stock: {product.current_quantity}
                    </span>
                  </div>
                  {product.product?.barcode && (
                    <p className="text-xs text-gray-500 mt-1">
                      Barcode: {product.product.barcode}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {showResults && query && !isSearching && results.length === 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50"
        >
          <p className="text-center text-gray-500 text-sm">
            No products found for "{query}"
          </p>
        </div>
      )}
    </div>
  );
}
