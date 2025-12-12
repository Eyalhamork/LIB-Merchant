// components/offline/offline-indicator.tsx

'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Wifi, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useOffline } from '@/hooks/use-offline';
import { useOfflineStore } from '@/store/offline-store';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const { isOnline, isOffline } = useOffline();
  const { getPendingCount } = useOfflineStore();
  const pendingCount = getPendingCount();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show indicator when offline or when there are pending syncs
    setShow(isOffline || pendingCount > 0);
  }, [isOffline, pendingCount]);

  if (!show) return null;

  return (
    <div
      className={cn(
        'fixed top-16 left-1/2 -translate-x-1/2 z-50',
        'px-4 py-2 rounded-full shadow-lg',
        'flex items-center gap-2 text-sm font-medium',
        'transition-all duration-300',
        isOffline
          ? 'bg-red-500 text-white'
          : 'bg-amber-500 text-white'
      )}
    >
      {isOffline ? (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Offline Mode</span>
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Syncing {pendingCount} transaction{pendingCount !== 1 ? 's' : ''}</span>
        </>
      )}
    </div>
  );
}
