// lib/supabase/price-history.ts
import { createClient } from '@/lib/supabase/client';
import { logActivity } from './activity-log';

interface PriceChange {
  id: string;
  shop_product_id: string;
  old_cost_price: number;
  new_cost_price: number;
  old_selling_price: number;
  new_selling_price: number;
  changed_by: string;
  reason?: string;
  created_at: string;
}

interface PriceChangeHistory extends PriceChange {
  shop_product?: {
    product?: {
      name: string;
    };
  };
  changed_by_profile?: {
    name: string;
  };
}

/**
 * Log a price change
 */
export async function logPriceChange(
  shopProductId: string,
  oldCostPrice: number,
  newCostPrice: number,
  oldSellingPrice: number,
  newSellingPrice: number,
  reason?: string
) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get product name for activity log
    const { data: shopProduct } = await supabase
      .from('shop_products')
      .select('product:products(name)')
      .eq('id', shopProductId)
      .single();

    const productName = (shopProduct?.product as any)?.[0]?.name || (shopProduct?.product as any)?.name || 'Unknown Product';

    // Insert price change record
    const { error: priceError } = await supabase.from('price_changes').insert({
      shop_product_id: shopProductId,
      old_cost_price: oldCostPrice,
      new_cost_price: newCostPrice,
      old_selling_price: oldSellingPrice,
      new_selling_price: newSellingPrice,
      changed_by: user.id,
      reason,
    });

    if (priceError) throw priceError;

    // Log activity
    await logActivity('price_changed', `Price updated for ${productName}`, {
      referenceType: 'shop_product',
      referenceId: shopProductId,
      metadata: {
        old_cost_price: oldCostPrice,
        new_cost_price: newCostPrice,
        old_selling_price: oldSellingPrice,
        new_selling_price: newSellingPrice,
        reason,
      },
    });

    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Get price change history for a product
 */
export async function getProductPriceHistory(shopProductId: string) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('price_changes')
      .select(
        `
        *,
        changed_by_profile:profiles!price_changes_changed_by_fkey(name)
      `
      )
      .eq('shop_product_id', shopProductId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data as PriceChangeHistory[], error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

/**
 * Get all price changes for shop
 */
export async function getShopPriceHistory(options?: {
  limit?: number;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const supabase = createClient();

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

    let query = supabase
      .from('price_changes')
      .select(
        `
        *,
        shop_product:shop_products(
          product:products(name)
        ),
        changed_by_profile:profiles!price_changes_changed_by_fkey(name)
      `
      )
      .eq('shop_product.shop_id', profile.shop_id)
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate);
    }

    if (options?.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data as PriceChangeHistory[], error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

/**
 * Get recent price changes
 */
export async function getRecentPriceChanges(limit: number = 20) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return getShopPriceHistory({
    limit,
    startDate: sevenDaysAgo.toISOString(),
  });
}

/**
 * Get price change statistics
 */
export async function getPriceChangeStats(startDate?: string, endDate?: string) {
  try {
    const supabase = createClient();

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

    let query = supabase
      .from('price_changes')
      .select('*')
      .eq('shop_product.shop_id', profile.shop_id);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate statistics
    const totalChanges = data.length;
    const priceIncreases = data.filter(
      (change) => change.new_selling_price > change.old_selling_price
    ).length;
    const priceDecreases = data.filter(
      (change) => change.new_selling_price < change.old_selling_price
    ).length;

    const avgPriceIncrease =
      data
        .filter((change) => change.new_selling_price > change.old_selling_price)
        .reduce(
          (sum, change) => sum + (change.new_selling_price - change.old_selling_price),
          0
        ) /
        (priceIncreases || 1);

    const avgPriceDecrease =
      data
        .filter((change) => change.new_selling_price < change.old_selling_price)
        .reduce(
          (sum, change) => sum + (change.old_selling_price - change.new_selling_price),
          0
        ) /
        (priceDecreases || 1);

    return {
      data: {
        totalChanges,
        priceIncreases,
        priceDecreases,
        avgPriceIncrease,
        avgPriceDecrease,
      },
      error: null,
    };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

/**
 * Export price change history to CSV
 */
export async function exportPriceHistoryToCSV(
  startDate?: string,
  endDate?: string
): Promise<string> {
  const { data, error } = await getShopPriceHistory({ startDate, endDate });

  if (error || !data) {
    throw new Error(error || 'Failed to fetch price history');
  }

  // CSV headers
  const headers = [
    'Date',
    'Product',
    'Old Cost Price',
    'New Cost Price',
    'Old Selling Price',
    'New Selling Price',
    'Changed By',
    'Reason',
  ];

  // CSV rows
  const rows = data.map((change) => [
    new Date(change.created_at).toLocaleString(),
    change.shop_product?.product?.name || 'Unknown',
    change.old_cost_price.toFixed(2),
    change.new_cost_price.toFixed(2),
    change.old_selling_price.toFixed(2),
    change.new_selling_price.toFixed(2),
    change.changed_by_profile?.name || 'Unknown',
    change.reason || '',
  ]);

  // Generate CSV
  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

  return csv;
}
