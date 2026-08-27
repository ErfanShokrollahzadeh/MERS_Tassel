'use client';

import { usePathname } from 'next/navigation';
import { StoreHeader } from '@/components/StoreHeader';
import { StoreFooter } from '@/components/StoreFooter';
import { CartDrawer } from '@/components/CartDrawer';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nProvider';
import { TradeInModal } from '@/components/TradeInModal';
import { CookiePreferencesCenter } from '@/components/CookiePreferencesCenter';

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const isAuth = pathname === '/login' || pathname === '/signup';
  const isCheckout = pathname.startsWith('/checkout');
  const reduceMotion = useReducedMotion();
  const { t } = useI18n();

  if (isAdmin) return <>{children}</>;

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">{t('common.skipContent')}</a>
      {!isAuth && !isCheckout && <StoreHeader />}
      <AnimatePresence mode="wait" initial={false}><motion.main id="main-content" key={pathname} initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -6 }} transition={{ duration: reduceMotion ? 0 : .28, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.main></AnimatePresence>
      {!isAuth && !isCheckout && <StoreFooter />}
      <CartDrawer />
      <TradeInModal />
      <CookiePreferencesCenter />
    </div>
  );
}
