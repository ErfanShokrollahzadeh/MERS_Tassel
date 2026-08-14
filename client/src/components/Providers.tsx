'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AppChrome } from '@/components/AppChrome';
import { ToastViewport } from '@/components/ToastViewport';
import { I18nProvider } from '@/i18n/I18nProvider';
import type { Locale } from '@/i18n/I18nProvider';

export function Providers({ children, initialLocale }: { children: React.ReactNode; initialLocale: Locale }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider initialLocale={initialLocale}>
        <AppChrome>{children}</AppChrome>
        <ToastViewport />
      </I18nProvider>
    </QueryClientProvider>
  );
}
