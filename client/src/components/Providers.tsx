'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AppChrome } from '@/components/AppChrome';
import { ToastViewport } from '@/components/ToastViewport';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AppChrome>{children}</AppChrome>
      <ToastViewport />
    </QueryClientProvider>
  );
}
