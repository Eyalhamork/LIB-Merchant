// components/returns/select-items-step.tsx

'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import Textarea from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';
import type { Transaction, ReturnReason } from '@/types';

interface ReturnItem {
  shop_product_id: string;
  product_name: string;
  quantity: number;
  max_quantity: number;
  price_at_sale: number;
  reason: ReturnReason | '';
  reason_notes: string;
  restore_to_stock: boolean;
}

interface SelectItemsStepProps {
  transaction: Transaction;
  returnItems: ReturnItem[];
  onItemsSelected: (items: ReturnItem[]) => void;
  onBack: () => void;
}

const RETURN_REASONS: { value: ReturnReason; label: string }[] = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'expired', label: 'Expired' },
  { value: 'wrong_item', label: 'Wrong Item' },
  { value: 'changed_mind', label: 'Changed Mind' },
  { value: 'defective', label: 'Defective' },
  { value: 'other', label: 'Other' },
];

export function SelectItemsStep({
  transaction,
  returnItems,
  onItemsSelected,
  onBack,
}: SelectItemsStepProps) {
  const [items, setItems] = useState<ReturnItem[]>(returnItems);

  const updateItem = (index: number, updates: Partial<ReturnItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };

    // Auto-set restore_to_stock based on reason
    if (updates.reason) {
      const shouldNotRestore = ['damaged', 'expired'].includes(updates.reason);
      newItems[index].restore_to_stock = !shouldNotRestore;
    }

    setItems(newItems);
  };

  const handleSubmit = () => {
    const itemsToReturn = items.filter((item) => item.quantity > 0);

    if (itemsToReturn.length === 0) {
      return;
    }

    // Validate reasons
    const missingReasons = itemsToReturn.filter((item) => !item.reason);
    if (missingReasons.length > 0) {
      return;
    }

    onItemsSelected(items);
  };

  const totalRefund = items.reduce(
    (sum, item) => sum + item.quantity * item.price_at_sale,
    0
  );

  const selectedItemsCount = items.filter((item) => item.quantity > 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Select Items to Return
        </h2>
        <p className="text-sm text-gray-600">
          Choose items, quantities, and reasons for return
        </p>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
            {/* Product Info */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                <p className="text-sm text-gray-600">
                  Original quantity: {item.max_quantity} × {formatCurrency(item.price_at_sale)}
                </p>
              </div>
              <p className="font-medium text-gray-900">
                {formatCurrency(item.max_quantity * item.price_at_sale)}
              </p>
            </div>

            {/* Return Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Return Quantity
                </label>
                <Input
                  type="number"
                  min="0"
                  max={item.max_quantity}
                  value={item.quantity || ''}
                  onChange={(e) =>
                    updateItem(index, {
                      quantity: Math.min(
                        parseInt(e.target.value) || 0,
                        item.max_quantity
                      ),
                    })
                  }
                  placeholder="0"
                />
              </div>

              {item.quantity > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Refund Amount
                  </label>
                  <Input
                    type="text"
                    value={formatCurrency(item.quantity * item.price_at_sale)}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              )}
            </div>

            {/* Return Reason */}
            {item.quantity > 0 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Return Reason *
                  </label>
                  <Select
                    value={item.reason}
                    onChange={(e) =>
                      updateItem(index, {
                        reason: e.target.value as ReturnReason,
                      })
                    }
                  >
                    <option value="">Select reason</option>
                    {RETURN_REASONS.map((reason) => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Notes for "Other" */}
                {item.reason === 'other' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason Details *
                    </label>
                    <Textarea
                      value={item.reason_notes}
                      onChange={(e) =>
                        updateItem(index, { reason_notes: e.target.value })
                      }
                      placeholder="Please explain the reason..."
                      rows={2}
                    />
                  </div>
                )}

                {/* Restore to Stock */}
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={item.restore_to_stock}
                    onChange={(e) =>
                      updateItem(index, { restore_to_stock: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={
                      item.reason === 'damaged' || item.reason === 'expired'
                    }
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Restore to stock
                    {(item.reason === 'damaged' || item.reason === 'expired') &&
                      ' (disabled for damaged/expired items)'}
                  </span>
                </label>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      {selectedItemsCount > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Refund Amount</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(totalRefund)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Items Selected</p>
              <p className="text-xl font-bold text-gray-900">{selectedItemsCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={selectedItemsCount === 0}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
