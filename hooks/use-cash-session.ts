// hooks/use-cash-session.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import {
  getActiveSession,
  getTodaySession,
  openSession,
  closeSession,
  getSessionHistory,
  calculateExpectedBalance,
} from '@/lib/supabase/cash-sessions';
import type { CashSession } from '@/types';
import { toast } from 'sonner';

export function useCashSession() {
  const { user, profile } = useAuth();
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [todaySession, setTodaySession] = useState<CashSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Load active session
  const loadActiveSession = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const session = await getActiveSession(user.id);
      setActiveSession(session);

      // Also load today's session (might be closed)
      const today = await getTodaySession(user.id);
      setTodaySession(today);
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadActiveSession();
  }, [loadActiveSession]);

  // Open new session
  const handleOpenSession = async (openingBalance: number) => {
    if (!user?.id || !profile?.shop_id) {
      toast.error('User not authenticated');
      return false;
    }

    if (openingBalance < 0) {
      toast.error('Opening balance cannot be negative');
      return false;
    }

    setIsOpening(true);

    try {
      const session = await openSession(profile.shop_id, user.id, openingBalance);
      setActiveSession(session);
      setTodaySession(session);
      toast.success('Cash session opened successfully');
      return true;
    } catch (error: any) {
      console.error('Error opening session:', error);
      toast.error(error.message || 'Failed to open session');
      return false;
    } finally {
      setIsOpening(false);
    }
  };

  // Close session
  const handleCloseSession = async (closingBalance: number, notes?: string) => {
    if (!activeSession) {
      toast.error('No active session to close');
      return false;
    }

    if (closingBalance < 0) {
      toast.error('Closing balance cannot be negative');
      return false;
    }

    setIsClosing(true);

    try {
      const closedSession = await closeSession(
        activeSession.id,
        closingBalance,
        notes
      );

      setActiveSession(null);
      setTodaySession(closedSession);

      // Show discrepancy info
      const discrepancy = closedSession.discrepancy || 0;
      if (Math.abs(discrepancy) > 0) {
        if (discrepancy > 0) {
          toast.success(`Session closed with ${discrepancy.toFixed(2)} LRD surplus`);
        } else {
          toast.warning(
            `Session closed with ${Math.abs(discrepancy).toFixed(2)} LRD shortage`
          );
        }
      } else {
        toast.success('Session closed - balanced!');
      }

      return true;
    } catch (error: any) {
      console.error('Error closing session:', error);
      toast.error(error.message || 'Failed to close session');
      return false;
    } finally {
      setIsClosing(false);
    }
  };

  // Get expected balance for current session
  const getExpectedBalance = () => {
    if (!activeSession) return 0;
    return calculateExpectedBalance(activeSession);
  };

  return {
    activeSession,
    todaySession,
    isLoading,
    isOpening,
    isClosing,
    hasActiveSession: !!activeSession,
    openSession: handleOpenSession,
    closeSession: handleCloseSession,
    refreshSession: loadActiveSession,
    getExpectedBalance,
  };
}