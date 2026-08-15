'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApiError, logout as logoutRequest, profile, refreshSession, type AuthSession, type AuthUser } from '@/lib/auth';

type AuthState = {
  user: AuthUser | null;
  access: string | null;
  refresh: string | null;
  hasHydrated: boolean;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
  setHydrated: (value: boolean) => void;
  refreshAccess: () => Promise<string | null>;
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
      setSession: (session) => set(session),
      clearSession: () => set({ user: null, access: null, refresh: null }),
      setHydrated: (hasHydrated) => set({ hasHydrated }),
      refreshAccess: async () => {
        const currentRefresh = get().refresh;
        if (!currentRefresh) return null;
        try {
          const next = await refreshSession(currentRefresh);
          set({ access: next.access, refresh: next.refresh || currentRefresh });
          return next.access;
        } catch {
          get().clearSession();
          return null;
        }
      },
      restore: async () => {
        let access = get().access;
        if (!access || !get().refresh) {
          get().clearSession();
          return false;
        }
        try {
          const user = await profile(access);
          set({ user });
          return true;
        } catch (error) {
          if (!(error instanceof ApiError) || error.status !== 401) {
            get().clearSession();
            return false;
          }
        }
        access = await get().refreshAccess();
        if (!access) return false;
        try {
          const user = await profile(access);
          set({ user });
          return true;
        } catch {
          get().clearSession();
          return false;
        }
      },
      signOut: async () => {
        const { access, refresh } = get();
        try {
          if (access && refresh) await logoutRequest(access, refresh);
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

export async function withFreshAccess<T>(operation: (access: string) => Promise<T>): Promise<T> {
  const auth = useAuthStore.getState();
  if (!auth.access) throw new ApiError('Authentication required.', 401);
  try {
    return await operation(auth.access);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    const access = await useAuthStore.getState().refreshAccess();
    if (!access) throw error;
    return operation(access);
  }
}
