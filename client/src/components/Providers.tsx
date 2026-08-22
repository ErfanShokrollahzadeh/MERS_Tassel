'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AppChrome } from '@/components/AppChrome';
import { ToastViewport } from '@/components/ToastViewport';
import { I18nProvider } from '@/i18n/I18nProvider';
import type { Locale } from '@/i18n/I18nProvider';
import { AuthBootstrap } from '@/components/AuthBootstrap';
import { ApiError } from '@/lib/apiClient';

export function Providers({ children, initialLocale }: { children: React.ReactNode; initialLocale: Locale }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        // During local startup (or a short production restart), the API can be unavailable
        // for a few seconds while migrations finish. Recover network failures automatically;
        // rejected API requests still fail quickly because retrying cannot repair them.
        retry: (failureCount, error) => (
          error instanceof ApiError && error.code === 'network_error'
            ? failureCount < 6
            : failureCount < 1
        ),
        retryDelay: (attempt) => Math.min(400 * 2 ** attempt, 2_500),
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider initialLocale={initialLocale}>
        <AuthBootstrap />
        <AppChrome>{children}</AppChrome>
        <ToastViewport />
      </I18nProvider>
    </QueryClientProvider>
  );
}
