// components/customers/customer-card.tsx

'use client';

import Badge from '@/components/ui/badge';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import type { Customer } from '@/types';
import { User, Phone, Mail, MapPin, AlertCircle, TrendingUp } from 'lucide-react';

interface CustomerCardProps {
  customer: Customer;
  onClick?: () => void;
  showCreditInfo?: boolean;
}

export function CustomerCard({ customer, onClick, showCreditInfo = true }: CustomerCardProps) {
  const hasCredit = customer.credit_balance > 0;
  const isNearLimit =
    customer.credit_limit && customer.credit_balance >= customer.credit_limit * 0.9;

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-shadow ${
        onClick ? 'hover:shadow-md cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* Avatar */}
          <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <User className="h-6 w-6 text-emerald-600" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gray-900 truncate">{customer.name}</h3>
              {!customer.is_active && (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  Inactive
                </Badge>
              )}
              {hasCredit && showCreditInfo && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  Has Credit
                </Badge>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-1">
              {customer.phone && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{customer.address}</span>
                </div>
              )}
            </div>

            {/* Credit Info */}
            {showCreditInfo && hasCredit && (
              <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-amber-700 font-medium">Credit Balance</span>
                  <span className="text-sm font-bold text-amber-900">
                    {formatCurrency(customer.credit_balance)}
                  </span>
                </div>
                {customer.credit_limit && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-amber-600">Credit Limit</span>
                    <span className="text-xs text-amber-700">
                      {formatCurrency(customer.credit_limit)}
                    </span>
                  </div>
                )}
                {isNearLimit && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 text-red-600" />
                    <span className="text-xs text-red-600">Near credit limit</span>
                  </div>
                )}
              </div>
            )}

            {/* Purchase Stats */}
            {customer.total_purchases > 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <TrendingUp className="h-3 w-3" />
                <span>
                  Total purchases: {formatCurrency(customer.total_purchases)}
                </span>
              </div>
            )}

            {/* Last Activity */}
            {customer.last_purchase_at && (
              <div className="mt-1 text-xs text-gray-500">
                Last purchase: {formatRelativeTime(customer.last_purchase_at)}
              </div>
            )}
          </div>
        </div>

        {/* Arrow Icon */}
        {onClick && (
          <svg
            className="w-5 h-5 text-gray-400 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        )}
      </div>

      {/* Notes */}
      {customer.notes && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-600 line-clamp-2">{customer.notes}</p>
        </div>
      )}
    </div>
  );
}
