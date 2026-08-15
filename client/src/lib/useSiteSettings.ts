'use client';

import { useQuery } from '@tanstack/react-query';
import { catalogKeys, fetchSiteSettings } from '@/lib/catalog';

/**
 * Site chrome (logo, hero, contact details) shared by the header, footer, auth screens and
 * contact page. React Query dedupes the request, so mounting this in several components
 * still results in a single call.
 */
export function useSiteSettings() {
  return useQuery({
    queryKey: catalogKeys.settings(),
    queryFn: () => fetchSiteSettings(),
    staleTime: 5 * 60_000,
  });
}
