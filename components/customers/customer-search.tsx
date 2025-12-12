// components/customers/customer-search.tsx

'use client';

import { useState } from 'react';
import Input from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { useCustomerSearch } from '@/hooks/use-customers';
import { CustomerCard } from './customer-card';
import type { Customer } from '@/types';
import { Search, X } from 'lucide-react';

interface CustomerSearchProps {
  shopId: string;
  onCustomerSelected: (customer: Customer) => void;
  excludeCustomerIds?: string[];
  placeholder?: string;
  autoFocus?: boolean;
}

export function CustomerSearch({
  shopId,
  onCustomerSelected,
  excludeCustomerIds = [],
  placeholder = 'Search customers by name or phone...',
  autoFocus = false,
}: CustomerSearchProps) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const { customers, isSearching } = useCustomerSearch(shopId, query);

  const filteredCustomers = customers.filter(
    (c) => !excludeCustomerIds.includes(c.id)
  );

  const handleSelectCustomer = (customer: Customer) => {
    onCustomerSelected(customer);
    setQuery('');
    setShowResults(false);
  };

  const handleClear = () => {
    setQuery('');
    setShowResults(false);
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className="pl-10 pr-10"
          autoFocus={autoFocus}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Spinner size="sm" />
          </div>
        )}
      </div>

      {/* Search Results */}
      {showResults && query.trim() && (
        <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">No customers found</p>
              <p className="text-xs text-gray-400 mt-1">
                Try a different search term
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                >
                  <CustomerCard
                    customer={customer}
                    onClick={() => handleSelectCustomer(customer)}
                    showCreditInfo={true}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Backdrop to close results */}
      {showResults && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
}
