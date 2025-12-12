// components/products/product-form.tsx

'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import Textarea from '@/components/ui/textarea';
import { ImageUpload } from './image-upload';
import { useCategories } from '@/hooks/use-products';
import { AlertCircle } from 'lucide-react';
import type { ShopProduct } from '@/types';

interface ProductFormData {
  // Product details
  name: string;
  category: string;
  subcategory: string;
  description: string;
  image_url: string;
  barcode: string;
  unit: string;
  // Pricing & inventory
  cost_price: string;
  selling_price: string;
  current_quantity: string;
  reorder_level: string;
  is_favorite: boolean;
}

interface ProductFormProps {
  shopId: string;
  initialData?: ShopProduct;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  mode: 'add' | 'edit';
}

const UNITS = [
  { value: 'piece', label: 'Piece' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'liter', label: 'Liter (L)' },
  { value: 'meter', label: 'Meter (m)' },
  { value: 'pack', label: 'Pack' },
  { value: 'box', label: 'Box' },
  { value: 'bag', label: 'Bag' },
];

export function ProductForm({
  shopId,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  mode,
}: ProductFormProps) {
  const { categories } = useCategories(shopId);
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.product?.name || '',
    category: initialData?.product?.category || '',
    subcategory: initialData?.product?.subcategory || '',
    description: initialData?.product?.description || '',
    image_url: initialData?.product?.image_url || '',
    barcode: initialData?.product?.barcode || '',
    unit: initialData?.product?.unit || 'piece',
    cost_price: initialData?.cost_price?.toString() || '',
    selling_price: initialData?.selling_price?.toString() || '',
    current_quantity: initialData?.current_quantity?.toString() || '',
    reorder_level: initialData?.reorder_level?.toString() || '10',
    is_favorite: initialData?.is_favorite || false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    // Pricing validation
    const costPrice = parseFloat(formData.cost_price);
    const sellingPrice = parseFloat(formData.selling_price);

    if (!formData.selling_price || isNaN(sellingPrice) || sellingPrice <= 0) {
      newErrors.selling_price = 'Valid selling price is required';
    }

    if (formData.cost_price && !isNaN(costPrice) && costPrice < 0) {
      newErrors.cost_price = 'Cost price cannot be negative';
    }

    // Quantity validation
    const quantity = parseFloat(formData.current_quantity);
    if (mode === 'add' && (!formData.current_quantity || isNaN(quantity) || quantity < 0)) {
      newErrors.current_quantity = 'Valid quantity is required';
    }

    // Reorder level validation
    const reorderLevel = parseFloat(formData.reorder_level);
    if (!formData.reorder_level || isNaN(reorderLevel) || reorderLevel < 0) {
      newErrors.reorder_level = 'Valid reorder level is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product Details Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Product Details
        </h3>

        {/* Product Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Product Name <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              setErrors({ ...errors, name: '' });
            }}
            placeholder="Enter product name"
            disabled={mode === 'edit' || isSubmitting}
          />
          {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Category <span className="text-red-500">*</span>
            </label>
            {categories.length > 0 ? (
              <Select
                value={formData.category}
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value });
                  setErrors({ ...errors, category: '' });
                }}
                disabled={mode === 'edit' || isSubmitting}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__custom__">+ Add New Category</option>
              </Select>
            ) : (
              <Input
                type="text"
                value={formData.category}
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value });
                  setErrors({ ...errors, category: '' });
                }}
                placeholder="Enter category"
                disabled={mode === 'edit' || isSubmitting}
              />
            )}
            {formData.category === '__custom__' && (
              <Input
                type="text"
                placeholder="Enter new category"
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value });
                }}
                disabled={isSubmitting}
              />
            )}
            {errors.category && (
              <p className="text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          {/* Subcategory */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Subcategory (Optional)
            </label>
            <Input
              type="text"
              value={formData.subcategory}
              onChange={(e) =>
                setFormData({ ...formData, subcategory: e.target.value })
              }
              placeholder="Enter subcategory"
              disabled={mode === 'edit' || isSubmitting}
            />
          </div>
        </div>

        {/* Unit and Barcode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Unit <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              disabled={mode === 'edit' || isSubmitting}
            >
              {UNITS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Barcode (Optional)
            </label>
            <Input
              type="text"
              value={formData.barcode}
              onChange={(e) =>
                setFormData({ ...formData, barcode: e.target.value })
              }
              placeholder="Enter barcode"
              disabled={mode === 'edit' || isSubmitting}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Description (Optional)
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Enter product description..."
            rows={3}
            disabled={mode === 'edit' || isSubmitting}
          />
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Product Image (Optional)
          </label>
          <ImageUpload
            value={formData.image_url}
            onChange={(url) => setFormData({ ...formData, image_url: url })}
            onRemove={() => setFormData({ ...formData, image_url: '' })}
          />
        </div>
      </div>

      {/* Pricing & Inventory Section */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Pricing & Inventory
        </h3>

        {/* Cost and Selling Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Cost Price (LRD)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.cost_price}
              onChange={(e) => {
                setFormData({ ...formData, cost_price: e.target.value });
                setErrors({ ...errors, cost_price: '' });
              }}
              placeholder="0.00"
              disabled={isSubmitting}
            />
            {errors.cost_price && (
              <p className="text-sm text-red-600">{errors.cost_price}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Selling Price (LRD) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.selling_price}
              onChange={(e) => {
                setFormData({ ...formData, selling_price: e.target.value });
                setErrors({ ...errors, selling_price: '' });
              }}
              placeholder="0.00"
              disabled={isSubmitting}
            />
            {errors.selling_price && (
              <p className="text-sm text-red-600">{errors.selling_price}</p>
            )}
          </div>
        </div>

        {/* Quantity and Reorder Level */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Current Quantity <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="0.001"
              min="0"
              value={formData.current_quantity}
              onChange={(e) => {
                setFormData({ ...formData, current_quantity: e.target.value });
                setErrors({ ...errors, current_quantity: '' });
              }}
              placeholder="0"
              disabled={mode === 'edit' || isSubmitting}
            />
            {mode === 'edit' && (
              <p className="text-xs text-gray-500">
                Use Inventory â†' Restock to add more quantity
              </p>
            )}
            {errors.current_quantity && (
              <p className="text-sm text-red-600">{errors.current_quantity}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Reorder Level <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="0.001"
              min="0"
              value={formData.reorder_level}
              onChange={(e) => {
                setFormData({ ...formData, reorder_level: e.target.value });
                setErrors({ ...errors, reorder_level: '' });
              }}
              placeholder="10"
              disabled={isSubmitting}
            />
            {errors.reorder_level && (
              <p className="text-sm text-red-600">{errors.reorder_level}</p>
            )}
          </div>
        </div>

        {/* Favorite Toggle */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="is_favorite"
            checked={formData.is_favorite}
            onChange={(e) =>
              setFormData({ ...formData, is_favorite: e.target.checked })
            }
            disabled={isSubmitting}
            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div className="flex-1">
            <label
              htmlFor="is_favorite"
              className="block text-sm font-medium text-gray-700 cursor-pointer"
            >
              Mark as Favorite
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Favorite products appear first for quick access in POS
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      {mode === 'edit' && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900">
              Product details (name, category, etc.) cannot be changed after creation.
              You can update pricing, reorder level, and favorite status.
            </p>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting
            ? mode === 'add'
              ? 'Adding...'
              : 'Saving...'
            : mode === 'add'
            ? 'Add Product'
            : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
