// lib/supabase/products.ts

import { supabase } from './client';
import type { ShopProduct, Product } from '@/types';

// ==================
// GET PRODUCTS
// ==================

/**
 * Get all shop products with product details
 */
export async function getShopProducts(shopId: string) {
  const { data, error } = await supabase
    .from('shop_products')
    .select(`
      *,
      product:products(*)
    `)
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .order('product(name)');

  if (error) throw error;
  return data || [];
}

/**
 * Get a single shop product by ID
 */
export async function getShopProductById(shopProductId: string) {
  const { data, error } = await supabase
    .from('shop_products')
    .select(`
      *,
      product:products(*)
    `)
    .eq('id', shopProductId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Search products by name, category, or barcode
 */
export async function searchProducts(shopId: string, query: string) {
  if (!query.trim()) {
    return getShopProducts(shopId);
  }

  const { data, error } = await supabase
    .from('shop_products')
    .select(`
      *,
      product:products!inner(*)
    `)
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .or(
      `product.name.ilike.%${query}%,product.category.ilike.%${query}%,product.barcode.ilike.%${query}%`
    )
    .limit(50);

  if (error) throw error;
  return data || [];
}

/**
 * Get low stock products
 */
export async function getLowStockProducts(shopId: string) {
  const { data, error } = await supabase
    .from('shop_products')
    .select(`
      *,
      product:products(*)
    `)
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .order('current_quantity', { ascending: true });

  if (error) throw error;

  // Filter for products where current_quantity <= reorder_level
  return data.filter((item) => item.current_quantity <= item.reorder_level);
}

/**
 * Get favorite products
 */
export async function getFavoriteProducts(shopId: string) {
  const { data, error } = await supabase
    .from('shop_products')
    .select(`
      *,
      product:products(*)
    `)
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .eq('is_favorite', true)
    .order('product(name)');

  if (error) throw error;
  return data || [];
}

/**
 * Get products by category
 */
export async function getProductsByCategory(shopId: string, category: string) {
  const { data, error } = await supabase
    .from('shop_products')
    .select(`
      *,
      product:products!inner(*)
    `)
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .eq('product.category', category)
    .order('product(name)');

  if (error) throw error;
  return data || [];
}

// ==================
// CREATE & UPDATE
// ==================

/**
 * Create a new shop product
 */
export async function createShopProduct(
  shopId: string,
  userId: string,
  data: {
    // Product details
    name: string;
    category: string;
    subcategory?: string;
    description?: string;
    image_url?: string;
    barcode?: string;
    unit: string;
    // Pricing & inventory
    cost_price: number;
    selling_price: number;
    current_quantity: number;
    reorder_level: number;
    is_favorite?: boolean;
  }
) {
  try {
    // First, create or find the product in master catalog
    let productId: string;

    // Check if product with same name exists in master catalog
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('name', data.name)
      .eq('category', data.category)
      .single();

    if (existingProduct) {
      productId = existingProduct.id;
    } else {
      // Create new product in master catalog
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          name: data.name,
          category: data.category,
          subcategory: data.subcategory,
          description: data.description,
          image_url: data.image_url,
          barcode: data.barcode,
          unit: data.unit,
          is_generic: false, // Custom product for this shop
        })
        .select()
        .single();

      if (productError) throw productError;
      productId = newProduct.id;
    }

    // Create shop_product entry
    const { data: shopProduct, error: shopProductError } = await supabase
      .from('shop_products')
      .insert({
        shop_id: shopId,
        product_id: productId,
        cost_price: data.cost_price,
        selling_price: data.selling_price,
        current_quantity: data.current_quantity,
        reorder_level: data.reorder_level,
        is_favorite: data.is_favorite || false,
        is_active: true,
      })
      .select(`
        *,
        product:products(*)
      `)
      .single();

    if (shopProductError) throw shopProductError;

    // Log initial stock movement
    if (data.current_quantity > 0) {
      await supabase.from('stock_movements').insert({
        shop_id: shopId,
        shop_product_id: shopProduct.id,
        movement_type: 'restock',
        quantity_change: data.current_quantity,
        quantity_before: 0,
        quantity_after: data.current_quantity,
        adjustment_reason: 'restock',
        user_id: userId,
        notes: 'Initial stock',
      });
    }

    // Log activity
    await supabase.from('activity_log').insert({
      shop_id: shopId,
      user_id: userId,
      activity_type: 'stock_restocked',
      description: `Added new product: ${data.name}`,
      metadata: {
        product_id: productId,
        shop_product_id: shopProduct.id,
        initial_quantity: data.current_quantity,
      },
    });

    return shopProduct;
  } catch (error) {
    console.error('Create shop product error:', error);
    throw error;
  }
}

/**
 * Update shop product
 */
