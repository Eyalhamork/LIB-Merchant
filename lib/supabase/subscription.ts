// lib/supabase/subscription.ts

import { supabase } from './client';
import { SubscriptionPlan } from '@/types';

// ==================
// UPGRADE REQUESTS
// ==================

interface UpgradeRequestData {
  shop_id: string;
  current_plan: SubscriptionPlan;
  requested_plan: SubscriptionPlan;
  message?: string;
}

export async function requestUpgrade(data: UpgradeRequestData) {
  // Create upgrade request record
  const { data: request, error } = await supabase
    .from('subscription_upgrade_requests')
    .insert({
      shop_id: data.shop_id,
      current_plan: data.current_plan,
      requested_plan: data.requested_plan,
      message: data.message,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await supabase.from('activity_log').insert({
    shop_id: data.shop_id,
    activity_type: 'subscription_upgrade_requested',
    description: `Requested upgrade from ${data.current_plan} to ${data.requested_plan}`,
    metadata: {
      current_plan: data.current_plan,
      requested_plan: data.requested_plan,
      request_id: request.id,
    },
  });

  return request;
}

export async function getUpgradeRequests(shopId: string) {
  const { data, error } = await supabase
    .from('subscription_upgrade_requests')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ==================
// BILLING HISTORY
// ==================

export async function getBillingHistory(shopId: string) {
  const { data, error } = await supabase
    .from('billing_records')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) {
    // If table doesn't exist yet, return empty array
    if (error.code === '42P01') {
      return [];
    }
    throw error;
  }

  return data || [];
}

export async function createBillingRecord(data: {
  shop_id: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  payment_method: string;
  description: string;
  invoice_number?: string;
  period_start: string;
  period_end: string;
}) {
  const { data: record, error } = await supabase
    .from('billing_records')
    .insert({
      ...data,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return record;
}

// ==================
// SUBSCRIPTION MANAGEMENT
// ==================

export async function updateSubscriptionPlan(
  shopId: string,
  plan: SubscriptionPlan,
  expiresAt: string
) {
  const { data, error } = await supabase
    .from('shops')
    .update({
      subscription_plan: plan,
      subscription_status: 'active',
      subscription_expires_at: expiresAt,
    })
    .eq('id', shopId)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await supabase.from('activity_log').insert({
    shop_id: shopId,
    activity_type: 'subscription_updated',
    description: `Subscription plan updated to ${plan}`,
    metadata: {
      plan,
      expires_at: expiresAt,
    },
  });

  return data;
}

export async function extendTrial(shopId: string, newTrialEndsAt: string) {
  const { data, error } = await supabase
    .from('shops')
    .update({
      trial_ends_at: newTrialEndsAt,
    })
    .eq('id', shopId)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await supabase.from('activity_log').insert({
    shop_id: shopId,
    activity_type: 'subscription_updated',
    description: `Trial period extended to ${newTrialEndsAt}`,
    metadata: {
      trial_ends_at: newTrialEndsAt,
    },
  });

  return data;
}

export async function cancelSubscription(shopId: string, reason?: string) {
  const { data, error } = await supabase
    .from('shops')
    .update({
      subscription_status: 'cancelled',
    })
    .eq('id', shopId)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await supabase.from('activity_log').insert({
    shop_id: shopId,
    activity_type: 'subscription_cancelled',
    description: `Subscription cancelled${reason ? `: ${reason}` : ''}`,
    metadata: {
      reason,
      cancelled_at: new Date().toISOString(),
    },
  });

  return data;
}

// ==================
// SUBSCRIPTION STATUS CHECKS
// ==================

export async function checkSubscriptionStatus(shopId: string) {
  const { data: shop, error } = await supabase
    .from('shops')
    .select('subscription_status, subscription_expires_at, trial_ends_at')
    .eq('id', shopId)
    .single();

  if (error) throw error;

  const now = new Date();

  // Check if trial has expired
  if (shop.subscription_status === 'trial' && shop.trial_ends_at) {
    const trialEnds = new Date(shop.trial_ends_at);
    if (now > trialEnds) {
      // Update status to expired
      await supabase
        .from('shops')
        .update({ subscription_status: 'expired' })
        .eq('id', shopId);

      return {
        ...shop,
        subscription_status: 'expired' as const,
        is_active: false,
      };
    }
  }

  // Check if subscription has expired
  if (shop.subscription_status === 'active' && shop.subscription_expires_at) {
    const subscriptionEnds = new Date(shop.subscription_expires_at);
    if (now > subscriptionEnds) {
      // Update status to expired
      await supabase
        .from('shops')
        .update({ subscription_status: 'expired' })
        .eq('id', shopId);

      return {
        ...shop,
        subscription_status: 'expired' as const,
        is_active: false,
      };
    }
  }

  return {
    ...shop,
    is_active: shop.subscription_status === 'trial' || shop.subscription_status === 'active',
  };
}

export async function getSubscriptionFeatures(plan: SubscriptionPlan) {
  // Define feature limits by plan
  const features = {
    starter: {
      max_products: 500,
      max_employees: 2,
      advanced_reports: false,
      csv_export: false,
      multi_location: false,
      priority_support: false,
    },
    professional: {
      max_products: -1, // unlimited
      max_employees: -1, // unlimited
      advanced_reports: true,
      csv_export: true,
      multi_location: true,
      priority_support: true,
    },
  };

  return features[plan];
}
