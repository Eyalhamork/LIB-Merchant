// app/test-offline/page.tsx

'use client';

import { useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOffline } from '@/hooks/use-offline';
import { useOfflineStore } from '@/store/offline-store';
import { OfflineQueueStatus } from '@/components/offline/offline-queue-status';
import { generateUUID } from '@/lib/utils';
import type { OfflineTransaction } from '@/types';

export default function TestOfflinePage() {
  const { isOnline, isOffline } = useOffline();
  const { addToQueue, queue } = useOfflineStore();
  const [testMode, setTestMode] = useState<'online' | 'offline'>('online');

  const addTestTransaction = () => {
    const transaction: OfflineTransaction = {
      local_id: generateUUID(),
      shop_id: 'test-shop-id',
      employee_id: 'test-employee-id',
      items: [
        {
          shop_product_id: 'test-product-1',
          product: {
            id: 'test-product-1',
            shop_id: 'test-shop-id',
            product_id: 'test-product-1',
            cost_price: 50,
            selling_price: 100,
            current_quantity: 10,
            reorder_level: 5,
            use_auto_reorder: true,
            is_active: true,
            is_favorite: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            product: {
              id: 'test-product-1',
              name: 'Test Product',
              category: 'Test',
              unit: 'piece',
              is_generic: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
          quantity: 2,
          price: 100,
          subtotal: 200,
        },
      ],
      payments: [
        {
          method: 'cash',
          amount: 200,
        },
      ],
      subtotal: 200,
      discount_amount: 0,
      total_amount: 200,
      created_at: new Date().toISOString(),
      sync_status: 'pending',
    };

    addToQueue(transaction);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Offline Mode Testing
          </h1>
          
          <div className="flex items-center gap-4 mb-6">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isOnline
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-5 h-5" />
                  <span className="font-medium">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5" />
                  <span className="font-medium">Offline</span>
                </>
              )}
            </div>
            
            <div className="text-sm text-gray-600">
              Queue: {queue.length} transaction{queue.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Instructions:
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Open Chrome DevTools (F12)</li>
                <li>Go to Network tab</li>
                <li>Check "Offline" to simulate offline mode</li>
                <li>Click "Add Test Transaction" below</li>
                <li>Uncheck "Offline" to go back online</li>
                <li>Watch the transaction sync automatically</li>
              </ol>
            </div>

            <button
              onClick={addTestTransaction}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Add Test Transaction
            </button>
          </div>
        </div>

        {/* Queue Status */}
        <OfflineQueueStatus />

        {/* Service Worker Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Service Worker Status
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Supported:</span>
              <span className="font-medium">
                {'serviceWorker' in navigator ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Controller:</span>
              <span className="font-medium">
                {navigator.serviceWorker?.controller ? 'Active' : 'None'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">IndexedDB:</span>
              <span className="font-medium">
                {'indexedDB' in window ? 'Supported' : 'Not Supported'}
              </span>
            </div>
          </div>

          {typeof navigator !== 'undefined' && navigator.serviceWorker?.controller && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                ✓ Service worker is active and ready
              </p>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Service workers only work in production builds and on HTTPS.
            Use <code className="bg-blue-100 px-1 rounded">npm run build && npm start</code> to test locally.
          </p>
        </div>
      </div>
    </div>
  );
}
