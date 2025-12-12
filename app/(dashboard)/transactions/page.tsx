// app/(dashboard)/transactions/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import EmptyState from '@/components/ui/empty-state';
import Spinner from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { getTransactions } from '@/lib/supabase/transactions';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
import type { Transaction, TransactionStatus } from '@/types';

export default function TransactionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

  useEffect(() => {
    if (user?.profile.shop_id) {
      loadTransactions();
    }
  }, [user, dateFilter]);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      
      // Calculate date range based on filter
      let startDate: string | undefined;
      const now = new Date();
      
      if (dateFilter === 'today') {
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        startDate = weekAgo.toISOString();
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        startDate = monthAgo.toISOString();
      }

      const data = await getTransactions(user!.profile.shop_id, startDate);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((txn) => {
    // Status filter
    if (statusFilter !== 'all' && txn.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        txn.receipt_number.toLowerCase().includes(query) ||
        txn.customer?.name.toLowerCase().includes(query) ||
        txn.employee?.name.toLowerCase().includes(query) ||
        txn.notes?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const getStatusBadge = (status: TransactionStatus) => {
    if (status === 'voided') {
      return <Badge variant="danger">Voided</Badge>;
    }
    return <Badge variant="success">Completed</Badge>;
  };

  const getTotalSales = () => {
    return filteredTransactions
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + t.total_amount, 0);
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Cash',
      mtn_momo: 'MTN MoMo',
      orange_money: 'Orange Money',
      credit: 'Credit',
    };
    return labels[method] || method;
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
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-600 mt-1">
            View and manage all sales transactions
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Transactions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {filteredTransactions.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Sales</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(getTotalSales())}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Voided</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {filteredTransactions.filter((t) => t.status === 'voided').length}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            type="search"
            placeholder="Search by receipt, customer, employee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <Select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="voided">Voided</option>
          </Select>
        </div>
      </Card>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <EmptyState
          title="No transactions found"
          description="Transactions will appear here as sales are made"
        />
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <Card
              key={transaction.id}
              className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${
                transaction.status === 'voided' ? 'opacity-60' : ''
              }`}
              onClick={() => router.push(`/transactions/${transaction.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-gray-900">
                      {transaction.receipt_number}
                    </h3>
                    {getStatusBadge(transaction.status)}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Date</p>
                      <p className="font-medium">
                        {formatDate(transaction.created_at)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(transaction.created_at)}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600">Total</p>
                      <p className="font-medium text-lg">
                        {formatCurrency(transaction.total_amount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600">Payment</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {transaction.payments?.map((payment, idx) => (
                          <Badge key={idx} variant="default" className="text-xs">
                            {getPaymentMethodLabel(payment.payment_method)}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-600">Employee</p>
                      <p className="font-medium">{transaction.employee?.name}</p>
                      {transaction.customer && (
                        <p className="text-xs text-gray-500">
                          Customer: {transaction.customer.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {transaction.status === 'voided' && transaction.void_reason && (
                    <div className="mt-2 text-sm">
                      <p className="text-red-600">
                        Voided: {transaction.void_reason}
                      </p>
                    </div>
                  )}
                </div>

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
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
