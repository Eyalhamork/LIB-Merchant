// components/inventory/restock-bulk.tsx

'use client';

import { useState, useEffect } from 'react';
import { getShopProducts } from '@/lib/supabase/products';
import { bulkRestock, type BulkRestockItem } from '@/lib/supabase/inventory';
import type { ShopProduct } from '@/types';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import Textarea from '@/components/ui/textarea';
import Spinner from '@/components/ui/spinner';
import { Plus, Trash2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatQuantity } from '@/lib/utils';

interface RestockRow {
  id: string;
  product_id: string;
  quantity: string;
  cost_price: string;
}

interface RestockBulkProps {
  shopId: string;
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function RestockBulk({
  shopId,
  userId,
  onSuccess,
  onCancel,
}: RestockBulkProps) {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [rows, setRows] = useState<RestockRow[]>([
    { id: generateId(), product_id: '', quantity: '', cost_price: '' },
  ]);

  const [supplierName, setSupplierName] = useState('');
  const [notes, setNotes] = useState('');

  const [results, setResults] = useState<{
    successful: number;
    failed: number;
    errors: Array<{ productId: string; error: string }>;
  } | null>(null);

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

  function generateId() {
    return `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  const addRow = () => {
    setRows([...rows, { id: generateId(), product_id: '', quantity: '', cost_price: '' }]);
  };

  const removeRow = (id: string) => {
    if (rows.length === 1) {
      toast.error('You must have at least one row');
      return;
    }
    setRows(rows.filter((row) => row.id !== id));
  };

  const updateRow = (id: string, field: keyof RestockRow, value: string) => {
    setRows(
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const getProductById = (productId: string) => {
    return products.find((p) => p.id === productId);
  };

  const validate = (): boolean => {
    // Check if at least one row has all required fields
    const validRows = rows.filter((row) => {
      const quantity = parseFloat(row.quantity);
      return (
        row.product_id &&
        row.quantity &&
        !isNaN(quantity) &&
        quantity > 0
      );
    });

    if (validRows.length === 0) {
      toast.error('Please add at least one valid product to restock');
      return false;
    }

    // Check for duplicate products
    const productIds = validRows.map((row) => row.product_id);
    const duplicates = productIds.filter(
      (id, index) => productIds.indexOf(id) !== index
    );

    if (duplicates.length > 0) {
      toast.error('Cannot restock the same product multiple times');
      return false;
    }

    // Validate individual rows
    for (const row of validRows) {
      const quantity = parseFloat(row.quantity);

      if (quantity < 0.001) {
        toast.error('Minimum quantity is 0.001');
        return false;
      }

      if (quantity > 999999.999) {
        toast.error('Quantity too large (max: 999,999.999)');
        return false;
      }

      if (row.cost_price) {
        const costPrice = parseFloat(row.cost_price);
        if (isNaN(costPrice) || costPrice < 0) {
          toast.error('Invalid cost price');
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Filter valid rows
      const validRows = rows.filter((row) => {
        const quantity = parseFloat(row.quantity);
        return row.product_id && row.quantity && !isNaN(quantity) && quantity > 0;
      });

      // Build items array
      const items: BulkRestockItem[] = validRows.map((row) => ({
        shopProductId: row.product_id,
        quantity: parseFloat(row.quantity),
        costPrice: row.cost_price ? parseFloat(row.cost_price) : undefined,
      }));

      const result = await bulkRestock({
        shopId,
        items,
        supplierName: supplierName.trim() || undefined,
        notes: notes.trim() || undefined,
        userId,
      });

      setResults(result);
      setShowResults(true);

      if (result.successful > 0 && result.failed === 0) {
        // All successful - reset form
        setRows([{ id: generateId(), product_id: '', quantity: '', cost_price: '' }]);
        setSupplierName('');
        setNotes('');

        // Call onSuccess after a short delay to show results
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Bulk restock error:', error);
      toast.error(error.message || 'Failed to bulk restock');
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

  // Show results screen
  if (showResults && results) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mb-4">
            {results.failed === 0 ? (
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            ) : (
              <AlertCircle className="h-16 w-16 text-amber-600 mx-auto" />
            )}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Bulk Restock {results.failed === 0 ? 'Complete' : 'Partially Complete'}
          </h3>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                {results.successful} product{results.successful !== 1 ? 's' : ''}{' '}
                restocked successfully
              </span>
            </div>

            {results.failed > 0 && (
              <div className="flex items-center justify-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">
                  {results.failed} product{results.failed !== 1 ? 's' : ''} failed
                </span>
              </div>
            )}
          </div>
        </div>

        {results.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-900 mb-2">Errors:</h4>
            <ul className="space-y-1 text-sm text-red-800">
              {results.errors.map((err, idx) => (
                <li key={idx}>
                  {getProductById(err.productId)?.product?.name || err.productId}:{' '}
                  {err.error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          {results.failed > 0 ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowResults(false);
                  setResults(null);
                }}
                className="flex-1"
              >
                Try Again
              </Button>
              <Button onClick={onSuccess} className="flex-1">
                Done
              </Button>
            </>
          ) : (
            <Button onClick={onSuccess} className="w-full">
              Done
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Instructions */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-emerald-900">
            <p className="font-medium mb-1">Bulk Restock</p>
            <p>
              Add multiple products to restock at once. All items will be processed
              together with the same supplier information.
            </p>
          </div>
        </div>
      </div>

      {/* Rows Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Current
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cost Price
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row, index) => {
                const selectedProduct = getProductById(row.product_id);

                return (
                  <tr key={row.id}>
                    <td className="px-4 py-3">
                      <Select
                        value={row.product_id}
                        onChange={(e) =>
                          updateRow(row.id, 'product_id', e.target.value)
                        }
                        className="min-w-[200px]"
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option
                            key={product.id}
                            value={product.id}
                            disabled={rows.some(
                              (r) => r.id !== row.id && r.product_id === product.id
                            )}
                          >
                            {product.product?.name}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {selectedProduct
                        ? formatQuantity(
                            selectedProduct.current_quantity,
                            selectedProduct.product?.unit
                          )
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        step="0.001"
                        min="0.001"
                        value={row.quantity}
                        onChange={(e) => updateRow(row.id, 'quantity', e.target.value)}
                        placeholder="0"
                        className="w-32"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.cost_price}
                        onChange={(e) =>
                          updateRow(row.id, 'cost_price', e.target.value)
                        }
                        placeholder="Optional"
                        className="w-32"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                        disabled={rows.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Row Button */}
      <Button type="button" variant="secondary" onClick={addRow} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Another Product
      </Button>

      {/* Common Fields */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        {/* Supplier Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Supplier Name (Optional)
          </label>
          <Input
            type="text"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="Enter supplier name"
            maxLength={100}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Notes (Optional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes for this restock batch"
            rows={3}
            maxLength={500}
          />
        </div>
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
          {isSubmitting ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Processing...
            </>
          ) : (
            `Restock ${
              rows.filter((r) => r.product_id && r.quantity).length
            } Product(s)`
          )}
        </Button>
      </div>
    </form>
  );
}
