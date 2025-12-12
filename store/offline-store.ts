// store/offline-store.ts

'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { OfflineTransaction, SyncStatus } from '@/types';

interface OfflineStore {
  queue: OfflineTransaction[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;

  // Actions
  addToQueue: (transaction: OfflineTransaction) => void;
  removeFromQueue: (localId: string) => void;
  updateSyncStatus: (localId: string, status: SyncStatus) => void;
  clearSynced: () => void;
  setOnline: (online: boolean) => void;
  setIsSyncing: (syncing: boolean) => void;
  setLastSyncAt: (timestamp: string) => void;

  // Computed
  getPendingCount: () => number;
  getConflictCount: () => number;
  getFailedCount: () => number;
}

// IndexedDB storage for persistence
const createIndexedDBStorage = () => {
  const dbName = 'shopmanager_offline';
  const storeName = 'offline_transactions';
  const dbVersion = 1;

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };
    });
  };

  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        const db = await openDB();
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
          const request = store.get(name);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.error('IndexedDB getItem error:', error);
        return null;
      }
    },

    setItem: async (name: string, value: string): Promise<void> => {
      try {
        const db = await openDB();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
          const request = store.put(value, name);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.error('IndexedDB setItem error:', error);
      }
    },

    removeItem: async (name: string): Promise<void> => {
      try {
        const db = await openDB();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
          const request = store.delete(name);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.error('IndexedDB removeItem error:', error);
      }
    },
  };
};

export const useOfflineStore = create<OfflineStore>()(
  persist(
    (set, get) => ({
      queue: [],
      isOnline: true,
      isSyncing: false,
      lastSyncAt: null,

      addToQueue: (transaction) => {
        set((state) => ({
          queue: [...state.queue, transaction],
        }));
      },

      removeFromQueue: (localId) => {
        set((state) => ({
          queue: state.queue.filter((t) => t.local_id !== localId),
        }));
      },

      updateSyncStatus: (localId, status) => {
        set((state) => ({
          queue: state.queue.map((t) =>
            t.local_id === localId ? { ...t, sync_status: status } : t
          ),
        }));
      },

      clearSynced: () => {
        set((state) => ({
          queue: state.queue.filter((t) => t.sync_status !== 'synced'),
        }));
      },

      setOnline: (online) => set({ isOnline: online }),

      setIsSyncing: (syncing) => set({ isSyncing: syncing }),

      setLastSyncAt: (timestamp) => set({ lastSyncAt: timestamp }),

      getPendingCount: () => {
        return get().queue.filter((t) => t.sync_status === 'pending').length;
      },

      getConflictCount: () => {
        return get().queue.filter((t) => t.sync_status === 'conflict').length;
      },

      getFailedCount: () => {
        return get().queue.filter((t) => t.sync_status === 'failed').length;
      },
    }),
    {
      name: 'shopmanager-offline-queue',
      storage: createJSONStorage(() => {
        // Check if we're in browser environment
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        
        // Use IndexedDB if available, fallback to localStorage
        if (typeof indexedDB !== 'undefined') {
          return createIndexedDBStorage();
        }
        
        return localStorage;
      }),
    }
  )
);
