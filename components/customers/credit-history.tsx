// components/customers/credit-history.tsx

'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import Spinner from '@/components/ui/spinner';
import EmptyState from '@/components/ui/empty-state';
import { getCreditPaymentHistory } from '@/lib/supabase/credit-payments';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
import { CreditCard, TrendingDown, Calendar } from 'lucide-react';

interface CreditHistoryProps {
  customerId: string;
}

interface CreditPaymentWithDetails {
  id: string;
  amount: number;
  payment_method: string;
  created_at: string;
  notes?: string;
  recorder?: {
    id: string;
    name: string;
  };
  cash_session?: {
    id: string;
    session_date: string;
  };
}

export function CreditHistory({ customerId }: CreditHistoryProps) {
  const [payments, setPayments] = useState<CreditPaymentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [customerId]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await getCreditPaymentHistory(customerId);
      setPayments(data);
    } catch (error) {
      console.error('Error loading credit history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Cash',
      mtn_momo: 'MTN MoMo',
      orange_money: 'Orange Money',
    };
    return labels[method] || method;
  };

  const getPaymentMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      cash: 'bg-green-100 text-green-800',
      mtn_momo: 'bg-yellow-100 text-yellow-800',
      orange_money: 'bg-orange-100 text-orange-800',
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </div>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={<CreditCard />}
          title="No payment history"
          description="Credit payments will appear here"
        />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown className="h-5 w-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Payment History</h3>
        <Badge variant="default" className="ml-auto">
          {payments.length} payment{payments.length > 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="space-y-3">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(payment.amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatRelativeTime(payment.created_at)}
                  </p>
                </div>
              </div>
              <Badge className={getPaymentMethodColor(payment.payment_method)}>
                {getPaymentMethodLabel(payment.payment_method)}
              </Badge>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(payment.created_at, 'long')}</span>
              </div>

              {payment.recorder && (
                <div className="text-gray-600">
                  Recorded by: {payment.recorder.name}
                </div>
              )}

              {payment.cash_session && (
                <div className="text-gray-600">
                  Session: {formatDate(payment.cash_session.session_date)}
                </div>
              )}

              {payment.notes && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-gray-700">
                  {payment.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Total Payments Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Payments Received</span>
          <span className="text-lg font-bold text-green-600">
            {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
          </span>
        </div>
      </div>
    </Card>
  );
}
