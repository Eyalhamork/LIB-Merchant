// components/cash-session/session-status-badge.tsx

'use client';

import Badge from '@/components/ui/badge';
import type { CashSession } from '@/types';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface SessionStatusBadgeProps {
  session: CashSession | null;
  showIcon?: boolean;
}

export function SessionStatusBadge({ session, showIcon = true }: SessionStatusBadgeProps) {
  if (!session) {
    return (
      <Badge className="bg-gray-100 text-gray-800">
        {showIcon && <XCircle className="h-3 w-3 mr-1" />}
        No Session
      </Badge>
    );
  }

  if (session.status === 'open') {
    return (
      <Badge className="bg-green-100 text-green-800">
        {showIcon && <CheckCircle className="h-3 w-3 mr-1" />}
        Session Open
      </Badge>
    );
  }

  if (session.status === 'closed') {
    return (
      <Badge className="bg-emerald-100 text-emerald-800">
        {showIcon && <CheckCircle className="h-3 w-3 mr-1" />}
        Closed
      </Badge>
    );
  }

  if (session.status === 'expired') {
    return (
      <Badge className="bg-amber-100 text-amber-800">
        {showIcon && <Clock className="h-3 w-3 mr-1" />}
        Expired
      </Badge>
    );
  }

  return null;
}