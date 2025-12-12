// components/dashboard/recent-transactions.tsx
'use client';

import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { Clock, User, ShoppingBag, XCircle } from 'lucide-react';
import Link from 'next/link';
import type { Transaction } from '@/types';

interface RecentTransactionsProps {
  transactions: Transaction[];
  currency?: string;
  isLoading?: boolean;
}

export default function RecentTransactions({
  transactions,
  currency = 'LRD',
  isLoading = false,
}: RecentTransactionsProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 animate-pulse">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="text-center py-8">
          <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No transactions yet</p>
          <p className="text-sm text-gray-400 mt-1">Start selling to see transactions here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        <Link
          href="/transactions"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {transactions.map((transaction: any) => {
          const itemCount = transaction.items?.length || 0;
          const paymentMethod = transaction.payments?.[0]?.payment_method || 'cash';
          
          return (
            <Link
              key={transaction.id}
              href={`/transactions/${transaction.id}`}
              className="block py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm">
                      {transaction.receipt_number}
                    </span>
                    {transaction.status === 'voided' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Voided
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {transaction.employee?.name || 'Unknown'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(transaction.created_at)}
                    </span>
                    <span className="capitalize">
                      {paymentMethod.replace('_', ' ')}
                    </span>
                  </div>

                  {transaction.customer && (
                    <p className="text-xs text-gray-600 mt-1">
                      Customer: {transaction.customer.name}
                    </p>
                  )}
                </div>

                <div className="text-right ml-4">
                  <p className={`font-semibold ${
                    transaction.status === 'voided' 
                      ? 'text-red-600 line-through' 
                      : 'text-gray-900'
                  }`}>
                    {formatCurrency(transaction.total_amount, currency)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
