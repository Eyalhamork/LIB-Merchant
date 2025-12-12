// app/(dashboard)/transactions/[id]/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import Spinner from '@/components/ui/spinner';
import Modal from '@/components/ui/modal';
import { VoidTransactionModal } from '@/components/transactions/void-transaction-modal';
import { Receipt } from '@/components/transactions/receipt';
import { useAuth } from '@/hooks/use-auth';
import { getTransaction } from '@/lib/supabase/transactions';
import { getShopSettings } from '@/lib/supabase/settings';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Transaction, Shop } from '@/types';
import { toast } from 'sonner';
import { Printer, Download } from 'lucide-react';

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, profile } = useAuth();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const transactionId = params.id as string;

  useEffect(() => {
    if (transactionId) {
      loadTransaction();
    }
  }, [transactionId]);

  const loadTransaction = async () => {
    try {
      setIsLoading(true);
      const data = await getTransaction(transactionId);
      setTransaction(data);

      // Load shop data for receipt
      if (profile?.shop_id) {
        const shopData = await getShopSettings(profile.shop_id);
        setShop(shopData);
      }
    } catch (error) {
      console.error('Failed to load transaction:', error);
      toast.error('Failed to load transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReceipt = () => {
    if (!transaction || !shop) return;

    try {
      // Create a printable HTML version of the receipt
      const receiptContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt ${transaction.receipt_number}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 300px; margin: 20px auto; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .info { margin-bottom: 10px; font-size: 12px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .items { border-top: 2px dashed #000; border-bottom: 2px dashed #000; padding: 10px 0; margin: 10px 0; }
            .item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
            .totals { margin-top: 10px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .grand-total { font-weight: bold; font-size: 16px; border-top: 1px solid #000; padding-top: 5px; }
            .footer { text-align: center; margin-top: 10px; border-top: 2px dashed #000; padding-top: 10px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${shop.name}</h1>
            ${shop.phone ? `<p>Tel: ${shop.phone}</p>` : ''}
            ${shop.address ? `<p>${shop.address}</p>` : ''}
          </div>

          <div class="info">
            <div class="info-row"><span>Receipt #:</span><span>${transaction.receipt_number}</span></div>
            <div class="info-row"><span>Date:</span><span>${formatDate(transaction.created_at, 'long')}</span></div>
            <div class="info-row"><span>Cashier:</span><span>${transaction.employee?.name || 'N/A'}</span></div>
            ${transaction.customer ? `<div class="info-row"><span>Customer:</span><span>${transaction.customer.name}</span></div>` : ''}
          </div>

          <div class="items">
            ${transaction.items?.map(item => `
              <div class="item">
                <span>${item.shop_product?.product?.name || 'Unknown'} (${item.quantity}x${formatCurrency(item.price_at_sale)})</span>
                <span>${formatCurrency(item.subtotal)}</span>
              </div>
            `).join('') || ''}
          </div>

          <div class="totals">
            <div class="total-row"><span>Subtotal:</span><span>${formatCurrency(transaction.subtotal)}</span></div>
            ${transaction.discount_amount > 0 ? `<div class="total-row"><span>Discount:</span><span>-${formatCurrency(transaction.discount_amount)}</span></div>` : ''}
            <div class="total-row grand-total"><span>Total:</span><span>${formatCurrency(transaction.total_amount)}</span></div>
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Powered by ShopManager</p>
          </div>
        </body>
        </html>
      `;

      // Create a blob and download
      const blob = new Blob([receiptContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${transaction.receipt_number}.html`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download receipt');
    }
  };

  const canVoid = () => {
    if (!user || !transaction) return false;
    
    // Only owner and supervisor can void
    if (user.profile.role !== 'owner' && user.profile.role !== 'supervisor') {
      return false;
    }

    // Can't void already voided transactions
    if (transaction.status === 'voided') {
      return false;
    }

    // Can only void transactions from today (same business day)
    const txnDate = new Date(transaction.created_at).toDateString();
    const today = new Date().toDateString();
    return txnDate === today;
  };

  const handleVoidSuccess = () => {
    setShowVoidModal(false);
    loadTransaction(); // Reload to show voided status
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Cash',
      mtn_momo: 'MTN MoMo',
      orange_money: 'Orange Money',
      credit: 'Credit',
    };
    return labels[method] || method;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Transaction not found</p>
        <Link href="/transactions">
          <Button variant="secondary" className="mt-4">
            Back to Transactions
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Transaction Details
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {transaction.receipt_number}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowReceiptModal(true)}
          >
            <Printer className="h-4 w-4 mr-2" />
            View Receipt
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadReceipt}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          {canVoid() && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowVoidModal(true)}
            >
              Void Transaction
            </Button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {transaction.status === 'voided' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-red-600 mt-0.5 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-900">
                Transaction Voided
              </h3>
              <div className="mt-1 text-sm text-red-700">
                <p>Voided by: {transaction.voided_by_profile?.name}</p>
                <p>Date: {formatDate(transaction.voided_at!)}</p>
                {transaction.void_reason && (
                  <p>Reason: {transaction.void_reason}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Transaction Information
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Date & Time</p>
            <p className="font-medium text-gray-900 mt-1">
              {formatDate(transaction.created_at, 'long')}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Employee</p>
            <p className="font-medium text-gray-900 mt-1">
              {transaction.employee?.name}
            </p>
          </div>

          {transaction.customer && (
            <div>
              <p className="text-sm text-gray-600">Customer</p>
              <p className="font-medium text-gray-900 mt-1">
                {transaction.customer.name}
              </p>
            </div>
          )}

          {transaction.cash_session && (
            <div>
              <p className="text-sm text-gray-600">Cash Session</p>
              <p className="font-medium text-gray-900 mt-1">
                {formatDate(transaction.cash_session.session_date)}
              </p>
            </div>
          )}
        </div>

        {transaction.notes && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">Notes</p>
            <p className="text-gray-900 mt-1">{transaction.notes}</p>
          </div>
        )}
      </Card>

      {/* Items */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>

        <div className="space-y-3">
          {transaction.items?.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {item.shop_product?.product?.name || 'Unknown Product'}
                </p>
                <p className="text-sm text-gray-600">
                  {item.quantity} × {formatCurrency(item.price_at_sale)}
                </p>
              </div>
              <p className="font-medium text-gray-900">
                {formatCurrency(item.subtotal)}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-600">Subtotal</p>
            <p className="font-medium text-gray-900">
              {formatCurrency(transaction.subtotal)}
            </p>
          </div>

          {transaction.discount_amount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-gray-600">Discount</p>
              <p className="font-medium text-red-600">
                -{formatCurrency(transaction.discount_amount)}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-lg pt-2 border-t border-gray-200">
            <p className="font-semibold text-gray-900">Total</p>
            <p className="font-bold text-gray-900">
              {formatCurrency(transaction.total_amount)}
            </p>
          </div>
        </div>
      </Card>

      {/* Payments */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Payment Details
        </h2>

        <div className="space-y-3">
          {transaction.payments?.map((payment, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {getPaymentMethodLabel(payment.payment_method)}
                </p>
                {payment.payment_method === 'cash' && payment.amount_given && (
                  <div className="text-sm text-gray-600 mt-1">
                    <p>Given: {formatCurrency(payment.amount_given)}</p>
                    {payment.change_given && payment.change_given > 0 && (
                      <p>Change: {formatCurrency(payment.change_given)}</p>
                    )}
                  </div>
                )}
                {payment.reference_number && (
                  <p className="text-sm text-gray-600 mt-1">
                    Ref: {payment.reference_number}
                  </p>
                )}
              </div>
              <p className="font-medium text-gray-900">
                {formatCurrency(payment.amount)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Receipt Modal */}
      {showReceiptModal && transaction && shop && (
        <Modal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          title="Receipt"
        >
          <div className="space-y-4">
            <Receipt
              ref={receiptRef}
              transaction={transaction}
              shopName={shop.name}
              shopPhone={shop.phone}
              shopAddress={shop.address}
            />
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => setShowReceiptModal(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={handlePrint}
                className="flex-1"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Void Modal */}
      {showVoidModal && transaction && (
        <VoidTransactionModal
          transaction={transaction}
          onClose={() => setShowVoidModal(false)}
          onSuccess={handleVoidSuccess}
        />
      )}
    </div>
  );
}
