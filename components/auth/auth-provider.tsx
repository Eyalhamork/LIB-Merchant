// components/auth/auth-provider.tsx

'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { initialize, setUser, isInitialized, user } = useAuthStore();

  useEffect(() => {
    // Initialize auth on mount
    initialize();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        await initialize();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialize, setUser, router]);

  // Redirect logic after initialization
  useEffect(() => {
    if (!isInitialized) return;

    const isAuthPage = pathname === '/login' || pathname === '/register';
    const isProtectedRoute = pathname?.startsWith('/dashboard') || 
                            pathname?.startsWith('/pos') ||
                            pathname?.startsWith('/products') ||
                            pathname?.startsWith('/customers') ||
                            pathname?.startsWith('/inventory') ||
                            pathname?.startsWith('/transactions') ||
                            pathname?.startsWith('/reports') ||
                            pathname?.startsWith('/employees') ||
                            pathname?.startsWith('/settings');

    if (!user && isProtectedRoute) {
      router.push('/login');
    } else if (user && isAuthPage) {
      router.push('/dashboard');
    }
  }, [isInitialized, user, pathname, router]);

  return <>{children}</>;
}
