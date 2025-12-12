// components/products/product-list.tsx

'use client';

import { useState } from 'react';
import { ProductCard } from './product-card';
import { CategoryFilter } from './category-filter';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import EmptyState from '@/components/ui/empty-state';
import { Search, Package } from 'lucide-react';
import type { ShopProduct } from '@/types';

interface ProductListProps {
  products: ShopProduct[];
  shopId: string;
  onProductClick?: (product: ShopProduct) => void;
  onEdit?: (product: ShopProduct) => void;
  showCostPrice?: boolean;
  onFavoriteToggle?: () => void;
}

type SortOption = 'name' | 'price' | 'quantity' | 'recent';

export function ProductList({
  products,
  shopId,
  onProductClick,
  onEdit,
  showCostPrice = false,
  onFavoriteToggle,
}: ProductListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>(
    'all'
  );

  // Filter products
  const filteredProducts = products.filter((product) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const name = product.product?.name?.toLowerCase() || '';
      const category = product.product?.category?.toLowerCase() || '';
      const barcode = product.product?.barcode?.toLowerCase() || '';

      if (
        !name.includes(query) &&
        !category.includes(query) &&
        !barcode.includes(query)
      ) {
        return false;
      }
    }

    // Category filter
    if (selectedCategory && product.product?.category !== selectedCategory) {
      return false;
    }

    // Stock filter
    if (stockFilter === 'in-stock' && product.current_quantity === 0) {
      return false;
    }
    if (stockFilter === 'low-stock') {
      if (
        product.current_quantity === 0 ||
        product.current_quantity > product.reorder_level
      ) {
        return false;
      }
    }
    if (stockFilter === 'out-of-stock' && product.current_quantity !== 0) {
      return false;
    }

    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.product?.name || '').localeCompare(b.product?.name || '');
      case 'price':
        return b.selling_price - a.selling_price;
      case 'quantity':
        return a.current_quantity - b.current_quantity;
      case 'recent':
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <CategoryFilter
            shopId={shopId}
            value={selectedCategory}
            onChange={setSelectedCategory}
          />

          {/* Stock Filter */}
          <Select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
          >
            <option value="all">All Products</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </Select>

          {/* Sort By */}
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
            <option value="quantity">Sort by Quantity</option>
            <option value="recent">Most Recent</option>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      {filteredProducts.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {sortedProducts.length} of {products.length} products
          </p>
        </div>
      )}

      {/* Product Grid */}
      {sortedProducts.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title={
            searchQuery || selectedCategory || stockFilter !== 'all'
              ? 'No products found'
              : 'No products yet'
          }
          description={
            searchQuery || selectedCategory || stockFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Add your first product to get started'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onProductClick={onProductClick}
              onEdit={onEdit}
              showCostPrice={showCostPrice}
              onFavoriteToggle={onFavoriteToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
