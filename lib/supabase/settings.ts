// lib/supabase/settings.ts

import { supabase } from './client';
import bcrypt from 'bcryptjs';

// ==================
// PROFILE MANAGEMENT
// ==================

export async function updateProfile(
  userId: string,
  data: {
    name?: string;
    phone?: string;
  }
) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .update({
      name: data.name,
      phone: data.phone,
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return profile;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

// ==================
// PASSWORD MANAGEMENT
// ==================

export async function changePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}

// ==================
// PIN MANAGEMENT
// ==================

export async function setupOwnerPIN(userId: string, pin: string) {
  // Validate PIN format (4-6 digits)
  if (!/^\d{4,6}$/.test(pin)) {
    throw new Error('PIN must be 4-6 digits');
  }

  // Hash PIN with bcrypt
  const salt = await bcrypt.genSalt(10);
  const hashedPin = await bcrypt.hash(pin, salt);

  // Store hashed PIN
  const { data, error } = await supabase
    .from('profiles')
    .update({ pin_code: hashedPin })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  const profile = await getProfile(userId);
  await supabase.from('activity_log').insert({
    shop_id: profile.shop_id,
    user_id: userId,
    activity_type: 'settings_changed',
    description: 'Owner PIN set up',
    metadata: { action: 'pin_setup' },
  });

  return data;
}

export async function verifyOwnerPIN(userId: string, pin: string): Promise<boolean> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('pin_code')
    .eq('id', userId)
    .single();

  if (error || !profile.pin_code) {
    return false;
  }

  // Compare with bcrypt
  const isValid = await bcrypt.compare(pin, profile.pin_code);
  return isValid;
}

export async function changeOwnerPIN(
  userId: string,
  currentPin: string,
  newPin: string
) {
  // Verify current PIN first
  const isCurrentValid = await verifyOwnerPIN(userId, currentPin);
  if (!isCurrentValid) {
    throw new Error('Current PIN is incorrect');
  }

  // Validate new PIN format
  if (!/^\d{4,6}$/.test(newPin)) {
    throw new Error('New PIN must be 4-6 digits');
  }

  // Hash new PIN
  const salt = await bcrypt.genSalt(10);
  const hashedPin = await bcrypt.hash(newPin, salt);

  // Update PIN
  const { data, error } = await supabase
    .from('profiles')
    .update({ pin_code: hashedPin })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  const profile = await getProfile(userId);
  await supabase.from('activity_log').insert({
    shop_id: profile.shop_id,
    user_id: userId,
    activity_type: 'settings_changed',
    description: 'Owner PIN changed',
    metadata: { action: 'pin_change' },
  });

  return data;
}

export async function hasPinSetup(userId: string): Promise<boolean> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('pin_code')
    .eq('id', userId)
    .single();

  if (error) return false;
  return !!profile.pin_code;
}

// ==================
// SHOP SETTINGS
// ==================

export async function getShopSettings(shopId: string) {
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('id', shopId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateShopSettings(
  shopId: string,
  userId: string,
  data: {
    name?: string;
    phone?: string;
    address?: string;
    business_type?: string;
    low_stock_threshold?: number;
    discrepancy_alert_threshold?: number;
    supervisor_enabled?: boolean;
  }
) {
  const { data: shop, error } = await supabase
    .from('shops')
    .update({
      name: data.name,
      phone: data.phone,
      address: data.address,
      business_type: data.business_type,
      low_stock_threshold: data.low_stock_threshold,
      discrepancy_alert_threshold: data.discrepancy_alert_threshold,
      supervisor_enabled: data.supervisor_enabled,
    })
    .eq('id', shopId)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await supabase.from('activity_log').insert({
    shop_id: shopId,
    user_id: userId,
    activity_type: 'settings_changed',
    description: 'Shop settings updated',
    metadata: { changes: data },
  });

  return shop;
}
