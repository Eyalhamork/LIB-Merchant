// components/transactions/receipt.tsx

'use client';

import { forwardRef } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Transaction } from '@/types';

interface ReceiptProps {
  transaction: Transaction;
  shopName: string;
  shopPhone?: string;
  shopAddress?: string;
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ transaction, shopName, shopPhone, shopAddress }, ref) => {
    const getPaymentMethodLabel = (method: string) => {
      const labels: Record<string, string> = {
        cash: 'Cash',
        mtn_momo: 'MTN MoMo',
        orange_money: 'Orange Money',
        credit: 'Credit',
      };
      return labels[method] || method;
    };

    return (
      <div ref={ref} className="receipt-print">
        <div className="max-w-sm mx-auto p-6 bg-white">
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
            <h1 className="text-xl font-bold text-gray-900 mb-1">{shopName}</h1>
            {shopPhone && (
              <p className="text-sm text-gray-600">Tel: {shopPhone}</p>
            )}
            {shopAddress && (
              <p className="text-sm text-gray-600">{shopAddress}</p>
            )}
          </div>

          {/* Receipt Info */}
          <div className="mb-4 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Receipt #:</span>
              <span className="font-medium">{transaction.receipt_number}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">
                {formatDate(transaction.created_at, 'long')}
              </span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Cashier:</span>
              <span className="font-medium">{transaction.employee?.name}</span>
            </div>
            {transaction.customer && (
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium">{transaction.customer.name}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="border-t-2 border-dashed border-gray-300 pt-3 mb-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-1 font-semibold">Item</th>
                  <th className="text-right py-1 font-semibold">Qty</th>
                  <th className="text-right py-1 font-semibold">Price</th>
                  <th className="text-right py-1 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {transaction.items?.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-2 pr-2">
                      <div className="font-medium text-gray-900">
                        {item.shop_product?.product?.name || 'Unknown Product'}
                      </div>
                    </td>
                    <td className="text-right py-2">{item.quantity}</td>
                    <td className="text-right py-2">
                      {formatCurrency(item.price_at_sale)}
                    </td>
                    <td className="text-right py-2 font-medium">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t-2 border-dashed border-gray-300 pt-3 mb-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">
                {formatCurrency(transaction.subtotal)}
              </span>
            </div>
            {transaction.discount_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(transaction.discount_amount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
              <span>Total:</span>
              <span>{formatCurrency(transaction.total_amount)}</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="border-t-2 border-dashed border-gray-300 pt-3 mb-3">
            <div className="text-sm font-semibold mb-2">Payment Details:</div>
            {transaction.payments?.map((payment, idx) => (
              <div key={idx} className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">
                  {getPaymentMethodLabel(payment.payment_method)}:
                </span>
                <span className="font-medium">
                  {formatCurrency(payment.amount)}
                </span>
              </div>
            ))}
            {transaction.payments?.some(
              (p) => p.payment_method === 'cash' && p.change_given && p.change_given > 0
            ) && (
              <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-200">
                <span className="text-gray-600">Change Given:</span>
                <span className="font-medium">
                  {formatCurrency(
                    transaction.payments?.find(
                      (p) => p.payment_method === 'cash' && p.change_given
                    )?.change_given || 0
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          {transaction.notes && (
            <div className="border-t-2 border-dashed border-gray-300 pt-3 mb-3">
              <div className="text-sm">
                <span className="font-semibold">Notes:</span>
                <p className="text-gray-600 mt-1">{transaction.notes}</p>
              </div>
            </div>
          )}

          {/* Voided Status */}
          {transaction.status === 'voided' && (
            <div className="border-t-2 border-dashed border-gray-300 pt-3 mb-3">
              <div className="text-center bg-red-50 border border-red-200 rounded p-2">
                <p className="text-sm font-bold text-red-900">VOID</p>
                <p className="text-xs text-red-700 mt-1">
                  Voided: {formatDate(transaction.voided_at!)}
                </p>
                {transaction.void_reason && (
                  <p className="text-xs text-red-700">
                    Reason: {transaction.void_reason}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t-2 border-dashed border-gray-300 pt-3 text-center">
            <p className="text-sm text-gray-600">Thank you for your business!</p>
            <p className="text-xs text-gray-500 mt-2">
              Powered by LIB-Merchant
            </p>
          </div>
        </div>

        {/* Print Styles */}
        <style jsx>{`
          @media print {
            .receipt-print {
              width: 80mm;
              margin: 0;
              padding: 0;
            }

            .receipt-print > div {
              max-width: 100%;
              padding: 10mm;
              font-size: 10pt;
            }

            /* Hide everything except the receipt when printing */
            body * {
              visibility: hidden;
            }

            .receipt-print,
            .receipt-print * {
              visibility: visible;
            }

            .receipt-print {
              position: absolute;
              left: 0;
              top: 0;
            }

            /* Ensure borders print */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}</style>
      </div>
    );
  }
);

Receipt.displayName = 'Receipt';
