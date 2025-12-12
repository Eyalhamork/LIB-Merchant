// hooks/use-customers.ts

import { useState, useEffect, useCallback } from 'react';
import {
  getCustomers,
  getAllCustomers,
  getCustomerById,
  searchCustomers,
  createCustomer,
  updateCustomer,
  getCustomersWithCredit,
} from '@/lib/supabase/customers';
import type { Customer } from '@/types';

export function useCustomers(shopId: string | undefined, includeInactive = false) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    if (!shopId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = includeInactive
        ? await getAllCustomers(shopId)
        : await getCustomers(shopId);
      setCustomers(data);
    } catch (err: any) {
      console.error('Error loading customers:', err);
      setError(err.message || 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  }, [shopId, includeInactive]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const refresh = useCallback(() => {
    loadCustomers();
  }, [loadCustomers]);

  return {
    customers,
    isLoading,
    error,
    refresh,
  };
}

export function useCustomer(customerId: string | undefined) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomer = useCallback(async () => {
    if (!customerId) {
      setCustomer(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getCustomerById(customerId);
      setCustomer(data);
    } catch (err: any) {
      console.error('Error loading customer:', err);
      setError(err.message || 'Failed to load customer');
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  const refresh = useCallback(() => {
    loadCustomer();
  }, [loadCustomer]);

  return {
    customer,
    isLoading,
    error,
    refresh,
  };
}

export function useCustomersWithCredit(shopId: string | undefined) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    if (!shopId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getCustomersWithCredit(shopId);
      setCustomers(data);
    } catch (err: any) {
      console.error('Error loading customers with credit:', err);
      setError(err.message || 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const refresh = useCallback(() => {
    loadCustomers();
  }, [loadCustomers]);

  return {
    customers,
    isLoading,
    error,
    refresh,
  };
}

export function useCustomerSearch(shopId: string | undefined, query: string) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const search = async () => {
      if (!shopId || !query.trim()) {
        setCustomers([]);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const data = await searchCustomers(shopId, query);
        setCustomers(data);
      } catch (err: any) {
        console.error('Error searching customers:', err);
        setError(err.message || 'Search failed');
        setCustomers([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [shopId, query]);

  return {
    customers,
    isSearching,
    error,
  };
}
