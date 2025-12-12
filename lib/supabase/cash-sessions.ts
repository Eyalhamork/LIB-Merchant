// lib/supabase/cash-sessions.ts

import { supabase } from './client';
import type { CashSession, CashSessionStatus } from '@/types';

/**
 * Get the active cash session for an employee
 */
export async function getActiveSession(employeeId: string): Promise<CashSession | null> {
  const { data, error } = await supabase
    .from('cash_sessions')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('status', 'open')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No active session
    throw error;
  }

  return data;
}

/**
 * Open a new cash session
 */
export async function openSession(
  shopId: string,
  employeeId: string,
  openingBalance: number
): Promise<CashSession> {
  // Check for existing active session
  const existingSession = await getActiveSession(employeeId);
  if (existingSession) {
    throw new Error('You already have an active session. Please close it first.');
  }

  const sessionDate = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('cash_sessions')
    .insert({
      shop_id: shopId,
      employee_id: employeeId,
      opening_balance: openingBalance,
      session_date: sessionDate,
      status: 'open',
    })
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await supabase.from('activity_log').insert({
    shop_id: shopId,
    user_id: employeeId,
    activity_type: 'session_opened',
    reference_type: 'cash_session',
    reference_id: data.id,
    description: `Opened cash session with ${openingBalance.toFixed(2)} LRD`,
    metadata: {
      opening_balance: openingBalance,
      session_date: sessionDate,
    },
  });

  return data;
}

/**
 * Close a cash session
 */
export async function closeSession(
  sessionId: string,
  closingBalance: number,
  notes?: string
): Promise<CashSession> {
  // Get current session data
  const { data: session, error: fetchError } = await supabase
    .from('cash_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (fetchError) throw fetchError;
  if (!session) throw new Error('Session not found');
  if (session.status !== 'open') throw new Error('Session is already closed');

  // Calculate expected balance
  const expectedBalance =
    session.opening_balance +
    session.cash_sales_total +
    session.cash_credit_payments -
    session.cash_refunds_total;

  const discrepancy = closingBalance - expectedBalance;

  // Update session
  const { data, error } = await supabase
    .from('cash_sessions')
    .update({
      closing_balance: closingBalance,
      expected_balance: expectedBalance,
      discrepancy: discrepancy,
      status: 'closed',
      closed_at: new Date().toISOString(),
      notes: notes,
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await supabase.from('activity_log').insert({
    shop_id: session.shop_id,
    user_id: session.employee_id,
    activity_type: 'session_closed',
    reference_type: 'cash_session',
    reference_id: sessionId,
    description: `Closed cash session with ${Math.abs(discrepancy).toFixed(2)} LRD ${
      discrepancy >= 0 ? 'surplus' : 'shortage'
    }`,
    metadata: {
      opening_balance: session.opening_balance,
      closing_balance: closingBalance,
      expected_balance: expectedBalance,
      discrepancy: discrepancy,
    },
  });

  return data;
}

/**
 * Get session history for a shop
 */
export async function getSessionHistory(
  shopId: string,
  startDate?: string,
  endDate?: string,
  employeeId?: string
): Promise<CashSession[]> {
  let query = supabase
    .from('cash_sessions')
    .select(`
      *,
      employee:profiles!cash_sessions_employee_id_fkey(id, name)
    `)
    .eq('shop_id', shopId)
    .order('session_date', { ascending: false })
    .order('opened_at', { ascending: false });

  if (startDate) {
    query = query.gte('session_date', startDate);
  }

  if (endDate) {
    query = query.lte('session_date', endDate);
  }

  if (employeeId) {
    query = query.eq('employee_id', employeeId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get today's session for an employee
 */
export async function getTodaySession(employeeId: string): Promise<CashSession | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('cash_sessions')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('session_date', today)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Add cash sale to session
 */
export async function addCashSaleToSession(
  sessionId: string,
  amount: number
): Promise<void> {
  const { data: session, error: fetchError } = await supabase
    .from('cash_sessions')
    .select('cash_sales_total')
    .eq('id', sessionId)
    .single();

  if (fetchError) throw fetchError;

  const { error: updateError } = await supabase
    .from('cash_sessions')
    .update({
      cash_sales_total: session.cash_sales_total + amount,
    })
    .eq('id', sessionId);

  if (updateError) throw updateError;
}

/**
 * Add cash credit payment to session
 */
export async function addCashCreditPaymentToSession(
  sessionId: string,
  amount: number
): Promise<void> {
  const { data: session, error: fetchError } = await supabase
    .from('cash_sessions')
    .select('cash_credit_payments')
    .eq('id', sessionId)
    .single();

  if (fetchError) throw fetchError;

  const { error: updateError } = await supabase
    .from('cash_sessions')
    .update({
      cash_credit_payments: session.cash_credit_payments + amount,
    })
    .eq('id', sessionId);

  if (updateError) throw updateError;
}

/**
 * Add cash refund to session
 */
export async function addCashRefundToSession(
  sessionId: string,
  amount: number
): Promise<void> {
  const { data: session, error: fetchError } = await supabase
    .from('cash_sessions')
    .select('cash_refunds_total')
    .eq('id', sessionId)
    .single();

  if (fetchError) throw fetchError;

  const { error: updateError } = await supabase
    .from('cash_sessions')
    .update({
      cash_refunds_total: session.cash_refunds_total + amount,
    })
    .eq('id', sessionId);

  if (updateError) throw updateError;
}

/**
 * Calculate expected balance for a session
 */
export function calculateExpectedBalance(session: CashSession): number {
  return (
    session.opening_balance +
    session.cash_sales_total +
    session.cash_credit_payments -
    session.cash_refunds_total
  );
}

/**
 * Check if discrepancy exceeds threshold
 */
export function isDiscrepancyHigh(
  discrepancy: number,
  threshold: number
): boolean {
  return Math.abs(discrepancy) > threshold;
}

/**
 * Expire old open sessions (run at midnight)
 */
export async function expireOldSessions(shopId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  const { error } = await supabase
    .from('cash_sessions')
    .update({ status: 'expired' })
    .eq('shop_id', shopId)
    .eq('status', 'open')
    .lt('session_date', today);

  if (error) throw error;
}