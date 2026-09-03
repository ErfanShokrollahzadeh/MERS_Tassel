'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSiteSettings } from '@/lib/useSiteSettings';
import { useAuthStore } from '@/stores/auth';
import { cartCount, cartSubtotal, useCartStore } from '@/stores/cart';
import { useI18n } from '@/i18n/I18nProvider';

type CrispCommand = [action: string, name: string, ...values: unknown[]];

declare global {
  interface Window {
    $crisp?: { push: (command: CrispCommand) => number };
    CRISP_WEBSITE_ID?: string;
  }
}

const CRISP_SCRIPT_ID = 'crisp-chat-sdk';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Loads Crisp only after the public site settings explicitly enable a valid website. */
export function CrispChat() {
  const pathname = usePathname();
  const { data: settings } = useSiteSettings();
  const { locale } = useI18n();
  const user = useAuthStore((state) => state.user);
  const itemCount = useCartStore(cartCount);
  const cartTotal = useCartStore(cartSubtotal);
  const previousUserId = useRef<string | null>(null);

  const configuredId = settings?.crispWebsiteId?.trim() || process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID?.trim();
  const enabled = settings?.crispEnabled === true && Boolean(configuredId && UUID_PATTERN.test(configuredId));

  useEffect(() => {
    if (!enabled || !configuredId) return;

    window.$crisp ??= [] as unknown as NonNullable<Window['$crisp']>;
    window.CRISP_WEBSITE_ID = configuredId;

    if (!document.getElementById(CRISP_SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = CRISP_SCRIPT_ID;
      script.src = 'https://client.crisp.chat/l.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onerror = () => script.remove();
      document.head.appendChild(script);
    }

    return () => {
      window.$crisp?.push(['do', 'chat:hide']);
    };
  }, [configuredId, enabled]);

  useEffect(() => {
    if (!enabled || !window.$crisp) return;

    if (previousUserId.current && !user) {
      window.$crisp.push(['do', 'session:reset']);
    }
    previousUserId.current = user?.id ?? null;

    if (user) {
      window.$crisp.push(['set', 'user:email', [user.email]]);
      window.$crisp.push(['set', 'user:nickname', [`${user.firstName} ${user.lastName}`.trim()]]);
    }

    window.$crisp.push(['set', 'session:data', [[
      ['locale', locale],
      ['cart_items_count', itemCount],
      ['cart_total', cartTotal],
      ['currency', 'TRY'],
      ['page_path', pathname],
      ['page_url', window.location.href],
    ]]]);
    window.$crisp.push(['do', 'chat:show']);
  }, [cartTotal, enabled, itemCount, locale, pathname, user]);

  return null;
}
