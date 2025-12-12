// components/inventory/adjustment-form.tsx

'use client';

import { useState, useEffect } from 'react';
import { getShopProducts } from '@/lib/supabase/products';
import type { ShopProduct, AdjustmentReason } from '@/types';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import Textarea from '@/components/ui/textarea';
import Spinner from '@/components/ui/spinner';
import { PinVerificationModal } from '@/components/shared/pin-verification-modal';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatQuantity } from '@/lib/utils';

type AdjustmentType = 'positive' | 'negative';

const POSITIVE_REASONS: { value: AdjustmentReason; label: string }[] = [
  { value: 'restock', label: 'Restock - New inventory from supplier' },
  { value: 'found', label: 'Found - Items were miscounted' },
  { value: 'return_to_stock', label: 'Return to Stock - Customer return' },
];

const NEGATIVE_REASONS: { value: AdjustmentReason; label: string }[] = [
  { value: 'expired', label: 'Expired - Past expiration date' },
  { value: 'damaged', label: 'Damaged - Broken or unusable' },
  { value: 'lost', label: 'Lost - Missing/stolen' },
  { value: 'supplier_short', label: 'Supplier Short - Delivered less than invoiced' },
  { value: 'internal_use', label: 'Internal Use - Used for shop operations' },
  { value: 'promotional', label: 'Promotional - Given away as promotion' },
  { value: 'owner_withdrawal', label: 'Owner Withdrawal - Taken for personal use' },
];

interface AdjustmentFormProps {
  shopId: string;
  userId: string;
  userRole: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AdjustmentForm({
  shopId,
  userId,
  userRole,
  onSuccess,
  onCancel,
}: AdjustmentFormProps) {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [formData, setFormData] = useState({
    product_id: '',
    adjustment_type: 'positive' as AdjustmentType,
    quantity: '',
    reason: '' as AdjustmentReason,
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProducts();
  }, [shopId]);

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

  const availableReasons =
    formData.adjustment_type === 'positive' ? POSITIVE_REASONS : NEGATIVE_REASONS;

  const calculateNewQuantity = () => {
    if (!selectedProduct || !formData.quantity) return null;

    const quantity = parseFloat(formData.quantity);
    const quantityChange =
      formData.adjustment_type === 'positive' ? quantity : -quantity;

    return selectedProduct.current_quantity + quantityChange;
  };

  const newQuantity = calculateNewQuantity();

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_id) {
      newErrors.product_id = 'Please select a product';
    }

    const quantity = parseFloat(formData.quantity);
    if (!formData.quantity || isNaN(quantity) || quantity <= 0) {
      newErrors.quantity = 'Please enter a valid quantity';
    } else if (quantity > 999999.999) {
      newErrors.quantity = 'Quantity too large (max: 999,999.999)';
    }

    if (!formData.reason) {
      newErrors.reason = 'Please select a reason';
    }

    // Notes required for negative adjustments (min 10 characters)
    if (formData.adjustment_type === 'negative') {
      if (!formData.notes.trim()) {
        newErrors.notes = 'Notes are required for negative adjustments';
      } else if (formData.notes.trim().length < 10) {
        newErrors.notes = 'Notes must be at least 10 characters';
      }
    }

    // Check for negative stock
    if (newQuantity !== null && newQuantity < 0) {
      newErrors.quantity = 'This adjustment would result in negative stock';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    // Check for large adjustments (>50% of current stock)
    if (selectedProduct) {
      const quantity = parseFloat(formData.quantity);
      const percentChange = (quantity / selectedProduct.current_quantity) * 100;

      if (percentChange > 50) {
        setShowConfirmation(true);
        return;
      }
    }

    // Negative adjustments require PIN verification
    if (formData.adjustment_type === 'negative') {
      setShowPinModal(true);
      return;
    }

    // Positive adjustments can proceed directly
    await processAdjustment();
  };

  const handleConfirmLargeAdjustment = () => {
    setShowConfirmation(false);

    // After confirming, check if PIN is needed
    if (formData.adjustment_type === 'negative') {
      setShowPinModal(true);
    } else {
      processAdjustment();
    }
  };

