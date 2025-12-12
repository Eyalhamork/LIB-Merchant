// lib/supabase/customers.ts

import { supabase } from './client';
import type { Customer } from '@/types';

// ==================
// CUSTOMER CRUD
// ==================

/**
 * Get all customers for a shop
 */
export async function getCustomers(shopId: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get all customers (including inactive)
 */
export async function getAllCustomers(shopId: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('shop_id', shopId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get a single customer by ID with full details
 */
export async function getCustomerById(customerId: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data;
}

/**
 * Search customers by name or phone
 */
export async function searchCustomers(shopId: string, query: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
    .order('name', { ascending: true })
    .limit(20);

  if (error) throw error;
  return data;
}

/**
 * Create a new customer
 */
export async function createCustomer(
  shopId: string,
  data: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    credit_limit?: number;
    notes?: string;
  }
) {
  const { data: customer, error } = await supabase
    .from('customers')
    .insert({
      shop_id: shopId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      credit_limit: data.credit_limit,
      notes: data.notes,
      credit_balance: 0,
      total_purchases: 0,
      total_credit_used: 0,
      total_credit_paid: 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await supabase.from('activity_log').insert({
    shop_id: shopId,
    activity_type: 'customer_created',
    description: `Created customer: ${data.name}`,
    metadata: { customer_id: customer.id },
  });

  return customer;
}

/**
 * Update a customer
 */
export async function updateCustomer(
  customerId: string,
  shopId: string,
  data: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    credit_limit?: number;
    notes?: string;
    is_active?: boolean;
  }
) {
  const { data: customer, error } = await supabase
    .from('customers')
    .update({
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      credit_limit: data.credit_limit,
      notes: data.notes,
      is_active: data.is_active,
    })
    .eq('id', customerId)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await supabase.from('activity_log').insert({
    shop_id: shopId,
    activity_type: 'customer_created', // Reusing this type for updates
    description: `Updated customer: ${customer.name}`,
    metadata: { customer_id: customerId, changes: data },
  });

  return customer;
}

/**
 * Deactivate a customer
 */
export async function deactivateCustomer(customerId: string, shopId: string) {
  const { data: customer, error } = await supabase
    .from('customers')
    .update({ is_active: false })
    .eq('id', customerId)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await supabase.from('activity_log').insert({
    shop_id: shopId,
    activity_type: 'customer_created',
    description: `Deactivated customer: ${customer.name}`,
    metadata: { customer_id: customerId, action: 'deactivate' },
  });

  return customer;
}

/**
 * Activate a customer
 */
export async function activateCustomer(customerId: string, shopId: string) {
  const { data: customer, error } = await supabase
    .from('customers')
    .update({ is_active: true })
    .eq('id', customerId)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await supabase.from('activity_log').insert({
    shop_id: shopId,
    activity_type: 'customer_created',
    description: `Activated customer: ${customer.name}`,
    metadata: { customer_id: customerId, action: 'activate' },
  });

  return customer;
}

// ==================
// CUSTOMER CREDIT
// ==================

/**
 * Get all customers with outstanding credit
 */
export async function getCustomersWithCredit(shopId: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .gt('credit_balance', 0)
    .order('credit_balance', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Add credit to customer balance (used when making credit sale)
 */
export async function addCustomerCredit(
  customerId: string,
  amount: number,
  transactionId: string
) {
  // Get current customer data
  const { data: customer } = await supabase
    .from('customers')
    .select('credit_balance, total_credit_used')
    .eq('id', customerId)
    .single();

  if (!customer) throw new Error('Customer not found');

  // Update balances
  const { data, error } = await supabase
    .from('customers')
    .update({
      credit_balance: customer.credit_balance + amount,
      total_credit_used: customer.total_credit_used + amount,
      last_purchase_at: new Date().toISOString(),
    })
    .eq('id', customerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Reduce customer credit balance (used when recording payment)
 */
export async function reduceCustomerCredit(customerId: string, amount: number) {
  // Get current customer data
  const { data: customer } = await supabase
    .from('customers')
    .select('credit_balance, total_credit_paid')
    .eq('id', customerId)
    .single();

  if (!customer) throw new Error('Customer not found');

  // Validate payment doesn't exceed balance
  if (amount > customer.credit_balance) {
    throw new Error('Payment amount exceeds credit balance');
  }

  // Update balances
  const { data, error } = await supabase
    .from('customers')
    .update({
      credit_balance: customer.credit_balance - amount,
      total_credit_paid: customer.total_credit_paid + amount,
      last_payment_at: new Date().toISOString(),
    })
    .eq('id', customerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get customer credit statistics
 */
export async function getCustomerCreditStats(shopId: string) {
  const { data: customers, error } = await supabase
    .from('customers')
    .select('credit_balance, credit_limit')
    .eq('shop_id', shopId)
    .eq('is_active', true);

  if (error) throw error;

  const stats = {
    total_customers: customers.length,
    customers_with_credit: customers.filter((c) => c.credit_balance > 0).length,
    total_outstanding: customers.reduce((sum, c) => sum + c.credit_balance, 0),
    customers_near_limit: customers.filter(
      (c) => c.credit_limit && c.credit_balance >= c.credit_limit * 0.9
    ).length,
  };

  return stats;
}

/**
 * Check if customer can receive more credit
 */
export async function canCustomerReceiveCredit(
  customerId: string,
  additionalAmount: number
): Promise<{ allowed: boolean; reason?: string }> {
  const customer = await getCustomerById(customerId);

  if (!customer) {
    return { allowed: false, reason: 'Customer not found' };
  }

  if (!customer.is_active) {
    return { allowed: false, reason: 'Customer account is inactive' };
  }

  if (!customer.credit_limit) {
    // No limit set, allow
    return { allowed: true };
  }

  const newBalance = customer.credit_balance + additionalAmount;

  if (newBalance > customer.credit_limit) {
    return {
      allowed: false,
      reason: `Credit limit exceeded. Limit: ${customer.credit_limit}, Current: ${customer.credit_balance}, Requested: ${additionalAmount}`,
    };
  }

  return { allowed: true };
}
