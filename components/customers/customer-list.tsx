// components/customers/customer-list.tsx

'use client';

import { useState } from 'react';
import { CustomerCard } from './customer-card';
import EmptyState from '@/components/ui/empty-state';
import type { Customer } from '@/types';
import { Users } from 'lucide-react';

interface CustomerListProps {
  customers: Customer[];
  onCustomerClick?: (customer: Customer) => void;
  showCreditInfo?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function CustomerList({
  customers,
  onCustomerClick,
  showCreditInfo = true,
  emptyTitle = 'No customers found',
  emptyDescription = 'Customers will appear here',
}: CustomerListProps) {
  if (customers.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="grid gap-4">
      {customers.map((customer) => (
        <CustomerCard
          key={customer.id}
          customer={customer}
          onClick={onCustomerClick ? () => onCustomerClick(customer) : undefined}
          showCreditInfo={showCreditInfo}
        />
      ))}
    </div>
  );
}
