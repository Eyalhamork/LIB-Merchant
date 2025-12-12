// components/pos/customer-selector.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, UserPlus, DollarSign } from 'lucide-react';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import EmptyState from '@/components/ui/empty-state';
import Spinner from '@/components/ui/spinner';
import { getPOSCustomers, searchPOSCustomers } from '@/lib/supabase/pos';
import { formatCurrency, debounce } from '@/lib/utils';
import type { Customer } from '@/types';

interface CustomerSelectorProps {
  isOpen: boolean;
  shopId: string;
  onClose: () => void;
  onSelect: (customer: Customer | null) => void;
}

export function CustomerSelector({
  isOpen,
  shopId,
  onClose,
  onSelect,
}: CustomerSelectorProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen, shopId]);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await getPOSCustomers(shopId);
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      console.error('Load customers error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  const debouncedSearch = useRef(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setFilteredCustomers(customers);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchPOSCustomers(shopId, query);
        setFilteredCustomers(results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300)
  ).current;

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery]);

  const handleSelect = (customer: Customer) => {
    onSelect(customer);
    handleClose();
  };

  const handleRemoveCustomer = () => {
    onSelect(null);
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Select Customer">
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or phone..."
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          )}
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* No Customer Option */}
        <button
          onClick={handleRemoveCustomer}
          className="w-full p-3 border-2 border-gray-200 rounded-lg text-left hover:border-emerald-500 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <X className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">No Customer</p>
              <p className="text-sm text-gray-500">Cash or mobile money only</p>
            </div>
          </div>
        </button>

        {/* Customer List */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title={searchQuery ? 'No customers found' : 'No customers yet'}
              description={
                searchQuery
                  ? 'Try a different search term'
                  : 'Add customers to enable credit sales'
              }
            />
          ) : (
            filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => handleSelect(customer)}
                className="w-full p-3 border border-gray-200 rounded-lg text-left hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    {customer.phone && (
                      <p className="text-sm text-gray-600 mt-0.5">{customer.phone}</p>
                    )}
                    {customer.credit_balance > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                        <DollarSign className="h-3 w-3" />
                        <span>
                          Outstanding: {formatCurrency(customer.credit_balance)}
                        </span>
                      </div>
                    )}
                    {customer.credit_limit && (
                      <p className="text-xs text-gray-500 mt-1">
                        Credit Limit: {formatCurrency(customer.credit_limit)}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-gray-200">
          <Button variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