export async function updateShopProduct(
  shopProductId: string,
  shopId: string,
  userId: string,
  data: {
    cost_price?: number;
    selling_price?: number;
    reorder_level?: number;
    is_favorite?: boolean;
    is_active?: boolean;
  }
) {
  try {
    // Get current product for comparison
    const { data: currentProduct } = await supabase
      .from('shop_products')
      .select('selling_price')
      .eq('id', shopProductId)
      .single();

    // Update shop product
    const { data: shopProduct, error } = await supabase
      .from('shop_products')
      .update({
        cost_price: data.cost_price,
        selling_price: data.selling_price,
        reorder_level: data.reorder_level,
        is_favorite: data.is_favorite,
        is_active: data.is_active,
      })
      .eq('id', shopProductId)
      .select(`
        *,
        product:products(*)
      `)
      .single();

    if (error) throw error;

    // Log price change if selling price changed
    if (
      currentProduct &&
      data.selling_price &&
      data.selling_price !== currentProduct.selling_price
    ) {
      await supabase.from('price_history').insert({
        shop_product_id: shopProductId,
        old_price: currentProduct.selling_price,
        new_price: data.selling_price,
        changed_by: userId,
      });

      await supabase.from('activity_log').insert({
        shop_id: shopId,
        user_id: userId,
        activity_type: 'price_changed',
        description: `Price changed from ${currentProduct.selling_price} to ${data.selling_price}`,
        metadata: {
          shop_product_id: shopProductId,
          old_price: currentProduct.selling_price,
          new_price: data.selling_price,
        },
      });
    }

    return shopProduct;
  } catch (error) {
    console.error('Update shop product error:', error);
    throw error;
  }
}

/**
 * Update product details (name, description, image, etc.)
 */
export async function updateProductDetails(
  shopProductId: string,
  shopId: string,
  userId: string,
  data: {
    name?: string;
    category?: string;
    subcategory?: string;
    description?: string;
    image_url?: string;
    barcode?: string;
    unit?: string;
  }
) {
  try {
    // Get the product_id from shop_product
    const { data: shopProduct } = await supabase
      .from('shop_products')
      .select('product_id')
      .eq('id', shopProductId)
      .single();

    if (!shopProduct) throw new Error('Shop product not found');

    // Update the product details
    const { data: product, error } = await supabase
      .from('products')
      .update({
        name: data.name,
        category: data.category,
        subcategory: data.subcategory,
        description: data.description,
        image_url: data.image_url,
        barcode: data.barcode,
        unit: data.unit,
      })
      .eq('id', shopProduct.product_id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from('activity_log').insert({
      shop_id: shopId,
      user_id: userId,
      activity_type: 'settings_changed',
      description: `Updated product details: ${data.name}`,
      metadata: {
        product_id: shopProduct.product_id,
        shop_product_id: shopProductId,
      },
    });

    return product;
  } catch (error) {
    console.error('Update product details error:', error);
    throw error;
  }
}

/**
 * Toggle product favorite status
 */
export async function toggleFavorite(shopProductId: string, shopId: string) {
  try {
    // Get current favorite status
    const { data: current } = await supabase
      .from('shop_products')
      .select('is_favorite')
      .eq('id', shopProductId)
      .single();

    if (!current) throw new Error('Product not found');

    // Toggle favorite
    const { data, error } = await supabase
      .from('shop_products')
      .update({ is_favorite: !current.is_favorite })
      .eq('id', shopProductId)
      .select(`
        *,
        product:products(*)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Toggle favorite error:', error);
    throw error;
  }
}

/**
 * Delete (deactivate) shop product
 */
export async function deleteShopProduct(
  shopProductId: string,
  shopId: string,
  userId: string
) {
  try {
    // Soft delete by setting is_active to false
    const { data, error } = await supabase
      .from('shop_products')
      .update({ is_active: false })
      .eq('id', shopProductId)
      .select(`
        *,
        product:products(*)
      `)
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from('activity_log').insert({
      shop_id: shopId,
      user_id: userId,
      activity_type: 'settings_changed',
      description: `Deactivated product: ${data.product?.name}`,
      metadata: {
        shop_product_id: shopProductId,
      },
    });

    return data;
  } catch (error) {
    console.error('Delete shop product error:', error);
    throw error;
  }
}

// ==================
// CATEGORIES
// ==================

/**
 * Get all unique categories from shop products
 */
export async function getCategories(shopId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('shop_products')
    .select(`
      product:products!inner(category)
    `)
    .eq('shop_id', shopId)
    .eq('is_active', true);

  if (error) throw error;

  // Extract unique categories
  const categories = new Set<string>();
  data.forEach((item: any) => {
    if (item.product?.category) {
      categories.add(item.product.category);
    }
  });

  return Array.from(categories).sort();
}

// ==================
// CLOUDINARY IMAGE UPLOAD
// ==================

/**
 * Upload image to Cloudinary
 */
export async function uploadProductImage(file: File): Promise<string> {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append(
      'upload_preset',
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'shopmanager'
    );
    formData.append('folder', 'shopmanager/products');

    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
}

// ==================
// PRICE HISTORY
// ==================

/**
 * Get price history for a product
 */
export async function getPriceHistory(shopProductId: string) {
  const { data, error } = await supabase
    .from('price_history')
    .select(`
      *,
      changed_by_profile:profiles(name)
    `)
    .eq('shop_product_id', shopProductId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
}

// ==================
// STATS
// ==================

/**
 * Get product statistics
 */
export async function getProductStats(shopId: string) {
  const products = await getShopProducts(shopId);

  const stats = {
    total_products: products.length,
    low_stock_count: products.filter(
      (p) => p.current_quantity <= p.reorder_level
    ).length,
    out_of_stock_count: products.filter((p) => p.current_quantity === 0).length,
    favorite_count: products.filter((p) => p.is_favorite).length,
    total_stock_value: products.reduce(
      (sum, p) => sum + p.current_quantity * p.cost_price,
      0
    ),
    total_potential_revenue: products.reduce(
      (sum, p) => sum + p.current_quantity * p.selling_price,
      0
    ),
  };

  return stats;
}
