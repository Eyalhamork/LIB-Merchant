// components/pos/session-status.tsx

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getActiveCashSession } from '@/lib/supabase/pos';
import { CloseSessionModal } from '@/components/pos/close-session-modal';
import Button from '@/components/ui/button';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import type { CashSession } from '@/types';

interface SessionStatusProps {
  onSessionClosed?: () => void;
}

export function SessionStatus({ onSessionClosed }: SessionStatusProps) {
  const { profile } = useAuth();
  const [session, setSession] = useState<CashSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCloseModal, setShowCloseModal] = useState(false);

  useEffect(() => {
    loadSession();
  }, [profile]);

  const loadSession = async () => {
    if (!profile?.id) return;

    setIsLoading(true);
    try {
      const activeSession = await getActiveCashSession(profile.id);
      setSession(activeSession);
    } catch (error) {
      console.error('Load session error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionClosed = () => {
    setShowCloseModal(false);
    setSession(null);
    onSessionClosed?.();
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        <span>Loading session...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <span className="text-amber-700 font-medium">No active session</span>
      </div>
    );
  }

  // Calculate expected balance
  const expectedBalance =
    session.opening_balance +
    session.cash_sales_total +
    session.cash_credit_payments -
    session.cash_refunds_total;

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
        {/* Status Icon */}
        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>

        {/* Session Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-green-900">Active Session</span>
            <span className="text-xs text-green-600">
              • {formatRelativeTime(session.opened_at)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-green-700 mt-0.5">
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Expected: {formatCurrency(expectedBalance)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Opened: {new Date(session.opened_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setShowCloseModal(true)}
          className="flex-shrink-0"
        >
          Close Day
        </Button>
      </div>

      {/* Close Session Modal */}
      {showCloseModal && (
        <CloseSessionModal
          isOpen={showCloseModal}
          onClose={() => setShowCloseModal(false)}
          session={session}
          onSuccess={handleSessionClosed}
        />
      )}
    </>
  );
}
