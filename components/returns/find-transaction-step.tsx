// components/returns/find-transaction-step.tsx

'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Card from '@/components/ui/card';
import Spinner from '@/components/ui/spinner';
import EmptyState from '@/components/ui/empty-state';
import { searchTransactions } from '@/lib/supabase/returns';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Transaction } from '@/types';

interface FindTransactionStepProps {
  shopId: string;
  onTransactionSelected: (transaction: Transaction) => void;
}

export function FindTransactionStep({
  shopId,
  onTransactionSelected,
}: FindTransactionStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const results = await searchTransactions(shopId, searchQuery);
      setTransactions(results);
    } catch (error) {
      console.error('Search error:', error);
      setTransactions([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Find Transaction
        </h2>
        <p className="text-sm text-gray-600">
          Search by receipt number, date, or customer name
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <Input
          type="text"
          placeholder="Enter receipt number or search term..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isSearching}>
          {isSearching ? (
            <>
              <Spinner className="mr-2" />
              Searching...
            </>
          ) : (
            'Search'
          )}
        </Button>
      </form>

      {/* Search Results */}
      {isSearching && (
        <div className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {!isSearching && hasSearched && transactions.length === 0 && (
        <EmptyState
          title="No transactions found"
          description="Try a different search term or receipt number"
        />
      )}

      {!isSearching && transactions.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            {transactions.length} transaction{transactions.length > 1 ? 's' : ''} found
          </p>

          {transactions.map((transaction) => (
            <Card
              key={transaction.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onTransactionSelected(transaction)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-gray-900">
                      {transaction.receipt_number}
                    </h3>
                    {transaction.customer && (
                      <span className="text-sm text-gray-600">
                        • {transaction.customer.name}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Date</p>
                      <p className="font-medium">{formatDate(transaction.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total</p>
                      <p className="font-medium">
                        {formatCurrency(transaction.total_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Items</p>
                      <p className="font-medium">
                        {transaction.items?.length || 0} item(s)
                      </p>
                    </div>
                  </div>
                </div>

                <svg
                  className="w-5 h-5 text-gray-400"
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

      {/* Helper Text */}
      {!hasSearched && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-emerald-900">Search Tips</h4>
              <ul className="mt-1 text-sm text-emerald-700 list-disc list-inside space-y-1">
                <li>Search by receipt number (e.g., RCP-20240115-0001)</li>
                <li>Search by customer name</li>
                <li>Search by product name</li>
                <li>Only completed transactions can be returned</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
