// lib/supabase/auth.ts

import { supabase } from './client';

interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  phone: string;
  shop_name: string;
  business_type: string;
  address: string;
  shop_phone: string;
}

/**
 * Register a new user with shop setup and 30-day trial
 */
export async function registerUser(data: RegisterUserData) {
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    const userId = authData.user.id;

    // 2. Calculate trial end date (30 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    // 3. Create shop
    const { data: shopData, error: shopError } = await supabase
      .from('shops')
      .insert({
        name: data.shop_name,
        owner_id: userId,
        phone: data.shop_phone || null,
        address: data.address || null,
        business_type: data.business_type || null,
        currency: 'LRD',
        supervisor_enabled: false,
        low_stock_threshold: 10,
        discrepancy_alert_threshold: 500,
        subscription_status: 'trial',
        subscription_plan: 'starter',
        trial_ends_at: trialEndsAt.toISOString(),
      })
      .select()
      .single();

    if (shopError) throw shopError;
    if (!shopData) throw new Error('Failed to create shop');

    // 4. Create owner profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        shop_id: shopData.id,
        name: data.name,
        phone: data.phone || null,
        role: 'owner',
        is_active: true,
      });

    if (profileError) throw profileError;

    // 5. Log activity
    await supabase.from('activity_log').insert({
      shop_id: shopData.id,
      user_id: userId,
      activity_type: 'login',
      description: 'Account created and trial started',
      metadata: {
        business_type: data.business_type,
        trial_ends_at: trialEndsAt.toISOString(),
      },
    });

    return {
      user: authData.user,
      shop: shopData,
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

/**
 * Sign in user
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Get user profile with shop info
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      shop:shops(*)
    `)
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password/confirm`,
  });

  if (error) throw error;
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
}

/**
 * Check if user session is valid
 */
export async function checkSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Update user profile
 */
export async function updateProfile(userId: string, updates: {
  name?: string;
  phone?: string;
  pin_code?: string;
}) {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) throw error;
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
}
