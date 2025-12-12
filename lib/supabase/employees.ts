// lib/supabase/employees.ts

import { supabase } from './client';
import bcrypt from 'bcryptjs';
import { UserRole } from '@/types';

// ==================
// EMPLOYEE CRUD
// ==================

export async function getEmployees(shopId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getEmployee(employeeId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', employeeId)
    .single();

  if (error) throw error;
  return data;
}

export async function createEmployee(
  shopId: string,
  ownerId: string,
  data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role: UserRole;
    pin_code?: string;
    // Supervisor permissions
    can_change_prices?: boolean;
    can_process_returns?: boolean;
    can_void_transactions?: boolean;
    discount_limit_percent?: number;
  }
) {
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
      },
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('Failed to create user');

  // Hash PIN if provided
  let hashedPin = null;
  if (data.pin_code) {
    if (!/^\d{4,6}$/.test(data.pin_code)) {
      throw new Error('PIN must be 4-6 digits');
    }
    const salt = await bcrypt.genSalt(10);
    hashedPin = await bcrypt.hash(data.pin_code, salt);
  }

  // Create profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      shop_id: shopId,
      name: data.name,
      phone: data.phone,
      role: data.role,
      pin_code: hashedPin,
      can_change_prices: data.can_change_prices ?? true,
      can_process_returns: data.can_process_returns ?? true,
      can_void_transactions: data.can_void_transactions ?? true,
      discount_limit_percent: data.discount_limit_percent ?? 10,
      is_active: true,
    })
    .select()
    .single();

  if (profileError) throw profileError;

  // Log activity
  await supabase.from('activity_log').insert({
    shop_id: shopId,
    user_id: ownerId,
    activity_type: 'employee_added',
    description: `Added employee: ${data.name} (${data.role})`,
    metadata: { employee_id: profile.id, role: data.role },
  });

  return profile;
}

export async function updateEmployee(
  employeeId: string,
  shopId: string,
  ownerId: string,
  data: {
    name?: string;
    phone?: string;
    role?: UserRole;
    can_change_prices?: boolean;
    can_process_returns?: boolean;
    can_void_transactions?: boolean;
    discount_limit_percent?: number;
    is_active?: boolean;
  }
) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .update({
      name: data.name,
      phone: data.phone,
      role: data.role,
      can_change_prices: data.can_change_prices,
      can_process_returns: data.can_process_returns,
      can_void_transactions: data.can_void_transactions,
      discount_limit_percent: data.discount_limit_percent,
      is_active: data.is_active,
    })
    .eq('id', employeeId)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await supabase.from('activity_log').insert({
    shop_id: shopId,
    user_id: ownerId,
    activity_type: 'employee_updated',
    description: `Updated employee: ${profile.name}`,
    metadata: { employee_id: employeeId, changes: data },
  });

  return profile;
}

export async function deactivateEmployee(
  employeeId: string,
  shopId: string,
  ownerId: string
) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('id', employeeId)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await supabase.from('activity_log').insert({
    shop_id: shopId,
    user_id: ownerId,
    activity_type: 'employee_updated',
    description: `Deactivated employee: ${profile.name}`,
    metadata: { employee_id: employeeId, action: 'deactivate' },
  });

  return profile;
}

export async function activateEmployee(
  employeeId: string,
  shopId: string,
  ownerId: string
) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .update({ is_active: true })
    .eq('id', employeeId)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await supabase.from('activity_log').insert({
    shop_id: shopId,
    user_id: ownerId,
    activity_type: 'employee_updated',
    description: `Activated employee: ${profile.name}`,
    metadata: { employee_id: employeeId, action: 'activate' },
  });

  return profile;
}

// ==================
// PIN MANAGEMENT
// ==================

export async function setupEmployeePIN(
  employeeId: string,
  shopId: string,
  ownerId: string,
  pin: string
) {
  if (!/^\d{4,6}$/.test(pin)) {
    throw new Error('PIN must be 4-6 digits');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPin = await bcrypt.hash(pin, salt);

  const { data, error } = await supabase
    .from('profiles')
    .update({ pin_code: hashedPin })
    .eq('id', employeeId)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await supabase.from('activity_log').insert({
    shop_id: shopId,
    user_id: ownerId,
    activity_type: 'employee_updated',
    description: `Set up PIN for employee: ${data.name}`,
    metadata: { employee_id: employeeId, action: 'pin_setup' },
  });

  return data;
}

export async function changeEmployeePIN(
  employeeId: string,
  shopId: string,
  currentPin: string,
  newPin: string
) {
  // Verify current PIN
  const { data: profile } = await supabase
    .from('profiles')
    .select('pin_code')
    .eq('id', employeeId)
    .single();

  if (!profile?.pin_code) {
    throw new Error('No PIN set up');
  }

  const isValid = await bcrypt.compare(currentPin, profile.pin_code);
  if (!isValid) {
    throw new Error('Current PIN is incorrect');
  }

  // Hash new PIN
  if (!/^\d{4,6}$/.test(newPin)) {
    throw new Error('New PIN must be 4-6 digits');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPin = await bcrypt.hash(newPin, salt);

  const { data, error } = await supabase
    .from('profiles')
    .update({ pin_code: hashedPin })
    .eq('id', employeeId)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await supabase.from('activity_log').insert({
    shop_id: shopId,
    user_id: employeeId,
    activity_type: 'employee_updated',
    description: `Changed PIN`,
    metadata: { employee_id: employeeId, action: 'pin_change' },
  });

  return data;
}

export async function verifyEmployeePIN(
  employeeId: string,
  pin: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('pin_code')
    .eq('id', employeeId)
    .single();

  if (!profile?.pin_code) return false;

  return await bcrypt.compare(pin, profile.pin_code);
}

// ==================
// QUICK SWITCH
// ==================

export async function switchToEmployee(pin: string, shopId: string) {
  // Find employee by PIN in this shop
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('shop_id', shopId)
    .eq('is_active', true);

  if (error) throw error;

  // Check each profile's PIN
  for (const profile of profiles) {
    if (profile.pin_code) {
      const isValid = await bcrypt.compare(pin, profile.pin_code);
      if (isValid) {
        // Update last login
        await supabase
          .from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', profile.id);

        // Log activity
        await supabase.from('activity_log').insert({
          shop_id: shopId,
          user_id: profile.id,
          activity_type: 'login',
          description: `Logged in via PIN switch`,
          metadata: { method: 'pin_switch' },
        });

        return profile;
      }
    }
  }

  throw new Error('Invalid PIN');
}