  const processAdjustment = async () => {
    setIsSubmitting(true);

    try {
      const quantity = parseFloat(formData.quantity);
      const quantityChange =
        formData.adjustment_type === 'positive' ? quantity : -quantity;

      const { adjustStock } = await import('@/lib/supabase/inventory');

      await adjustStock({
        shopProductId: formData.product_id,
        quantityChange,
        adjustmentReason: formData.reason,
        notes: formData.notes.trim() || undefined,
        userId,
        ownerPinVerified: formData.adjustment_type === 'negative',
      });

      toast.success('Inventory adjusted successfully');

      // Reset form
      setFormData({
        product_id: '',
        adjustment_type: 'positive',
        quantity: '',
        reason: '' as AdjustmentReason,
        notes: '',
      });

      onSuccess?.();
    } catch (error: any) {
      console.error('Adjustment error:', error);
      toast.error(error.message || 'Failed to adjust inventory');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Adjustment Type */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Adjustment Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, adjustment_type: 'positive', reason: '' as AdjustmentReason })
              }
              className={`p-4 border-2 rounded-lg transition-colors ${
                formData.adjustment_type === 'positive'
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <TrendingUp
                className={`h-6 w-6 mx-auto mb-2 ${
                  formData.adjustment_type === 'positive'
                    ? 'text-green-600'
                    : 'text-gray-400'
                }`}
              />
              <div className="text-sm font-medium text-gray-900">Increase</div>
              <div className="text-xs text-gray-500 mt-1">Add stock</div>
            </button>

            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, adjustment_type: 'negative', reason: '' as AdjustmentReason })
              }
              className={`p-4 border-2 rounded-lg transition-colors ${
                formData.adjustment_type === 'negative'
                  ? 'border-red-600 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <TrendingDown
                className={`h-6 w-6 mx-auto mb-2 ${
                  formData.adjustment_type === 'negative'
                    ? 'text-red-600'
                    : 'text-gray-400'
                }`}
              />
              <div className="text-sm font-medium text-gray-900">Decrease</div>
              <div className="text-xs text-gray-500 mt-1">Remove stock</div>
            </button>
          </div>
        </div>

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
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  {selectedProduct.product?.name}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
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
                    <span className="text-blue-700">Reorder Level:</span>
                    <span className="ml-2 font-medium text-blue-900">
                      {formatQuantity(
                        selectedProduct.reorder_level,
                        selectedProduct.product?.unit
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Quantity{' '}
            {formData.adjustment_type === 'positive' ? 'to Add' : 'to Remove'}{' '}
            <span className="text-red-500">*</span>
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
          <div
            className={`p-3 rounded-lg border ${
              newQuantity < 0
                ? 'bg-red-50 border-red-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Stock After Adjustment:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {formatQuantity(
                    selectedProduct.current_quantity,
                    selectedProduct.product?.unit
                  )}
                </span>
                <span className="text-gray-400">→</span>
                <span
                  className={`font-bold ${
                    newQuantity < 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {formatQuantity(newQuantity, selectedProduct.product?.unit)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Reason */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Reason <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.reason}
            onChange={(e) => {
              setFormData({
                ...formData,
                reason: e.target.value as AdjustmentReason,
              });
              setErrors({ ...errors, reason: '' });
            }}
          >
            <option value="">Select a reason</option>
            {availableReasons.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </Select>
          {errors.reason && <p className="text-sm text-red-600">{errors.reason}</p>}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Notes
            {formData.adjustment_type === 'negative' && (
              <span className="text-red-500"> * (minimum 10 characters)</span>
            )}
          </label>
          <Textarea
            value={formData.notes}
            onChange={(e) => {
              setFormData({ ...formData, notes: e.target.value });
              setErrors({ ...errors, notes: '' });
            }}
            placeholder="Add notes about this adjustment"
            rows={3}
          />
          {errors.notes && <p className="text-sm text-red-600">{errors.notes}</p>}
        </div>

        {/* Warning for negative adjustments */}
        {formData.adjustment_type === 'negative' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">Owner PIN Required</p>
                <p className="text-sm text-amber-800 mt-1">
                  Negative stock adjustments require owner PIN verification for security
                  purposes.
                </p>
              </div>
            </div>
          </div>
        )}

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
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting
              ? 'Processing...'
              : formData.adjustment_type === 'positive'
              ? 'Add Stock'
              : 'Remove Stock'}
          </Button>
        </div>
      </div>

      {/* PIN Verification Modal */}
      <PinVerificationModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onVerified={processAdjustment}
        userId={userId}
        title="Verify Owner PIN"
        description="This negative adjustment requires owner verification. Please enter your PIN to continue."
      />

      {/* Confirmation Dialog for Large Adjustments */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Large Adjustment Detected
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  This adjustment is more than 50% of the current stock. Are you sure you
                  want to proceed?
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowConfirmation(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmLargeAdjustment}
                className="flex-1"
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
