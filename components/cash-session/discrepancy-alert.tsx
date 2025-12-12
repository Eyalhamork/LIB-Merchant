// components/cash-session/discrepancy-alert.tsx

'use client';

import { AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DiscrepancyAlertProps {
  discrepancy: number;
  threshold: number;
}

export function DiscrepancyAlert({ discrepancy, threshold }: DiscrepancyAlertProps) {
  if (Math.abs(discrepancy) <= threshold) {
    return null;
  }

  const isShortage = discrepancy < 0;

  return (
    <div
      className={`p-4 rounded-lg border ${
        isShortage
          ? 'bg-red-50 border-red-200'
          : 'bg-amber-50 border-amber-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
            isShortage ? 'text-red-600' : 'text-amber-600'
          }`}
        />
        <div className="flex-1">
          <h4
            className={`text-sm font-medium ${
              isShortage ? 'text-red-900' : 'text-amber-900'
            }`}
          >
            {isShortage ? 'Cash Shortage Detected' : 'Cash Surplus Detected'}
          </h4>
          <p
            className={`text-sm mt-1 ${
              isShortage ? 'text-red-700' : 'text-amber-700'
            }`}
          >
            The discrepancy of {formatCurrency(Math.abs(discrepancy))} exceeds the
            alert threshold of {formatCurrency(threshold)}. This has been flagged for
            owner review.
          </p>
        </div>
      </div>
    </div>
  );
}