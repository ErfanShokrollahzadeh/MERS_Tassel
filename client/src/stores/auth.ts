'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { connectAuthBridge } from '@/lib/apiClient';
import { ApiError, logout as logoutRequest, profile } from '@/lib/auth';
import type { AuthSession, AuthUser } from '@/types/commerce';

type AuthState = {
  user: AuthUser | null;
  access: string | null;
  refresh: string | null;
  hasHydrated: boolean;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
  setHydrated: (value: boolean) => void;
  restore: () => Promise<boolean>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      access: null,
      refresh: null,
      hasHydrated: false,

      setSession: ({ user, access, refresh }) => set({ user, access, refresh }),
      clearSession: () => set({ user: null, access: null, refresh: null }),
      setHydrated: (hasHydrated) => set({ hasHydrated }),

      /**
       * Confirms a persisted session is still valid. The api client transparently rotates
       * an expired access token, so a single profile call is enough.
       */
      restore: async () => {
        if (!get().access || !get().refresh) {
          get().clearSession();
          return false;
        }

        try {
          set({ user: await profile() });
          return true;
        } catch (error) {
          if (error instanceof ApiError && error.status === 0) {
            // API unreachable — keep the stored session so a restart doesn't sign the user out.
            return false;
          }
          get().clearSession();
          return false;
        }
      },

      signOut: async () => {
        const { refresh } = get();
        try {
          if (refresh) await logoutRequest(refresh);
        } catch {
          // Revoking is best-effort; the local session is cleared either way.
        } finally {
          get().clearSession();
        }
      },
    }),
    {
      name: 'mers-auth',
      partialize: ({ user, access, refresh }) => ({ user, access, refresh }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);

// Give the api client read/write access to the tokens without importing the store from it.
connectAuthBridge({
  getAccess: () => useAuthStore.getState().access,
  getRefresh: () => useAuthStore.getState().refresh,
  onRefreshed: (access, refresh) => useAuthStore.setState({ access, refresh }),
  onSignedOut: () => useAuthStore.getState().clearSession(),
});

export const isAdmin = (state: AuthState) => state.user?.role === 'admin';
