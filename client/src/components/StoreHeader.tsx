'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Heart, Menu, Moon, Search, ShoppingBag, Sun, UserRound, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cartCount, useCartStore } from '@/stores/cart';
import { useI18n, type TranslationKey } from '@/i18n/I18nProvider';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { useAuthStore } from '@/stores/auth';

const links = [
  { href: '/', key: 'nav.home' },
  { href: '/products', key: 'nav.shop' },
  { href: '/about', key: 'nav.story' },
  { href: '/contact', key: 'nav.journal' },
];

export function StoreHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const count = useCartStore(cartCount);
  const openCart = useCartStore((state) => state.open);
  const user = useAuthStore((state) => state.user);
  const { t } = useI18n();

  useEffect(() => {
    const saved = window.localStorage.getItem('mers-theme');
    const next = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDark(next);
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    window.localStorage.setItem('mers-theme', next ? 'dark' : 'light');
  };

  const openProtectedCart = () => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    openCart();
  };

  return (
    <header className="store-header glass-bar">
      <div className="store-header__inner container-wide">
        <button className="icon-button nav-menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label={t('header.menu')} aria-expanded={menuOpen}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link href="/" className="wordmark" aria-label={t('header.home')}>
          <span className="wordmark__seal">M</span>
          <span>MERS <i>Tassel</i></span>
        </Link>

        <nav className={menuOpen ? 'store-nav store-nav--open' : 'store-nav'} aria-label={t('header.navigation')}>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={pathname === link.href ? 'active' : ''} onClick={() => setMenuOpen(false)}>{t(link.key as TranslationKey)}</Link>
          ))}
          <Link className="admin-mobile-link" href={user ? '/account' : '/login'} onClick={() => setMenuOpen(false)}>{t('header.account')}</Link>
          <Link className="admin-mobile-link" href="/admin">{t('nav.admin')}</Link>
          <div className="header-language-mobile"><LanguageSwitch /></div>
        </nav>

        <div className="header-actions">
          <LanguageSwitch compact />
          <Link className="icon-button hide-mobile" href="/products?focus=search" aria-label={t('header.search')}><Search size={19} /></Link>
          <button className="icon-button hide-mobile" aria-label={t('header.saved')}><Heart size={19} /></button>
          <button className="icon-button hide-mobile" onClick={toggleTheme} aria-label={t(dark ? 'header.light' : 'header.dark')}>
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <Link className="icon-button hide-mobile" href={user ? '/account' : '/login'} aria-label={t('header.account')}><UserRound size={19} /></Link>
          <button className="icon-button cart-button" onClick={openProtectedCart} aria-label={t('header.bag', { count })}>
            <ShoppingBag size={19} />
            <AnimatePresence mode="popLayout">{count > 0 && <motion.span key={count} className="cart-count" initial={{ scale: .55, rotate: -12 }} animate={{ scale: [1, 1.28, 1], rotate: 0 }} exit={{ scale: 0 }} transition={{ duration: .34 }}>{count}</motion.span>}</AnimatePresence>
          </button>
        </div>
      </div>
    </header>
  );
}
