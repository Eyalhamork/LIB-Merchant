// app/(dashboard)/products/[id]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useProduct } from '@/hooks/use-products';
import {
  updateShopProduct,
  getPriceHistory,
  deleteShopProduct,
} from '@/lib/supabase/products';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import Badge from '@/components/ui/badge';
import Modal from '@/components/ui/modal';
import { LowStockBadge } from '@/components/products/low-stock-badge';
import { formatCurrency, formatQuantity, formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Save,
  X,
  Star,
  Package,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, profile } = useAuth();
  const productId = params.id as string;
  const { product, isLoading, reload } = useProduct(productId);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Edit form data
  const [editData, setEditData] = useState({
    cost_price: '',
    selling_price: '',
    reorder_level: '',
    is_favorite: false,
  });

  useEffect(() => {
    if (product) {
      setEditData({
        cost_price: product.cost_price.toString(),
        selling_price: product.selling_price.toString(),
        reorder_level: product.reorder_level.toString(),
        is_favorite: product.is_favorite,
      });
    }
  }, [product]);

  useEffect(() => {
    loadPriceHistory();
  }, [productId]);

  const loadPriceHistory = async () => {
    setLoadingHistory(true);
    try {
      const history = await getPriceHistory(productId);
      setPriceHistory(history);
    } catch (error) {
      console.error('Load price history error:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const canEdit = profile?.role === 'owner' || profile?.role === 'supervisor';

  const handleSave = async () => {
    if (!user || !product) return;

    setIsSaving(true);

    try {
      await updateShopProduct(product.id, product.shop_id, user.id, {
        cost_price: parseFloat(editData.cost_price),
        selling_price: parseFloat(editData.selling_price),
        reorder_level: parseFloat(editData.reorder_level),
        is_favorite: editData.is_favorite,
      });

      toast.success('Product updated successfully');
      setIsEditing(false);
      reload();
      if (editData.selling_price !== product.selling_price.toString()) {
        loadPriceHistory();
      }
    } catch (error: any) {
      console.error('Update product error:', error);
      toast.error(error.message || 'Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !product) return;

    setIsDeleting(true);

    try {
      await deleteShopProduct(product.id, product.shop_id, user.id);
      toast.success('Product deactivated');
      router.push('/products');
    } catch (error: any) {
      console.error('Delete product error:', error);
      toast.error(error.message || 'Failed to deactivate product');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (product) {
      setEditData({
        cost_price: product.cost_price.toString(),
        selling_price: product.selling_price.toString(),
        reorder_level: product.reorder_level.toString(),
        is_favorite: product.is_favorite,
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Product not found</p>
        <Button variant="secondary" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {product.product?.name}
                </h1>
                <p className="text-sm text-gray-500">Product Details</p>
              </div>
            </div>

            {canEdit && !isEditing && (
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deactivate
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Product Info Card */}
        <Card className="p-6">
          <div className="flex items-start gap-6">
            {/* Product Image */}
            <div className="flex-shrink-0">
              {product.product?.image_url ? (
                <img
                  src={product.product.image_url}
                  alt={product.product.name}
                  className="h-32 w-32 rounded-lg object-cover"
                />
              ) : (
                <div className="h-32 w-32 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {product.product?.name}
                  </h2>
                  <p className="text-gray-600 mt-1">{product.product?.category}</p>
                  {product.product?.subcategory && (
                    <p className="text-sm text-gray-500">
                      {product.product.subcategory}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {product.is_favorite && (
                    <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Favorite
                    </Badge>
                  )}
                  <LowStockBadge
                    currentQuantity={product.current_quantity}
                    reorderLevel={product.reorder_level}
                    unit={product.product?.unit}
                  />
                </div>
              </div>

              {product.product?.description && (
                <p className="text-gray-700 mb-4">{product.product.description}</p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Unit</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {product.product?.unit}
                  </p>
                </div>
                {product.product?.barcode && (
                  <div>
                    <p className="text-gray-600">Barcode</p>
                    <p className="font-medium text-gray-900">
                      {product.product.barcode}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Pricing & Inventory Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Pricing & Inventory
            </h3>
            {isEditing && (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-1" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Cost Price */}
            {profile?.role === 'owner' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Price (LRD)
                </label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editData.cost_price}
                    onChange={(e) =>
                      setEditData({ ...editData, cost_price: e.target.value })
                    }
                    disabled={isSaving}
                  />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(product.cost_price)}
                  </p>
                )}
              </div>
            )}

            {/* Selling Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selling Price (LRD)
              </label>
              {isEditing ? (
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editData.selling_price}
                  onChange={(e) =>
                    setEditData({ ...editData, selling_price: e.target.value })
                  }
                  disabled={isSaving}
                />
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(product.selling_price)}
                </p>
              )}
            </div>

            {/* Current Quantity */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Current Stock
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatQuantity(product.current_quantity, product.product?.unit)}
              </p>
            </div>

            {/* Reorder Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reorder Level
              </label>
              {isEditing ? (
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={editData.reorder_level}
                  onChange={(e) =>
                    setEditData({ ...editData, reorder_level: e.target.value })
                  }
                  disabled={isSaving}
                />
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {formatQuantity(product.reorder_level, product.product?.unit)}
                </p>
              )}
            </div>
          </div>

          {/* Favorite Toggle in Edit Mode */}
          {isEditing && (
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
              <input
                type="checkbox"
                id="edit_favorite"
                checked={editData.is_favorite}
                onChange={(e) =>
                  setEditData({ ...editData, is_favorite: e.target.checked })
                }
                disabled={isSaving}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="edit_favorite"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                Mark as Favorite
              </label>
            </div>
          )}
        </Card>

        {/* Price History */}
        {profile?.role === 'owner' && priceHistory.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Price History
              </h3>
            </div>

            {loadingHistory ? (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-3">
                {priceHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="text-sm text-gray-600">
                        {formatDate(entry.created_at, 'long')}
                      </p>
                      <p className="text-xs text-gray-500">
                        By {entry.changed_by_profile?.name || 'System'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {formatCurrency(entry.old_price)} →{' '}
                        {formatCurrency(entry.new_price)}
                      </p>
                      <p
                        className={`text-xs ${
                          entry.new_price > entry.old_price
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {entry.new_price > entry.old_price ? '+' : ''}
                        {formatCurrency(entry.new_price - entry.old_price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Deactivate Product"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to deactivate "{product.product?.name}"? This will:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Hide the product from your inventory</li>
            <li>Remove it from POS</li>
            <li>Preserve all transaction history</li>
            <li>Can be reactivated later if needed</li>
          </ul>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? 'Deactivating...' : 'Deactivate Product'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
