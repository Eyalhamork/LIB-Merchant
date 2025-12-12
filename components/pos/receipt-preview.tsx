// components/pos/receipt-preview.tsx

'use client';

import { Printer, Download, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { CartItem, PaymentEntry, Customer, Shop } from '@/types';

interface ReceiptPreviewProps {
  shop: Shop;
  receiptNumber: string;
  items: CartItem[];
  payments: PaymentEntry[];
  customer?: Customer | null;
  subtotal: number;
  discountAmount: number;
  total: number;
  employeeName: string;
  onClose: () => void;
  onPrint?: () => void;
}

export function ReceiptPreview({
  shop,
  receiptNumber,
  items,
  payments,
  customer,
  subtotal,
  discountAmount,
  total,
  employeeName,
  onClose,
  onPrint,
}: ReceiptPreviewProps) {
  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="flex flex-col items-center gap-3 pb-6 border-b border-gray-200">
        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900">Sale Completed!</h3>
          <p className="text-sm text-gray-600 mt-1">Receipt #{receiptNumber}</p>
        </div>
      </div>

      {/* Receipt Content */}
      <div className="bg-white border border-gray-300 rounded-lg p-6 space-y-4 max-h-[60vh] overflow-y-auto">
        {/* Shop Header */}
        <div className="text-center pb-4 border-b border-gray-300">
          <h2 className="text-xl font-bold text-gray-900">{shop.name}</h2>
          {shop.phone && <p className="text-sm text-gray-600 mt-1">{shop.phone}</p>}
          {shop.address && <p className="text-sm text-gray-600">{shop.address}</p>}
        </div>

        {/* Receipt Info */}
        <div className="text-sm space-y-1 pb-4 border-b border-gray-300">
          <div className="flex justify-between">
            <span className="text-gray-600">Receipt #:</span>
            <span className="font-medium text-gray-900">{receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span className="font-medium text-gray-900">
              {formatDate(new Date().toISOString(), 'long')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Cashier:</span>
            <span className="font-medium text-gray-900">{employeeName}</span>
          </div>
          {customer && (
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span className="font-medium text-gray-900">{customer.name}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="space-y-2 pb-4 border-b border-gray-300">
          <h4 className="font-semibold text-gray-900 mb-2">Items</h4>
          {items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <div className="flex-1">
                <p className="text-gray-900">{item.product.product?.name}</p>
                <p className="text-gray-600 text-xs">
                  {item.quantity} × {formatCurrency(item.price)}
                </p>
              </div>
              <span className="font-medium text-gray-900">
                {formatCurrency(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-2 pb-4 border-b border-gray-300">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(subtotal)}
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Discount:</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(discountAmount)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
            <span className="text-gray-900">Total:</span>
            <span className="text-gray-900">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment Details */}
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900">Payment</h4>
          {payments.map((payment, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-600 capitalize">
                {payment.method.replace('_', ' ')}:
              </span>
              <span className="font-medium text-gray-900">
                {formatCurrency(payment.amount)}
              </span>
            </div>
          ))}

          {/* Change Given */}
          {payments.some((p) => p.method === 'cash' && p.change_given && p.change_given > 0) && (
            <div className="flex justify-between text-sm pt-2 border-t border-gray-300">
              <span className="text-gray-600">Change:</span>
              <span className="font-medium text-green-600">
                {formatCurrency(
                  payments.find((p) => p.method === 'cash')?.change_given || 0
                )}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-300">
          <p>Thank you for your business!</p>
          <p className="mt-1">Powered by ShopManager</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {onPrint && (
          <Button variant="secondary" onClick={onPrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
        )}
        <Button onClick={onClose} className="flex-1">
          Close
        </Button>
      </div>
    </div>
  );
}
