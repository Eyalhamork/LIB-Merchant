// app/offline/page.tsx

'use client';

import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
          <WifiOff className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          You're Offline
        </h1>
        
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          ShopManager needs an internet connection to load this page.
          Don't worry - you can still make sales at the POS when offline.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            Try Again
          </button>
          
          <p className="text-sm text-gray-500">
            Make sure you're connected to the internet and try again.
          </p>
        </div>
      </div>
    </div>
  );
}
