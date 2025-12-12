// components/cash-session/session-summary.tsx

'use client';

import Card from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { CashSession } from '@/types';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface SessionSummaryProps {
  session: CashSession;
}

export function SessionSummary({ session }: SessionSummaryProps) {
  const expectedBalance =
    session.opening_balance +
    session.cash_sales_total +
    session.cash_credit_payments -
    session.cash_refunds_total;

  const discrepancy = session.discrepancy || 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Session Details</h3>
        <span className="text-sm text-gray-500">
          {formatDate(session.session_date)}
        </span>
      </div>

      <div className="space-y-4">
        {/* Opening Balance */}
        <div className="flex items-center justify-between py-2 border-b border-gray-200">
          <span className="text-sm text-gray-600">Opening Balance</span>
          <span className="font-medium">{formatCurrency(session.opening_balance)}</span>
        </div>

        {/* Cash Sales */}
        <div className="flex items-center justify-between py-2 border-b border-gray-200">
          <span className="text-sm text-gray-600">Cash Sales</span>
          <span className="font-medium text-green-600">
            +{formatCurrency(session.cash_sales_total)}
          </span>
        </div>

        {/* Credit Payments */}
        <div className="flex items-center justify-between py-2 border-b border-gray-200">
          <span className="text-sm text-gray-600">Credit Payments Received</span>
          <span className="font-medium text-green-600">
            +{formatCurrency(session.cash_credit_payments)}
          </span>
        </div>

        {/* Refunds */}
        {session.cash_refunds_total > 0 && (
          <div className="flex items-center justify-between py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Cash Refunds</span>
            <span className="font-medium text-red-600">
              -{formatCurrency(session.cash_refunds_total)}
            </span>
          </div>
        )}

        {/* Expected Balance */}
        <div className="flex items-center justify-between py-3 bg-blue-50 rounded-lg px-3">
          <span className="font-medium text-blue-900">Expected Balance</span>
          <span className="font-bold text-blue-900">
            {formatCurrency(expectedBalance)}
          </span>
        </div>

        {/* Closing Balance & Discrepancy (if closed) */}
        {session.status === 'closed' && (
          <>
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">Actual Closing Balance</span>
              <span className="font-medium">
                {formatCurrency(session.closing_balance || 0)}
              </span>
            </div>

            {/* Discrepancy */}
            <div
              className={`flex items-center justify-between py-3 rounded-lg px-3 ${
                Math.abs(discrepancy) < 0.01
                  ? 'bg-green-50'
                  : discrepancy > 0
                  ? 'bg-blue-50'
                  : 'bg-amber-50'
              }`}
            >
              <div className="flex items-center gap-2">
                {Math.abs(discrepancy) < 0.01 ? (
                  <>
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">Balanced</span>
                  </>
                ) : discrepancy > 0 ? (
                  <>
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Surplus</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-5 w-5 text-amber-600" />
                    <span className="font-medium text-amber-900">Shortage</span>
                  </>
                )}
              </div>
              <span
                className={`font-bold ${
                  Math.abs(discrepancy) < 0.01
                    ? 'text-green-900'
                    : discrepancy > 0
                    ? 'text-blue-900'
                    : 'text-amber-900'
                }`}
              >
                {Math.abs(discrepancy) < 0.01
                  ? '0.00 LRD'
                  : `${discrepancy > 0 ? '+' : ''}${formatCurrency(Math.abs(discrepancy))}`}
              </span>
            </div>

            {/* Notes */}
            {session.notes && (
              <div className="pt-2">
                <p className="text-sm text-gray-600 mb-1">Notes:</p>
                <p className="text-sm text-gray-900">{session.notes}</p>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}