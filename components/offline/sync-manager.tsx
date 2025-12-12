// components/offline/sync-manager.tsx

'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useOffline } from '@/hooks/use-offline';
import { useOfflineStore } from '@/store/offline-store';
import { SyncService } from '@/lib/sync-service';

export function SyncManager() {
  const { isOnline, wasOffline, resetWasOffline } = useOffline();
  const {
    queue,
    isSyncing,
    setIsSyncing,
    updateSyncStatus,
    clearSynced,
    setOnline,
    setLastSyncAt,
  } = useOfflineStore();
  const syncInProgress = useRef(false);

  // Update online status in store
  useEffect(() => {
    setOnline(isOnline);
  }, [isOnline, setOnline]);

  // Trigger sync when connection is restored
  useEffect(() => {
    if (isOnline && wasOffline && !syncInProgress.current) {
      syncTransactions();
      resetWasOffline();
    }
  }, [isOnline, wasOffline, resetWasOffline]);

  // Auto-sync pending transactions when online
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isSyncing && !syncInProgress.current) {
      const pendingCount = queue.filter((t) => t.sync_status === 'pending').length;
      if (pendingCount > 0) {
        syncTransactions();
      }
    }
  }, [isOnline, queue, isSyncing]);

  const syncTransactions = async () => {
    if (syncInProgress.current || isSyncing) {
      return;
    }

    syncInProgress.current = true;
    setIsSyncing(true);

    try {
      // Get only pending transactions
      const pendingTransactions = queue.filter(
        (t) => t.sync_status === 'pending'
      );

      if (pendingTransactions.length === 0) {
        return;
      }

      toast.info(`Syncing ${pendingTransactions.length} transaction${pendingTransactions.length !== 1 ? 's' : ''}...`);

      // Sync each transaction
      const results = await SyncService.syncTransactions(pendingTransactions);

      // Update status for each result
      results.forEach((result) => {
        updateSyncStatus(result.localId, result.status);
      });

      // Count results
      const synced = results.filter((r) => r.status === 'synced').length;
      const conflicts = results.filter((r) => r.status === 'conflict').length;
      const failed = results.filter((r) => r.status === 'failed').length;

      // Show results
      if (synced > 0) {
        toast.success(`✓ Synced ${synced} transaction${synced !== 1 ? 's' : ''}`);
      }

      if (conflicts > 0) {
        toast.warning(`${conflicts} transaction${conflicts !== 1 ? 's' : ''} need attention (stock issues)`);
      }

      if (failed > 0) {
        toast.error(`${failed} transaction${failed !== 1 ? 's' : ''} failed to sync`);
      }

      // Clean up synced transactions after a delay
      setTimeout(() => {
        clearSynced();
      }, 2000);

      setLastSyncAt(new Date().toISOString());
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error('Sync failed: ' + (error.message || 'Unknown error'));
    } finally {
      syncInProgress.current = false;
      setIsSyncing(false);
    }
  };

  return null; // This component doesn't render anything
}
