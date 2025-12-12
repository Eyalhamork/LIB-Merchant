// components/offline/conflict-resolution-modal.tsx

'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useOfflineStore } from '@/store/offline-store';
import { SyncService } from '@/lib/sync-service';
import type { OfflineTransaction } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export function ConflictResolutionModal() {
  const { queue, updateSyncStatus, removeFromQueue } = useOfflineStore();
  const [conflicts, setConflicts] = useState<OfflineTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<OfflineTransaction | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Update conflicts list
  useEffect(() => {
    const conflictTransactions = queue.filter(
      (t) => t.sync_status === 'conflict' || t.sync_status === 'failed'
    );
    setConflicts(conflictTransactions);

    // Auto-select first if none selected
    if (conflictTransactions.length > 0 && !selectedTransaction) {
      setSelectedTransaction(conflictTransactions[0]);
    }

    // Clear selection if resolved
    if (selectedTransaction && !conflictTransactions.find(
      (t) => t.local_id === selectedTransaction.local_id
    )) {
      setSelectedTransaction(null);
    }
  }, [queue, selectedTransaction]);

  const handleRetry = async (transaction: OfflineTransaction) => {
    setIsRetrying(true);
    try {
      // Update to pending and retry
      updateSyncStatus(transaction.local_id, 'pending');
      
      const result = await SyncService.retryTransaction(transaction);
      updateSyncStatus(result.localId, result.status);

      if (result.status === 'synced') {
        toast.success('Transaction synced successfully');
        setSelectedTransaction(null);
      } else if (result.status === 'conflict') {
        toast.error(result.error || 'Still has conflicts');
      } else {
        toast.error('Failed to sync: ' + (result.error || 'Unknown error'));
      }
    } catch (error: any) {
      toast.error('Retry failed: ' + error.message);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDiscard = (transaction: OfflineTransaction) => {
    if (confirm('Are you sure you want to discard this transaction? This cannot be undone.')) {
      removeFromQueue(transaction.local_id);
      toast.info('Transaction discarded');
      setSelectedTransaction(null);
    }
  };

  if (conflicts.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <div>
              <h3 className="font-semibold text-gray-900">
                Sync Conflicts
              </h3>
              <p className="text-sm text-gray-600">
                {conflicts.length} transaction{conflicts.length !== 1 ? 's' : ''} need attention
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-8rem)]">
          {/* Transaction List */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            {conflicts.map((transaction) => (
              <button
                key={transaction.local_id}
                onClick={() => setSelectedTransaction(transaction)}
                className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selectedTransaction?.local_id === transaction.local_id
                    ? 'bg-emerald-50 border-l-4 border-l-emerald-500'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">
                    {formatCurrency(transaction.total_amount)}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      transaction.sync_status === 'conflict'
                        ? 'bg-amber-100 text-amber-700'
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
                  {transaction.items.length} item{transaction.items.length !== 1 ? 's' : ''}
                </p>
              </button>
            ))}
          </div>

          {/* Transaction Details */}
          {selectedTransaction && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Transaction Info */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Transaction Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">
                        {formatDate(selectedTransaction.created_at, 'long')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium">
                        {formatCurrency(selectedTransaction.total_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium ${
                        selectedTransaction.sync_status === 'conflict'
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}>
                        {selectedTransaction.sync_status === 'conflict'
                          ? 'Stock Conflict'
                          : 'Failed to Sync'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Items</h4>
                  <div className="space-y-2">
                    {selectedTransaction.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {item.product.product?.name || 'Unknown Product'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity} × {formatCurrency(item.price)}
                          </p>
                        </div>
                        <span className="font-medium">
                          {formatCurrency(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payments */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Payments</h4>
                  <div className="space-y-2">
                    {selectedTransaction.payments.map((payment, index) => (
                      <div
                        key={index}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-gray-600 capitalize">
                          {payment.method.replace('_', ' ')}:
                        </span>
                        <span className="font-medium">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Issue Description */}
                {selectedTransaction.sync_status === 'conflict' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      <strong>Issue:</strong> One or more items don't have enough stock.
                      Stock levels may have changed since this transaction was created.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleRetry(selectedTransaction)}
                    disabled={isRetrying}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isRetrying ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        Retry Sync
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDiscard(selectedTransaction)}
                    disabled={isRetrying}
                    className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                    Discard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
