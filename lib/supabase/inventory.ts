// lib/supabase/inventory.ts

import { supabase } from './client';
import type { AdjustmentReason, StockMovementType } from '@/types';

// ==================
// RESTOCK OPERATIONS
// ==================

export interface RestockProductData {
  shopProductId: string;
  quantity: number;
  costPrice?: number;
  supplierName?: string;
  notes?: string;
  userId: string;
}

export async function restockProduct(data: RestockProductData) {
  try {
    // 1. Get current quantity from shop_products
    const { data: shopProduct, error: fetchError } = await supabase
      .from('shop_products')
      .select('current_quantity, cost_price, shop_id')
      .eq('id', data.shopProductId)
      .single();

    if (fetchError) throw fetchError;
    if (!shopProduct) throw new Error('Product not found');

    const quantityBefore = shopProduct.current_quantity;
    const quantityAfter = quantityBefore + data.quantity;

    // 2. Update shop_products
    const updateData: any = {
      current_quantity: quantityAfter,
      last_restocked_at: new Date().toISOString(),
    };

    // Update cost price if provided
    if (data.costPrice !== undefined) {
      updateData.cost_price = data.costPrice;
    }

    const { data: updatedProduct, error: updateError } = await supabase
      .from('shop_products')
      .update(updateData)
      .eq('id', data.shopProductId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 3. Insert stock_movement record
    const movementNotes = [
      data.supplierName ? `Supplier: ${data.supplierName}` : '',
      data.notes || '',
    ]
      .filter(Boolean)
      .join(' - ');

    const { error: movementError } = await supabase
      .from('stock_movements')
      .insert({
        shop_id: shopProduct.shop_id,
        shop_product_id: data.shopProductId,
        movement_type: 'restock',
        quantity_change: data.quantity,
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
        user_id: data.userId,
        notes: movementNotes || 'Restock',
        owner_pin_verified: false,
      });

    if (movementError) throw movementError;

    // 4. Log activity
    await supabase.from('activity_log').insert({
      shop_id: shopProduct.shop_id,
      user_id: data.userId,
      activity_type: 'stock_restocked',
      reference_type: 'stock_movement',
      reference_id: data.shopProductId,
      description: `Restocked product: +${data.quantity} units`,
      metadata: {
        shop_product_id: data.shopProductId,
        quantity: data.quantity,
        supplier: data.supplierName,
        cost_price: data.costPrice,
      },
    });

    return updatedProduct;
  } catch (error) {
    console.error('Restock product error:', error);
    throw error;
  }
}

// ==================
// BULK RESTOCK
// ==================

export interface BulkRestockItem {
  shopProductId: string;
  quantity: number;
  costPrice?: number;
}

export interface BulkRestockData {
  shopId: string;
  items: BulkRestockItem[];
  supplierName?: string;
  notes?: string;
  userId: string;
}

export interface BulkRestockResult {
  successful: number;
  failed: number;
  errors: Array<{ productId: string; error: string }>;
}

export async function bulkRestock(data: BulkRestockData): Promise<BulkRestockResult> {
  const result: BulkRestockResult = {
    successful: 0,
    failed: 0,
    errors: [],
  };

  for (const item of data.items) {
    try {
      await restockProduct({
        shopProductId: item.shopProductId,
        quantity: item.quantity,
        costPrice: item.costPrice,
        supplierName: data.supplierName,
        notes: data.notes,
        userId: data.userId,
      });
      result.successful++;
    } catch (error: any) {
      result.failed++;
      result.errors.push({
        productId: item.shopProductId,
        error: error.message || 'Unknown error',
      });
    }
  }

  return result;
}

// ==================
// STOCK ADJUSTMENTS
// ==================

export interface AdjustStockData {
  shopProductId: string;
  quantityChange: number; // positive or negative
  adjustmentReason: AdjustmentReason;
  notes?: string;
  userId: string;
  ownerPinVerified: boolean;
}

export async function adjustStock(data: AdjustStockData) {
  try {
    // 1. Validate: negative adjustments require ownerPinVerified = true
    if (data.quantityChange < 0 && !data.ownerPinVerified) {
      throw new Error('Negative adjustments require owner PIN verification');
    }

    // 2. Get current quantity
    const { data: shopProduct, error: fetchError } = await supabase
      .from('shop_products')
      .select('current_quantity, shop_id')
      .eq('id', data.shopProductId)
      .single();

    if (fetchError) throw fetchError;
    if (!shopProduct) throw new Error('Product not found');

    const quantityBefore = shopProduct.current_quantity;
    const quantityAfter = quantityBefore + data.quantityChange;

    // 3. Validate: new quantity >= 0
    if (quantityAfter < 0) {
      throw new Error(
        `Invalid adjustment: would result in negative stock (${quantityAfter.toFixed(3)})`
      );
    }

    // 4. Update shop_products
    const { data: updatedProduct, error: updateError } = await supabase
      .from('shop_products')
      .update({ current_quantity: quantityAfter })
      .eq('id', data.shopProductId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 5. Insert stock_movement
    const { error: movementError } = await supabase
      .from('stock_movements')
      .insert({
        shop_id: shopProduct.shop_id,
        shop_product_id: data.shopProductId,
        movement_type: 'adjustment',
        quantity_change: data.quantityChange,
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
        adjustment_reason: data.adjustmentReason,
        owner_pin_verified: data.ownerPinVerified,
        user_id: data.userId,
        notes: data.notes || `Adjustment - ${data.adjustmentReason}`,
      });

    if (movementError) throw movementError;

    // 6. Log activity
    await supabase.from('activity_log').insert({
      shop_id: shopProduct.shop_id,
      user_id: data.userId,
      activity_type: 'stock_adjusted',
      reference_type: 'stock_movement',
      reference_id: data.shopProductId,
      description: `Stock adjusted: ${data.quantityChange > 0 ? '+' : ''}${data.quantityChange} units (${data.adjustmentReason})`,
      metadata: {
        shop_product_id: data.shopProductId,
        quantity_change: data.quantityChange,
        reason: data.adjustmentReason,
        owner_pin_verified: data.ownerPinVerified,
      },
    });

    return updatedProduct;
  } catch (error) {
    console.error('Adjust stock error:', error);
    throw error;
  }
}

// Backward compatibility: Keep the old function name
export async function createStockAdjustment(
  shopId: string,
  shopProductId: string,
  quantityChange: number,
  reason: AdjustmentReason,
  userId: string,
  notes?: string,
  ownerPinVerified: boolean = false
) {
  return adjustStock({
    shopProductId,
    quantityChange,
    adjustmentReason: reason,
    notes,
    userId,
    ownerPinVerified,
  });
}

// ==================
// STOCK MOVEMENTS
// ==================

export interface StockMovementsFilters {
  productId?: string;
  movementType?: StockMovementType;
  startDate?: string;
  endDate?: string;
  userId?: string;
}

export interface GetStockMovementsData {
  shopId: string;
  filters?: StockMovementsFilters;
  page?: number;
  limit?: number;
}

export interface StockMovementsResult {
  movements: any[];
  totalCount: number;
  hasMore: boolean;
}

export async function getStockMovements(
  data: GetStockMovementsData
): Promise<StockMovementsResult> {
  try {
    const page = data.page || 1;
    const limit = data.limit || 20;
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('stock_movements')
      .select(
        `
        *,
        shop_product:shop_products(
          id,
          product:products(
            id,
            name,
            unit
          )
        ),
        user:profiles(
          id,
          name,
          role
        )
      `,
        { count: 'exact' }
      )
      .eq('shop_id', data.shopId);

    // Apply filters
    if (data.filters?.productId) {
      query = query.eq('shop_product_id', data.filters.productId);
    }

    if (data.filters?.movementType) {
      query = query.eq('movement_type', data.filters.movementType);
    }

    if (data.filters?.startDate) {
      query = query.gte('created_at', data.filters.startDate);
    }

    if (data.filters?.endDate) {
      query = query.lte('created_at', data.filters.endDate);
    }

    if (data.filters?.userId) {
      query = query.eq('user_id', data.filters.userId);
    }

    // Order and paginate
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: movements, error, count } = await query;

    if (error) throw error;

    return {
      movements: movements || [],
      totalCount: count || 0,
      hasMore: count ? offset + limit < count : false,
    };
  } catch (error) {
    console.error('Get stock movements error:', error);
    throw error;
  }
}

// ==================
// LOW STOCK PRODUCTS
// ==================

export interface GetLowStockProductsData {
  shopId: string;
  threshold?: number;
}

export async function getLowStockProducts(data: GetLowStockProductsData) {
  try {
    let query = supabase
      .from('shop_products')
      .select(
        `
        *,
        product:products(
          id,
          name,
          category,
          unit,
          image_url
        )
      `
      )
      .eq('shop_id', data.shopId)
      .eq('is_active', true);

    // Use custom threshold or compare with reorder_level
    if (data.threshold !== undefined) {
      query = query.lte('current_quantity', data.threshold);
    } else {
      // Use PostgreSQL to compare columns
      query = query.filter('current_quantity', 'lte', 'reorder_level');
    }

    const { data: products, error } = await query.order('current_quantity', { ascending: true });

    if (error) throw error;

    return products || [];
  } catch (error) {
    console.error('Get low stock products error:', error);
    throw error;
  }
}

// ==================
// INVENTORY STATS
// ==================

export interface InventoryStats {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
}

export async function getInventoryStats(shopId: string): Promise<InventoryStats> {
  try {
    // Get all active products
    const { data: products, error } = await supabase
      .from('shop_products')
      .select('current_quantity, reorder_level, cost_price')
      .eq('shop_id', shopId)
      .eq('is_active', true);

    if (error) throw error;

    const stats: InventoryStats = {
      totalProducts: products?.length || 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      totalInventoryValue: 0,
    };

    if (products) {
      for (const product of products) {
        // Count low stock and out of stock
        if (product.current_quantity === 0) {
          stats.outOfStockCount++;
          stats.lowStockCount++; // Out of stock is also low stock
        } else if (product.current_quantity <= product.reorder_level) {
          stats.lowStockCount++;
        }

        // Calculate total inventory value
        stats.totalInventoryValue += product.current_quantity * product.cost_price;
      }
    }

    return stats;
  } catch (error) {
    console.error('Get inventory stats error:', error);
    throw error;
  }
}
