// components/customers/credit-summary-card.tsx

'use client';

import Card from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, TrendingUp, Users, DollarSign } from 'lucide-react';

interface CreditSummaryCardProps {
  totalCustomers: number;
  customersWithCredit: number;
  totalOutstanding: number;
  customersNearLimit?: number;
  className?: string;
}

export function CreditSummaryCard({
  totalCustomers,
  customersWithCredit,
  totalOutstanding,
  customersNearLimit = 0,
  className = '',
}: CreditSummaryCardProps) {
  const percentageWithCredit =
    totalCustomers > 0 ? (customersWithCredit / totalCustomers) * 100 : 0;

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Credit Summary</h3>
          <p className="text-xs text-gray-500">Outstanding customer balances</p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-amber-600" />
            <span className="text-xs text-amber-700 font-medium">
              Total Outstanding
            </span>
          </div>
          <p className="text-xl font-bold text-amber-900">
            {formatCurrency(totalOutstanding)}
          </p>
        </div>

        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-blue-700 font-medium">
              Customers with Credit
            </span>
          </div>
          <p className="text-xl font-bold text-blue-900">
            {customersWithCredit}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {percentageWithCredit.toFixed(1)}% of total
          </p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between py-2 border-t border-gray-100">
          <span className="text-gray-600">Total Customers</span>
          <span className="font-medium text-gray-900">{totalCustomers}</span>
        </div>

        {customersNearLimit > 0 && (
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-red-600" />
              <span className="text-gray-600">Near Credit Limit</span>
            </div>
            <span className="font-medium text-red-600">{customersNearLimit}</span>
          </div>
        )}

        {customersWithCredit === 0 && (
          <div className="flex items-center justify-center py-4 text-green-600">
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-sm font-medium">No outstanding credit</span>
          </div>
        )}
      </div>

      {/* Average Credit */}
      {customersWithCredit > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Average Credit per Customer</span>
            <span className="text-sm font-bold text-gray-900">
              {formatCurrency(totalOutstanding / customersWithCredit)}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
