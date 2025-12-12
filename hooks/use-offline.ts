// hooks/use-offline.ts

'use client';

import { useState, useEffect } from 'react';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Mark that we were offline (for sync trigger)
      if (!navigator.onLine) {
        setWasOffline(true);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check as backup (some browsers don't fire events reliably)
    const intervalId = setInterval(() => {
      const currentStatus = navigator.onLine;
      if (currentStatus !== isOnline) {
        setIsOnline(currentStatus);
        if (currentStatus && !isOnline) {
          setWasOffline(true);
        }
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnline]);

  // Reset wasOffline flag
  const resetWasOffline = () => {
    setWasOffline(false);
  };

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    resetWasOffline,
  };
}
