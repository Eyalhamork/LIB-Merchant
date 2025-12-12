// hooks/use-products.ts

import { useState, useEffect } from 'react';
import {
  getShopProducts,
  getShopProductById,
  searchProducts,
  getLowStockProducts,
  getFavoriteProducts,
  getCategories,
  getProductStats,
} from '@/lib/supabase/products';
import type { ShopProduct } from '@/types';

export function useProducts(shopId: string | undefined) {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    if (!shopId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getShopProducts(shopId);
      setProducts(data);
    } catch (err: any) {
      console.error('Load products error:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [shopId]);

  return {
    products,
    isLoading,
    error,
    reload: loadProducts,
  };
}

export function useProduct(shopProductId: string | undefined) {
  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProduct = async () => {
    if (!shopProductId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getShopProductById(shopProductId);
      setProduct(data);
    } catch (err: any) {
      console.error('Load product error:', err);
      setError(err.message || 'Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [shopProductId]);

  return {
    product,
    isLoading,
    error,
    reload: loadProduct,
  };
}

export function useProductSearch(shopId: string | undefined, query: string) {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const search = async () => {
      if (!shopId) return;

      setIsSearching(true);

      try {
        const data = await searchProducts(shopId, query);
        setProducts(data);
      } catch (err) {
        console.error('Search error:', err);
        setProducts([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(search, 300);

    return () => clearTimeout(timeoutId);
  }, [shopId, query]);

  return {
    products,
    isSearching,
  };
}

export function useLowStockProducts(shopId: string | undefined) {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!shopId) return;

      setIsLoading(true);

      try {
        const data = await getLowStockProducts(shopId);
        setProducts(data);
      } catch (err) {
        console.error('Load low stock error:', err);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [shopId]);

  return {
    products,
    isLoading,
  };
}

export function useFavoriteProducts(shopId: string | undefined) {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!shopId) return;

      setIsLoading(true);

      try {
        const data = await getFavoriteProducts(shopId);
        setProducts(data);
      } catch (err) {
        console.error('Load favorites error:', err);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [shopId]);

  return {
    products,
    isLoading,
  };
}

export function useCategories(shopId: string | undefined) {
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!shopId) return;

      setIsLoading(true);

      try {
        const data = await getCategories(shopId);
        setCategories(data);
      } catch (err) {
        console.error('Load categories error:', err);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [shopId]);

  return {
    categories,
    isLoading,
  };
}

export function useProductStats(shopId: string | undefined) {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!shopId) return;

      setIsLoading(true);

      try {
        const data = await getProductStats(shopId);
        setStats(data);
      } catch (err) {
        console.error('Load stats error:', err);
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [shopId]);

  return {
    stats,
    isLoading,
  };
}
