// components/inventory/restock-form.tsx

'use client';

import { useState, useEffect } from 'react';
import { getShopProducts } from '@/lib/supabase/products';
import { restockProduct } from '@/lib/supabase/inventory';
import type { ShopProduct } from '@/types';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import Textarea from '@/components/ui/textarea';
import Spinner from '@/components/ui/spinner';
import { Package, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatQuantity } from '@/lib/utils';

interface RestockFormProps {
  shopId: string;
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  preselectedProductId?: string;
}

export default function RestockForm({
  shopId,
  userId,
  onSuccess,
  onCancel,
  preselectedProductId,
}: RestockFormProps) {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    product_id: preselectedProductId || '',
    quantity: '',
    cost_price: '',
    supplier_name: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProducts();
  }, [shopId]);

  useEffect(() => {
    if (preselectedProductId) {
      setFormData((prev) => ({ ...prev, product_id: preselectedProductId }));
    }
  }, [preselectedProductId]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await getShopProducts(shopId);
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === formData.product_id);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_id) {
      newErrors.product_id = 'Please select a product';
    }

    const quantity = parseFloat(formData.quantity);
    if (!formData.quantity || isNaN(quantity) || quantity <= 0) {
      newErrors.quantity = 'Please enter a valid quantity';
    } else if (quantity < 0.001) {
      newErrors.quantity = 'Minimum quantity is 0.001';
    } else if (quantity > 999999.999) {
      newErrors.quantity = 'Quantity too large (max: 999,999.999)';
    }

    // Cost price is optional, but if provided, must be valid
    if (formData.cost_price) {
      const costPrice = parseFloat(formData.cost_price);
      if (isNaN(costPrice) || costPrice < 0) {
        newErrors.cost_price = 'Please enter a valid cost price';
      } else if (costPrice > 9999999999.99) {
        newErrors.cost_price = 'Cost price too large';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const quantity = parseFloat(formData.quantity);
      const costPrice = formData.cost_price ? parseFloat(formData.cost_price) : undefined;

      await restockProduct({
        shopProductId: formData.product_id,
        quantity,
        costPrice,
        supplierName: formData.supplier_name.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        userId,
      });

      toast.success('Product restocked successfully');

      // Reset form
      setFormData({
        product_id: '',
        quantity: '',
        cost_price: '',
        supplier_name: '',
        notes: '',
      });

      onSuccess?.();
    } catch (error: any) {
      console.error('Restock error:', error);
      toast.error(error.message || 'Failed to restock product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateNewQuantity = () => {
    if (!selectedProduct || !formData.quantity) return null;
    const quantity = parseFloat(formData.quantity);
    return selectedProduct.current_quantity + quantity;
  };

  const newQuantity = calculateNewQuantity();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Product <span className="text-red-500">*</span>
        </label>
        <Select
          value={formData.product_id}
          onChange={(e) => {
            setFormData({ ...formData, product_id: e.target.value });
            setErrors({ ...errors, product_id: '' });
          }}
          disabled={!!preselectedProductId}
        >
          <option value="">Select a product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.product?.name} - Current:{' '}
              {formatQuantity(product.current_quantity, product.product?.unit)}
            </option>
          ))}
        </Select>
        {errors.product_id && (
          <p className="text-sm text-red-600">{errors.product_id}</p>
        )}
      </div>

      {/* Current Stock Info */}
      {selectedProduct && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {selectedProduct.product?.name}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Current Stock:</span>
                <span className="ml-2 font-medium text-blue-900">
                  {formatQuantity(
                    selectedProduct.current_quantity,
                    selectedProduct.product?.unit
                  )}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Current Cost:</span>
                <span className="ml-2 font-medium text-blue-900">
                  {formatCurrency(selectedProduct.cost_price)}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Reorder Level:</span>
                <span className="ml-2 font-medium text-blue-900">
                  {formatQuantity(
                    selectedProduct.reorder_level,
                    selectedProduct.product?.unit
                  )}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Selling Price:</span>
                <span className="ml-2 font-medium text-blue-900">
                  {formatCurrency(selectedProduct.selling_price)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Quantity to Add <span className="text-red-500">*</span>
        </label>
        <Input
          type="number"
          step="0.001"
          min="0.001"
          max="999999.999"
          value={formData.quantity}
          onChange={(e) => {
            setFormData({ ...formData, quantity: e.target.value });
            setErrors({ ...errors, quantity: '' });
          }}
          placeholder="Enter quantity"
        />
        {errors.quantity && (
          <p className="text-sm text-red-600">{errors.quantity}</p>
        )}
      </div>

      {/* Preview New Quantity */}
      {selectedProduct && formData.quantity && newQuantity !== null && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">
              Stock After Restock
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-900">
              {formatQuantity(
                selectedProduct.current_quantity,
                selectedProduct.product?.unit
              )}
            </span>
            <span className="text-gray-400">→</span>
            <span className="font-bold text-green-600">
              {formatQuantity(newQuantity, selectedProduct.product?.unit)}
            </span>
          </div>
        </div>
      )}

      {/* Cost Price (Optional) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Cost Price (Optional)
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.cost_price}
            onChange={(e) => {
              setFormData({ ...formData, cost_price: e.target.value });
              setErrors({ ...errors, cost_price: '' });
            }}
            placeholder="Enter new cost price"
            className="pl-9"
          />
        </div>
        {errors.cost_price && (
          <p className="text-sm text-red-600">{errors.cost_price}</p>
        )}
        <p className="text-xs text-gray-500">
          Leave empty to keep current cost price. Entering a value will update the
          product's cost price.
        </p>
      </div>

      {/* Supplier Name (Optional) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Supplier Name (Optional)
        </label>
        <Input
          type="text"
          value={formData.supplier_name}
          onChange={(e) => {
            setFormData({ ...formData, supplier_name: e.target.value });
          }}
          placeholder="Enter supplier name"
          maxLength={100}
        />
      </div>

      {/* Notes (Optional) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Notes (Optional)
        </label>
        <Textarea
          value={formData.notes}
          onChange={(e) => {
            setFormData({ ...formData, notes: e.target.value });
          }}
          placeholder="Add any additional notes"
          rows={3}
          maxLength={500}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Processing...' : 'Restock Product'}
        </Button>
      </div>
    </form>
  );
}
