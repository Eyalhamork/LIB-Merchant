// components/offline/offline-queue-status.tsx

'use client';

import { useState } from 'react';
import { Cloud, AlertCircle, CheckCircle, XCircle, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useOfflineStore } from '@/store/offline-store';
import { SyncService } from '@/lib/sync-service';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { OfflineTransaction } from '@/types';

export function OfflineQueueStatus() {
  const { queue, isOnline, isSyncing, lastSyncAt, removeFromQueue, updateSyncStatus } = useOfflineStore();
  const [retrying, setRetrying] = useState<string | null>(null);

  const stats = SyncService.getSyncStats(queue);

  const handleRetry = async (transaction: OfflineTransaction) => {
    setRetrying(transaction.local_id);
    try {
      updateSyncStatus(transaction.local_id, 'pending');
      const result = await SyncService.retryTransaction(transaction);
      updateSyncStatus(result.localId, result.status);

      if (result.status === 'synced') {
        toast.success('Transaction synced successfully');
      } else {
        toast.error(result.error || 'Failed to sync');
      }
    } catch (error: any) {
      toast.error('Retry failed: ' + error.message);
    } finally {
      setRetrying(null);
    }
  };

  const handleDiscard = (transaction: OfflineTransaction) => {
    if (confirm('Discard this transaction? This cannot be undone.')) {
      removeFromQueue(transaction.local_id);
      toast.info('Transaction discarded');
    }
  };

  if (queue.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Cloud className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Offline Queue</h3>
        </div>
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-600">All transactions are synced</p>
          {lastSyncAt && (
            <p className="text-sm text-gray-500 mt-2">
              Last synced: {formatDate(lastSyncAt, 'long')}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cloud className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Offline Queue</h3>
              <p className="text-sm text-gray-600">
                {stats.total} transaction{stats.total !== 1 ? 's' : ''} in queue
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isOnline && (
              <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                Offline
              </span>
            )}
            {isSyncing && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Syncing
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.synced}</div>
            <div className="text-xs text-gray-600">Synced</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.conflict}</div>
            <div className="text-xs text-gray-600">Conflicts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-xs text-gray-600">Failed</div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {queue.map((transaction) => (
          <div key={transaction.local_id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(transaction.total_amount)}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      transaction.sync_status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : transaction.sync_status === 'synced'
                        ? 'bg-green-100 text-green-700'
                        : transaction.sync_status === 'conflict'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {transaction.sync_status}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600">
                  {formatDate(transaction.created_at, 'long')}
                </p>
                
                <p className="text-xs text-gray-500 mt-1">
                  {transaction.items.length} item{transaction.items.length !== 1 ? 's' : ''} •{' '}
                  {transaction.payments.map((p) => p.method).join(', ')}
                </p>
              </div>

              {/* Actions */}
              {(transaction.sync_status === 'conflict' || transaction.sync_status === 'failed') && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleRetry(transaction)}
                    disabled={retrying === transaction.local_id}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Retry"
                  >
                    <RefreshCw
                      className={`w-5 h-5 ${
                        retrying === transaction.local_id ? 'animate-spin' : ''
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleDiscard(transaction)}
                    disabled={retrying === transaction.local_id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Discard"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {lastSyncAt && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Last synced: {formatDate(lastSyncAt, 'long')}
          </p>
        </div>
      )}
    </div>
  );
}
