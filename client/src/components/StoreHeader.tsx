'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Heart, Menu, Moon, Search, ShoppingBag, Sun, UserRound, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cartCount, useCartStore } from '@/stores/cart';

const links = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Shop' },
  { href: '/about', label: 'Our story' },
  { href: '/contact', label: 'Journal' },
];

export function StoreHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const count = useCartStore(cartCount);
  const openCart = useCartStore((state) => state.open);

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

  return (
    <header className="store-header glass-bar">
      <div className="store-header__inner container-wide">
        <button className="icon-button nav-menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={menuOpen}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link href="/" className="wordmark" aria-label="MERS Tassel home">
          <span className="wordmark__seal">M</span>
          <span>MERS <i>Tassel</i></span>
        </Link>

        <nav className={menuOpen ? 'store-nav store-nav--open' : 'store-nav'} aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={pathname === link.href ? 'active' : ''} onClick={() => setMenuOpen(false)}>{link.label}</Link>
          ))}
          <Link className="admin-mobile-link" href="/admin">Atelier admin</Link>
        </nav>

        <div className="header-actions">
          <Link className="icon-button hide-mobile" href="/products?focus=search" aria-label="Search"><Search size={19} /></Link>
          <button className="icon-button hide-mobile" aria-label="Saved pieces"><Heart size={19} /></button>
          <button className="icon-button hide-mobile" onClick={toggleTheme} aria-label={`Use ${dark ? 'light' : 'dark'} theme`}>
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <Link className="icon-button hide-mobile" href="/login" aria-label="Your account"><UserRound size={19} /></Link>
          <button className="icon-button cart-button" onClick={openCart} aria-label={`Open bag with ${count} items`}>
            <ShoppingBag size={19} />
            <AnimatePresence mode="popLayout">{count > 0 && <motion.span key={count} className="cart-count" initial={{ scale: .55, rotate: -12 }} animate={{ scale: [1, 1.28, 1], rotate: 0 }} exit={{ scale: 0 }} transition={{ duration: .34 }}>{count}</motion.span>}</AnimatePresence>
          </button>
        </div>
      </div>
    </header>
  );
}
