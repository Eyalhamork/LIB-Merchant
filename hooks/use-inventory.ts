// hooks/use-inventory.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getStockMovements,
  getLowStockProducts,
  getInventoryStats,
  restockProduct,
  adjustStock,
  bulkRestock,
  type RestockProductData,
  type AdjustStockData,
  type BulkRestockData,
  type GetStockMovementsData,
  type StockMovementsFilters,
} from '@/lib/supabase/inventory';
import type { StockMovement, ShopProduct } from '@/types';
import { toast } from 'sonner';

export function useInventory(shopId: string) {
  // ==================
  // STATE
  // ==================
  const [movements, setMovements] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<ShopProduct[]>([]);
  const [stats, setStats] = useState<any>(null);

  const [isLoadingMovements, setIsLoadingMovements] = useState(false);
  const [isLoadingLowStock, setIsLoadingLowStock] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const [isRestocking, setIsRestocking] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isBulkRestocking, setIsBulkRestocking] = useState(false);

  // ==================
  // FETCH FUNCTIONS
  // ==================

  const fetchMovements = useCallback(
    async (filters?: StockMovementsFilters, page: number = 1, limit: number = 20) => {
      setIsLoadingMovements(true);
      try {
        const data: GetStockMovementsData = {
          shopId,
          filters,
          page,
          limit,
        };
        const result = await getStockMovements(data);
        setMovements(result.movements);
        return result;
      } catch (error: any) {
        console.error('Error fetching movements:', error);
        toast.error('Failed to load stock movements');
        throw error;
      } finally {
        setIsLoadingMovements(false);
      }
    },
    [shopId]
  );

  const fetchLowStock = useCallback(
    async (threshold?: number) => {
      setIsLoadingLowStock(true);
      try {
        const products = await getLowStockProducts({ shopId, threshold });
        setLowStockProducts(products);
        return products;
      } catch (error: any) {
        console.error('Error fetching low stock:', error);
        toast.error('Failed to load low stock products');
        throw error;
      } finally {
        setIsLoadingLowStock(false);
      }
    },
    [shopId]
  );

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const data = await getInventoryStats(shopId);
      setStats(data);
      return data;
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load inventory stats');
      throw error;
    } finally {
      setIsLoadingStats(false);
    }
  }, [shopId]);

  // ==================
  // MUTATION FUNCTIONS
  // ==================

  const restock = useCallback(
    async (data: RestockProductData) => {
      setIsRestocking(true);
      try {
        const result = await restockProduct(data);
        toast.success('Product restocked successfully');
        // Refresh data
        await Promise.all([fetchMovements(), fetchLowStock(), fetchStats()]);
        return result;
      } catch (error: any) {
        console.error('Error restocking:', error);
        toast.error(error.message || 'Failed to restock product');
        throw error;
      } finally {
        setIsRestocking(false);
      }
    },
    [fetchMovements, fetchLowStock, fetchStats]
  );

  const adjust = useCallback(
    async (data: AdjustStockData) => {
      setIsAdjusting(true);
      try {
        const result = await adjustStock(data);
        toast.success('Stock adjusted successfully');
        // Refresh data
        await Promise.all([fetchMovements(), fetchLowStock(), fetchStats()]);
        return result;
      } catch (error: any) {
        console.error('Error adjusting stock:', error);
        toast.error(error.message || 'Failed to adjust stock');
        throw error;
      } finally {
        setIsAdjusting(false);
      }
    },
    [fetchMovements, fetchLowStock, fetchStats]
  );

  const bulkRestockAction = useCallback(
    async (data: BulkRestockData) => {
      setIsBulkRestocking(true);
      try {
        const result = await bulkRestock(data);

        if (result.successful > 0) {
          toast.success(`Successfully restocked ${result.successful} product(s)`);
        }

        if (result.failed > 0) {
          toast.error(`Failed to restock ${result.failed} product(s)`);
        }

        // Refresh data
        await Promise.all([fetchMovements(), fetchLowStock(), fetchStats()]);
        return result;
      } catch (error: any) {
        console.error('Error bulk restocking:', error);
        toast.error(error.message || 'Failed to bulk restock');
        throw error;
      } finally {
        setIsBulkRestocking(false);
      }
    },
    [fetchMovements, fetchLowStock, fetchStats]
  );

  // ==================
  // INITIAL LOAD
  // ==================

  useEffect(() => {
    if (shopId) {
      fetchStats();
      fetchLowStock();
    }
  }, [shopId, fetchStats, fetchLowStock]);

  // ==================
  // RETURN
  // ==================

  return {
    // Data
    movements,
    lowStockProducts,
    stats,

    // Loading states
    isLoadingMovements,
    isLoadingLowStock,
    isLoadingStats,
    isRestocking,
    isAdjusting,
    isBulkRestocking,

    // Fetch functions
    fetchMovements,
    fetchLowStock,
    fetchStats,
    refetch: useCallback(async () => {
      await Promise.all([fetchMovements(), fetchLowStock(), fetchStats()]);
    }, [fetchMovements, fetchLowStock, fetchStats]),

    // Mutation functions
    restock,
    adjust,
    bulkRestock: bulkRestockAction,
  };
}
