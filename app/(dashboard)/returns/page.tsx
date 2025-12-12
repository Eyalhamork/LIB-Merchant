// app/(dashboard)/returns/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import EmptyState from '@/components/ui/empty-state';
import Spinner from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { getReturns } from '@/lib/supabase/returns';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Return } from '@/types';

export default function ReturnsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [returns, setReturns] = useState<Return[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.profile.shop_id) {
      loadReturns();
    }
  }, [user]);

  const loadReturns = async () => {
    try {
      setIsLoading(true);
      const data = await getReturns(user!.profile.shop_id);
      setReturns(data);
    } catch (error) {
      console.error('Failed to load returns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReturns = returns.filter((ret) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      ret.id.toLowerCase().includes(query) ||
      ret.notes?.toLowerCase().includes(query)
    );
  });

  const getRefundMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Cash Refund';
      case 'credit_to_account':
        return 'Credit to Account';
      case 'exchange':
        return 'Exchange';
      default:
        return method;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Returns & Exchanges</h1>
          <p className="text-sm text-gray-600 mt-1">
            Process customer returns and exchanges
          </p>
        </div>
        <Link href="/returns/new">
          <Button>
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Process Return
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          type="search"
          placeholder="Search returns by ID or notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </Card>

      {/* Returns List */}
      {filteredReturns.length === 0 ? (
        <EmptyState
          title="No returns yet"
          description="Returns and exchanges will appear here"
          action={
            <Link href="/returns/new">
              <Button>Process First Return</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredReturns.map((returnItem) => (
            <Card key={returnItem.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-gray-900">
                      Return #{returnItem.id.slice(0, 8)}
                    </h3>
                    <Badge variant={returnItem.refund_method === 'exchange' ? 'primary' : 'secondary'}>
                      {getRefundMethodLabel(returnItem.refund_method)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Date</p>
                      <p className="font-medium">{formatDate(returnItem.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Refund Amount</p>
                      <p className="font-medium">
                        {formatCurrency(returnItem.total_refund_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Original Transaction</p>
                      <p className="font-medium text-blue-600">
                        #{returnItem.original_transaction_id.slice(0, 8)}
                      </p>
                    </div>
                  </div>

                  {returnItem.notes && (
                    <div className="mt-3 text-sm">
                      <p className="text-gray-600">Notes:</p>
                      <p className="text-gray-700">{returnItem.notes}</p>
                    </div>
                  )}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/transactions/${returnItem.original_transaction_id}`)}
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
