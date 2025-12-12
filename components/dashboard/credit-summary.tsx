// components/dashboard/credit-summary.tsx
'use client';

import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { CreditCard, AlertCircle, Users } from 'lucide-react';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  phone?: string;
  credit_balance: number;
  last_purchase_at?: string;
}

interface CreditSummaryProps {
  totalOutstanding: number;
  customersWithCredit: number;
  topCustomers: Customer[];
  currency?: string;
  isLoading?: boolean;
}

export default function CreditSummary({
  totalOutstanding,
  customersWithCredit,
  topCustomers,
  currency = 'LRD',
  isLoading = false,
}: CreditSummaryProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Outstanding Credit</h3>
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Outstanding Credit</h3>
        <Link
          href="/customers"
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          View All
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-purple-900 font-medium">Total Outstanding</span>
          <CreditCard className="h-5 w-5 text-purple-600" />
        </div>
        <div className="text-2xl font-bold text-purple-900 mb-1">
          {formatCurrency(totalOutstanding, currency)}
        </div>
        <div className="flex items-center gap-1 text-xs text-purple-700">
          <Users className="h-3 w-3" />
          <span>{customersWithCredit} {customersWithCredit === 1 ? 'customer' : 'customers'}</span>
        </div>
      </div>

      {/* Top Customers */}
      {topCustomers.length === 0 ? (
        <div className="text-center py-6">
          <AlertCircle className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No outstanding credit</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">Top Customers</h4>
          {topCustomers.slice(0, 5).map((customer) => (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="block p-3 rounded-lg border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {customer.name}
                  </p>
                  {customer.phone && (
                    <p className="text-xs text-gray-500 mt-0.5">{customer.phone}</p>
                  )}
                  {customer.last_purchase_at && (
                    <p className="text-xs text-gray-400 mt-1">
                      Last purchase: {formatRelativeTime(customer.last_purchase_at)}
                    </p>
                  )}
                </div>
                <div className="text-right ml-3">
                  <p className="font-semibold text-purple-600 text-sm">
                    {formatCurrency(customer.credit_balance, currency)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {customersWithCredit > 5 && (
        <Link
          href="/customers"
          className="block text-center text-sm text-emerald-600 hover:text-emerald-700 font-medium mt-4"
        >
          View {customersWithCredit - 5} more
        </Link>
      )}
    </div>
  );
}
