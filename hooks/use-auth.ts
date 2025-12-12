// hooks/use-auth.ts

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUser, getUserProfile, signOut as authSignOut, updateLastLogin } from '@/lib/supabase/auth';
import type { Profile, Shop } from '@/types';

interface AuthUser {
  id: string;
  email: string;
  profile: Profile & { shop: Shop };
}

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const currentUser = await getCurrentUser();

        if (currentUser) {
          const profile = await getUserProfile(currentUser.id);

          setUser({
            id: currentUser.id,
            email: currentUser.email!,
            profile,
          });

          // Update last login
          await updateLastLogin(currentUser.id);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await getUserProfile(session.user.id);

          setUser({
            id: session.user.id,
            email: session.user.email!,
            profile,
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshAuth = async () => {
    setIsLoading(true);
    try {
      const currentUser = await getCurrentUser();

      if (currentUser) {
        const profile = await getUserProfile(currentUser.id);

        setUser({
          id: currentUser.id,
          email: currentUser.email!,
          profile,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await authSignOut();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return {
    user,
    profile: user?.profile ?? null,
    isLoading,
    isAuthenticated: !!user,
    signOut,
    refreshAuth,
  };
}
