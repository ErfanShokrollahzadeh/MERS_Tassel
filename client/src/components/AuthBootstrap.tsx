'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';

export function AuthBootstrap() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const restore = useAuthStore((state) => state.restore);

  useEffect(() => {
    if (!hasHydrated) return;
    void restore().then((authenticated) => {
      if (authenticated) void useCartStore.getState().load();
      else useCartStore.getState().clear();
    });
  }, [hasHydrated, restore]);

  return null;
}
