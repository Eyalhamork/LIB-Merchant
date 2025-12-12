// app/(dashboard)/customers/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useCustomers } from '@/hooks/use-customers';
import { getCustomerCreditStats } from '@/lib/supabase/customers';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { CustomerList } from '@/components/customers/customer-list';
import { CreditSummaryCard } from '@/components/customers/credit-summary-card';
import { Users, Plus, Search, Filter } from 'lucide-react';
import type { Customer } from '@/types';

export default function CustomersPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { customers, isLoading, refresh } = useCustomers(profile?.shop_id, false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'credit'>('active');
  const [creditStats, setCreditStats] = useState<any>(null);

  useEffect(() => {
    if (profile?.shop_id) {
      loadCreditStats();
    }
  }, [profile]);

  const loadCreditStats = async () => {
    if (!profile?.shop_id) return;

    try {
      const stats = await getCustomerCreditStats(profile.shop_id);
      setCreditStats(stats);
    } catch (error) {
      console.error('Error loading credit stats:', error);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    // Status filter
    if (filterStatus === 'credit' && customer.credit_balance <= 0) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        customer.name.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const handleCustomerClick = (customer: Customer) => {
    router.push(`/customers/${customer.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Customers</h1>
              <p className="text-sm text-gray-500">
                Manage customers and track credit
              </p>
            </div>
            <Button onClick={() => router.push('/customers/add')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Credit Summary */}
        {creditStats && (
          <CreditSummaryCard
            totalCustomers={creditStats.total_customers}
            customersWithCredit={creditStats.customers_with_credit}
            totalOutstanding={creditStats.total_outstanding}
            customersNearLimit={creditStats.customers_near_limit}
          />
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filterStatus === 'active'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus('credit')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filterStatus === 'credit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                With Credit
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        {filteredCustomers.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredCustomers.length} customer
              {filteredCustomers.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Customer List */}
        <CustomerList
          customers={filteredCustomers}
          onCustomerClick={handleCustomerClick}
          showCreditInfo={true}
          emptyTitle={
            searchQuery
              ? 'No customers found'
              : customers.length === 0
              ? 'No customers yet'
              : 'No customers match filters'
          }
          emptyDescription={
            searchQuery
              ? 'Try adjusting your search'
              : customers.length === 0
              ? 'Add your first customer to get started'
              : 'Try different filters'
          }
        />
      </div>
    </div>
  );
}
