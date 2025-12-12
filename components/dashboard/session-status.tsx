// components/dashboard/session-status.tsx
'use client';

import { formatCurrency, formatDate } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock, DollarSign } from 'lucide-react';
import type { CashSession } from '@/types';

interface SessionStatusProps {
  session: CashSession | null;
  currency?: string;
  isLoading?: boolean;
}

export default function SessionStatus({
  session,
  currency = 'LRD',
  isLoading = false,
}: SessionStatusProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <XCircle className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">No Active Session</h3>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800 mb-3">
            You need to open a cash session before making sales.
          </p>
          <button
            type="button"
            className="w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Open Session
          </button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Cash sessions track daily transactions</p>
          <p>• Required for cash sales</p>
          <p>• Close at end of business day</p>
        </div>
      </div>
    );
  }

  const expectedBalance =
    session.opening_balance +
    session.cash_sales_total -
    session.cash_refunds_total +
    session.cash_credit_payments;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        <h3 className="text-lg font-semibold text-gray-900">Active Session</h3>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-green-900 font-medium">Expected Cash</span>
          <DollarSign className="h-5 w-5 text-green-600" />
        </div>
        <div className="text-2xl font-bold text-green-900">
          {formatCurrency(expectedBalance, currency)}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Opening Balance</span>
          <span className="font-medium text-gray-900">
            {formatCurrency(session.opening_balance, currency)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Cash Sales</span>
          <span className="font-medium text-green-600">
            +{formatCurrency(session.cash_sales_total, currency)}
          </span>
        </div>

        {session.cash_refunds_total > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Cash Refunds</span>
            <span className="font-medium text-red-600">
              -{formatCurrency(session.cash_refunds_total, currency)}
            </span>
          </div>
        )}

        {session.cash_credit_payments > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Credit Payments</span>
            <span className="font-medium text-green-600">
              +{formatCurrency(session.cash_credit_payments, currency)}
            </span>
          </div>
        )}

        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>
              Opened {formatDate(session.opened_at, 'long')}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="w-full mt-4 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
      >
        Close Session
      </button>
    </div>
  );
}
