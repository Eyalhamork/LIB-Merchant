// components/returns/exchange-items-step.tsx

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getShopProducts } from '@/lib/supabase/products';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { formatCurrency, formatQuantity } from '@/lib/utils';
import { Search, Plus, Minus, ShoppingCart, AlertCircle } from 'lucide-react';
import type { ShopProduct, PaymentMethod } from '@/types';

interface ReturnItem {
  shop_product_id: string;
  product_name: string;
  quantity: number;
  price_at_sale: number;
}

interface ExchangeItem {
  shop_product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  available_quantity: number;
  unit: string;
}

interface ExchangeItemsStepProps {
  returnItems: ReturnItem[];
  onComplete: (
    exchangeItems: ExchangeItem[],
    paymentMethod?: PaymentMethod,
    amountGiven?: number
  ) => void;
  onBack: () => void;
  isProcessing: boolean;
}

export function ExchangeItemsStep({
  returnItems,
  onComplete,
  onBack,
  isProcessing,
}: ExchangeItemsStepProps) {
  const { user } = useAuth();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ShopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [exchangeItems, setExchangeItems] = useState<ExchangeItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountGiven, setAmountGiven] = useState<string>('');

  useEffect(() => {
    loadProducts();
  }, [user]);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery]);

  const loadProducts = async () => {
    if (!user?.profile.shop_id) return;

    setIsLoading(true);
    try {
      const data = await getShopProducts(user.profile.shop_id);
      // Only show products with stock
      const inStockProducts = data.filter((p) => p.current_quantity > 0);
      setProducts(inStockProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    if (!searchQuery) {
      setFilteredProducts(products);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.product?.name?.toLowerCase().includes(query) ||
        p.product?.category?.toLowerCase().includes(query)
    );
    setFilteredProducts(filtered);
  };

  const returnTotal = returnItems.reduce(
    (sum, item) => sum + item.quantity * item.price_at_sale,
    0
  );

  const exchangeTotal = exchangeItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  const paymentDue = exchangeTotal - returnTotal;

  const addExchangeItem = (product: ShopProduct) => {
    const existing = exchangeItems.find(
      (item) => item.shop_product_id === product.id
    );

    if (existing) {
      if (existing.quantity < product.current_quantity) {
        setExchangeItems(
          exchangeItems.map((item) =>
            item.shop_product_id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      }
    } else {
      setExchangeItems([
        ...exchangeItems,
        {
          shop_product_id: product.id,
          product_name: product.product?.name || 'Unknown Product',
          quantity: 1,
          price: product.selling_price,
          available_quantity: product.current_quantity,
          unit: product.product?.unit || 'unit',
        },
      ]);
    }
  };

  const updateQuantity = (shopProductId: string, delta: number) => {
    setExchangeItems(
      exchangeItems
        .map((item) => {
          if (item.shop_product_id === shopProductId) {
            const newQuantity = item.quantity + delta;
            if (newQuantity <= 0) return null;
            if (newQuantity > item.available_quantity) return item;
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter((item) => item !== null) as ExchangeItem[]
    );
  };

  const removeItem = (shopProductId: string) => {
    setExchangeItems(
      exchangeItems.filter((item) => item.shop_product_id !== shopProductId)
    );
  };

  const handleComplete = () => {
    if (exchangeItems.length === 0) return;

    // If customer owes money, require payment details
    if (paymentDue > 0) {
      if (paymentMethod === 'cash') {
        const given = parseFloat(amountGiven);
        if (!given || given < paymentDue) {
          return; // Validation will show error
        }
        onComplete(exchangeItems, paymentMethod, given);
      } else {
        onComplete(exchangeItems, paymentMethod);
      }
    } else {
      // Customer doesn't owe anything (or gets refund)
      onComplete(exchangeItems);
    }
  };

  const getChangeAmount = () => {
    if (paymentMethod !== 'cash' || !amountGiven) return 0;
    const given = parseFloat(amountGiven);
    return given - paymentDue;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Select Exchange Items
        </h2>
        <p className="text-sm text-gray-600">
          Choose items the customer wants in exchange
        </p>
      </div>

      {/* Exchange Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700 font-medium">Return Value</p>
          <p className="text-2xl font-bold text-red-900">
            {formatCurrency(returnTotal)}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700 font-medium">Exchange Value</p>
          <p className="text-2xl font-bold text-green-900">
            {formatCurrency(exchangeTotal)}
          </p>
        </div>
        <div
          className={`border rounded-lg p-4 ${
            paymentDue > 0
              ? 'bg-blue-50 border-blue-200'
              : paymentDue < 0
              ? 'bg-purple-50 border-purple-200'
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <p
            className={`text-sm font-medium ${
              paymentDue > 0
                ? 'text-blue-700'
                : paymentDue < 0
                ? 'text-purple-700'
                : 'text-gray-700'
            }`}
          >
            {paymentDue > 0
              ? 'Customer Pays'
              : paymentDue < 0
              ? 'Refund to Customer'
              : 'Even Exchange'}
          </p>
          <p
            className={`text-2xl font-bold ${
              paymentDue > 0
                ? 'text-blue-900'
                : paymentDue < 0
                ? 'text-purple-900'
                : 'text-gray-900'
            }`}
          >
            {formatCurrency(Math.abs(paymentDue))}
          </p>
        </div>
      </div>

      {/* Selected Exchange Items */}
      {exchangeItems.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">
              Exchange Items ({exchangeItems.length})
            </h3>
          </div>
          <div className="space-y-2">
            {exchangeItems.map((item) => (
              <div
                key={item.shop_product_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.product_name}</p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(item.price)} each
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.shop_product_id, -1)}
                      className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                    >
                      <Minus className="h-4 w-4 text-gray-600" />
                    </button>
                    <span className="w-12 text-center font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.shop_product_id, 1)}
                      className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      disabled={item.quantity >= item.available_quantity}
                    >
                      <Plus className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                  <p className="w-24 text-right font-medium text-gray-900">
                    {formatCurrency(item.quantity * item.price)}
                  </p>
                  <button
                    onClick={() => removeItem(item.shop_product_id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Section (if customer owes money) */}
      {paymentDue > 0 && (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
          <div className="flex items-start gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Payment Required</h3>
              <p className="text-sm text-blue-700">
                Customer needs to pay {formatCurrency(paymentDue)} for the
                difference
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="cash">Cash</option>
                <option value="mtn_momo">MTN MoMo</option>
                <option value="orange_money">Orange Money</option>
              </select>
            </div>

            {paymentMethod === 'cash' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Given
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min={paymentDue}
                  value={amountGiven}
                  onChange={(e) => setAmountGiven(e.target.value)}
                  placeholder={`Minimum: ${formatCurrency(paymentDue)}`}
                />
                {amountGiven && parseFloat(amountGiven) >= paymentDue && (
                  <p className="text-sm text-green-600 mt-1">
                    Change: {formatCurrency(getChangeAmount())}
                  </p>
                )}
              </div>
            )}

            {paymentMethod !== 'cash' && (
              <div className="p-3 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-900">
                  Ensure you receive {formatCurrency(paymentDue)} via{' '}
                  {paymentMethod === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Search */}
      <div className="border-t border-gray-200 pt-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products to add..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Available Products */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredProducts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              {searchQuery ? 'No products found' : 'No products available'}
            </p>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {product.product?.name || 'Unknown Product'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {product.product?.category || 'Uncategorized'} •{' '}
                    {formatQuantity(product.current_quantity, product.product?.unit || 'unit')}{' '}
                    available
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(product.selling_price)}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => addExchangeItem(product)}
                    disabled={product.current_quantity === 0}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <Button
          variant="secondary"
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={handleComplete}
          disabled={
            isProcessing ||
            exchangeItems.length === 0 ||
            (paymentDue > 0 &&
              paymentMethod === 'cash' &&
              (!amountGiven || parseFloat(amountGiven) < paymentDue))
          }
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Spinner className="mr-2" />
              Processing...
            </>
          ) : (
            'Complete Exchange'
          )}
        </Button>
      </div>
    </div>
  );
}
