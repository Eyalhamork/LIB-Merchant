// store/auth-store.ts

'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile, Shop } from '@/types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  shop: Shop | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setShop: (shop: Shop | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  shop: null,
  isLoading: true,
  isInitialized: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setShop: (shop) => set({ shop }),
  setLoading: (loading) => set({ isLoading: loading }),

  initialize: async () => {
    try {
      set({ isLoading: true });

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        set({ 
          user: null, 
          profile: null, 
          shop: null, 
          isLoading: false,
          isInitialized: true 
        });
        return;
      }

      set({ user: session.user });

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        set({ profile });

        // Get shop
        const { data: shop } = await supabase
          .from('shops')
          .select('*')
          .eq('id', profile.shop_id)
          .single();

        if (shop) {
          set({ shop });
        }
      }

      set({ isLoading: false, isInitialized: true });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ 
        user: null, 
        profile: null, 
        shop: null, 
        isLoading: false,
        isInitialized: true 
      });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ 
      user: null, 
      profile: null, 
      shop: null 
    });
  },
}));
