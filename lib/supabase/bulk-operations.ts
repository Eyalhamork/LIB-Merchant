// lib/supabase/bulk-operations.ts
import { createClient } from '@/lib/supabase/client';
import { logActivity } from './activity-log';
import { logPriceChange } from './price-history';

interface BulkRestockItem {
  shop_product_id: string;
  quantity: number;
  notes?: string;
}

interface BulkPriceUpdateItem {
  shop_product_id: string;
  cost_price?: number;
  selling_price?: number;
  reason?: string;
}

interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

/**
 * Bulk restock products
 */
export async function bulkRestockProducts(
  items: BulkRestockItem[]
): Promise<BulkOperationResult> {
  const supabase = createClient();
  const result: BulkOperationResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('shop_id')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    // Process each item
    for (const item of items) {
      try {
        // Get current product details
        const { data: shopProduct, error: productError } = await supabase
          .from('shop_products')
          .select('current_quantity, product:products(name)')
          .eq('id', item.shop_product_id)
          .single();

        if (productError) throw productError;

        const quantityBefore = shopProduct.current_quantity;
        const quantityAfter = quantityBefore + item.quantity;

        // Update product quantity
        const { error: updateError } = await supabase
          .from('shop_products')
          .update({
            current_quantity: quantityAfter,
            last_restocked_at: new Date().toISOString(),
          })
          .eq('id', item.shop_product_id);

        if (updateError) throw updateError;

        // Log stock movement
        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert({
            shop_id: profile.shop_id,
            shop_product_id: item.shop_product_id,
            movement_type: 'restock',
            quantity_change: item.quantity,
            quantity_before: quantityBefore,
            quantity_after: quantityAfter,
            adjustment_reason: 'restock',
            user_id: user.id,
            notes: item.notes,
            owner_pin_verified: false,
          });

        if (movementError) throw movementError;

        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          id: item.shop_product_id,
          error: error.message,
        });
      }
    }

    // Log bulk activity
    await logActivity(
      'stock_restocked',
      `Bulk restock completed: ${result.success} successful, ${result.failed} failed`,
      {
        metadata: {
          total_items: items.length,
          success_count: result.success,
          failed_count: result.failed,
        },
      }
    );

    return result;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

/**
 * Bulk update prices
 */
export async function bulkUpdatePrices(
  items: BulkPriceUpdateItem[]
): Promise<BulkOperationResult> {
  const supabase = createClient();
  const result: BulkOperationResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check user permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, can_change_prices')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Profile not found');

    if (profile.role === 'employee' && !profile.can_change_prices) {
      throw new Error('You do not have permission to change prices');
    }

    // Process each item
    for (const item of items) {
      try {
        // Get current prices
        const { data: shopProduct, error: productError } = await supabase
          .from('shop_products')
          .select('cost_price, selling_price, product:products(name)')
          .eq('id', item.shop_product_id)
          .single();

        if (productError) throw productError;

        const updates: any = {};
        const oldCostPrice = shopProduct.cost_price;
        const oldSellingPrice = shopProduct.selling_price;
        let newCostPrice = oldCostPrice;
        let newSellingPrice = oldSellingPrice;

        // Prepare updates
        if (item.cost_price !== undefined && item.cost_price !== oldCostPrice) {
          updates.cost_price = item.cost_price;
          newCostPrice = item.cost_price;
        }

        if (
          item.selling_price !== undefined &&
          item.selling_price !== oldSellingPrice
        ) {
          updates.selling_price = item.selling_price;
          newSellingPrice = item.selling_price;
        }

        // Skip if no changes
        if (Object.keys(updates).length === 0) {
          continue;
        }

        // Update product
        const { error: updateError } = await supabase
          .from('shop_products')
          .update(updates)
          .eq('id', item.shop_product_id);

        if (updateError) throw updateError;

        // Log price change
        await logPriceChange(
          item.shop_product_id,
          oldCostPrice,
          newCostPrice,
          oldSellingPrice,
          newSellingPrice,
          item.reason
        );

        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          id: item.shop_product_id,
          error: error.message,
        });
      }
    }

    // Log bulk activity
    await logActivity(
      'price_changed',
      `Bulk price update completed: ${result.success} successful, ${result.failed} failed`,
      {
        metadata: {
          total_items: items.length,
          success_count: result.success,
          failed_count: result.failed,
        },
      }
    );

    return result;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

/**
 * Bulk update reorder levels
 */
export async function bulkUpdateReorderLevels(
  items: Array<{
    shop_product_id: string;
    reorder_level: number;
  }>
): Promise<BulkOperationResult> {
  const supabase = createClient();
  const result: BulkOperationResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Process each item
    for (const item of items) {
      try {
        const { error: updateError } = await supabase
          .from('shop_products')
          .update({
            reorder_level: item.reorder_level,
          })
          .eq('id', item.shop_product_id);

        if (updateError) throw updateError;

        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          id: item.shop_product_id,
          error: error.message,
        });
      }
    }

    // Log activity
    await logActivity(
      'settings_changed',
      `Bulk reorder level update: ${result.success} successful, ${result.failed} failed`,
      {
        metadata: {
          total_items: items.length,
          success_count: result.success,
          failed_count: result.failed,
        },
      }
    );

    return result;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

/**
 * Bulk activate/deactivate products
 */
export async function bulkToggleProductStatus(
  productIds: string[],
  isActive: boolean
): Promise<BulkOperationResult> {
  const supabase = createClient();
  const result: BulkOperationResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Process each product
    for (const productId of productIds) {
      try {
        const { error: updateError } = await supabase
          .from('shop_products')
          .update({ is_active: isActive })
          .eq('id', productId);

        if (updateError) throw updateError;

        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          id: productId,
          error: error.message,
        });
      }
    }

    // Log activity
    await logActivity(
      'settings_changed',
      `Bulk ${isActive ? 'activated' : 'deactivated'} products: ${result.success} successful, ${result.failed} failed`,
      {
        metadata: {
          total_items: productIds.length,
          success_count: result.success,
          failed_count: result.failed,
          is_active: isActive,
        },
      }
    );

    return result;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

/**
 * Bulk delete products (soft delete - set is_active to false)
 */
export async function bulkDeleteProducts(
  productIds: string[]
): Promise<BulkOperationResult> {
  return bulkToggleProductStatus(productIds, false);
}

/**
 * Generate bulk operation CSV template
 */
export function generateBulkRestockTemplate(): string {
  const headers = ['Product ID', 'Product Name (reference)', 'Quantity', 'Notes'];
  const example = [
    'prod-123',
    'Example Product',
    '10',
    'Monthly restock',
  ];

  return [headers, example].map((row) => row.join(',')).join('\n');
}

export function generateBulkPriceUpdateTemplate(): string {
  const headers = [
    'Product ID',
    'Product Name (reference)',
    'Cost Price',
    'Selling Price',
    'Reason',
  ];
  const example = [
    'prod-123',
    'Example Product',
    '10.00',
    '15.00',
    'Price adjustment',
  ];

  return [headers, example].map((row) => row.join(',')).join('\n');
}
