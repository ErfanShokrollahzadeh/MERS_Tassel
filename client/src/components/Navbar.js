'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const { lang, changeLanguage, t } = useLanguage();

  const navLinks = [
    { href: '/', label: 'nav.home' },
    { href: '/products', label: 'nav.products' },
    { href: '/about', label: 'nav.about' },
    { href: '/contact', label: 'nav.contact' },
  ];

  return (
    <nav className={`navbar navbar-expand-lg navbar-mers ${scrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <Link href="/" className="navbar-brand navbar-brand-mers">
          MERS <span>Tassel</span>
        </Link>

        <button
          className="navbar-toggler border-0"
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          <span style={{ fontSize: '1.5rem', color: 'var(--deep-plum)' }}>
            {mobileOpen ? '✕' : '☰'}
          </span>
        </button>

        <div className={`collapse navbar-collapse ${mobileOpen ? 'show' : ''}`}>
          <ul className="navbar-nav ms-auto align-items-center">
            {navLinks.map((link) => (
              <li className="nav-item" key={link.href}>
                <Link
                  href={link.href}
                  className={`nav-link nav-link-mers ${pathname === link.href ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {t(link.label)}
                </Link>
              </li>
            ))}
            
            {/* Language Toggle */}
            <li className="nav-item ms-lg-3 d-flex align-items-center me-3" style={{ cursor: 'pointer' }}>
              <div 
                className="d-flex align-items-center" 
                onClick={() => changeLanguage(lang === 'en' ? 'tr' : 'en')}
                style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  padding: '6px 12px', 
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <span style={{ fontSize: '1.2rem', marginRight: '6px' }}>
                  {lang === 'en' ? '🇬🇧' : '🇹🇷'}
                </span>
                <span style={{ fontWeight: '600', color: 'var(--deep-plum)' }}>
                  {lang === 'en' ? 'EN' : 'TR'}
                </span>
              </div>
            </li>

            <li className="nav-item">
              <Link
                href="/products"
                className="btn btn-mers-primary btn-sm"
                style={{ padding: '10px 28px', fontSize: '0.9rem' }}
              >
                {t('nav.shop_now')}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
