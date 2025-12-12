// components/settings/billing-history.tsx

'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import Spinner from '@/components/ui/spinner';
import EmptyState from '@/components/ui/empty-state';
import { getBillingHistory } from '@/lib/supabase/subscription';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Receipt, Download, CheckCircle, Clock, XCircle } from 'lucide-react';

interface BillingHistoryProps {
  shopId: string;
}

interface BillingRecord {
  id: string;
  created_at: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  payment_method: string;
  description: string;
  invoice_number?: string;
  period_start: string;
  period_end: string;
}

export function BillingHistory({ shopId }: BillingHistoryProps) {
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBillingHistory();
  }, [shopId]);

  const loadBillingHistory = async () => {
    setIsLoading(true);
    try {
      const data = await getBillingHistory(shopId);
      setBillingRecords(data);
    } catch (error) {
      console.error('Failed to load billing history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleDownloadInvoice = (record: BillingRecord) => {
    // Generate a simple HTML invoice
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${record.invoice_number || record.id.slice(0, 8)}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
          .invoice-info { margin-bottom: 30px; }
          .invoice-details { margin-bottom: 30px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .table th { background-color: #f5f5f5; }
          .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ShopManager Invoice</h1>
          <p>Invoice #${record.invoice_number || record.id.slice(0, 8)}</p>
        </div>

        <div class="invoice-info">
          <h3>Invoice Details</h3>
          <p><strong>Date:</strong> ${formatDate(record.created_at)}</p>
          <p><strong>Status:</strong> ${record.status.toUpperCase()}</p>
          <p><strong>Payment Method:</strong> ${record.payment_method}</p>
        </div>

        <div class="invoice-details">
          <h3>Billing Period</h3>
          <p>${formatDate(record.period_start)} - ${formatDate(record.period_end)}</p>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${record.description}</td>
              <td>${formatCurrency(record.amount)}</td>
            </tr>
          </tbody>
        </table>

        <div class="total">
          <p>Total: ${formatCurrency(record.amount)}</p>
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>ShopManager - Professional Shop Management System</p>
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([invoiceHtml], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${record.invoice_number || record.id.slice(0, 8)}.html`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (billingRecords.length === 0) {
    return (
      <EmptyState
        icon={<Receipt />}
        title="No billing history"
        description="Your payment history will appear here once you start your subscription"
      />
    );
  }

  return (
    <div className="space-y-4">
      {billingRecords.map((record) => (
        <Card key={record.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Receipt className="h-5 w-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">{record.description}</h3>
                {getStatusBadge(record.status)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mt-3">
                <div>
                  <p className="text-gray-600">Date</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(record.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Amount</p>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(record.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Payment Method</p>
                  <p className="font-medium text-gray-900">{record.payment_method}</p>
                </div>
              </div>

              <div className="text-sm text-gray-600 mt-2">
                <p>
                  Billing Period: {formatDate(record.period_start)} -{' '}
                  {formatDate(record.period_end)}
                </p>
              </div>
            </div>

            {record.status === 'paid' && (
              <button
                onClick={() => handleDownloadInvoice(record)}
                className="ml-4 p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Download Invoice"
              >
                <Download className="h-5 w-5" />
              </button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
