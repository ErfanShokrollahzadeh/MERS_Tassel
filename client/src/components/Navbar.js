'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { lang, changeLanguage, t } = useLanguage();
  const { user, isAuthenticated, logout, loading } = useAuth();

  const navLinks = [
    { href: '/', label: 'nav.home' },
    { href: '/products', label: 'nav.products' },
    { href: '/about', label: 'nav.about' },
    { href: '/contact', label: 'nav.contact' },
  ];

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    router.push('/');
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return '?';
    const first = user.first_name?.[0] || '';
    const last = user.last_name?.[0] || '';
    return (first + last).toUpperCase() || user.username?.[0]?.toUpperCase() || '?';
  };

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

            {/* Auth: User Icon or Login Link */}
            {!loading && (
              <li className="nav-item me-2">
                {isAuthenticated ? (
                  <div className="nav-user-area" ref={dropdownRef}>
                    <button
                      className="nav-user-btn"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      aria-label="User menu"
                    >
                      <div className="nav-user-avatar">
                        {getUserInitials()}
                      </div>
                    </button>
                    <div className={`nav-user-dropdown ${dropdownOpen ? 'open' : ''}`}>
                      <div className="nav-user-dropdown-header">
                        <strong>{user?.first_name} {user?.last_name}</strong>
                        <span>@{user?.username}</span>
                      </div>
                      <div className="nav-user-dropdown-body">
                        <div className="nav-user-dropdown-divider" />
                        <button
                          className="nav-user-dropdown-item logout-item"
                          onClick={handleLogout}
                        >
                          <i className="fa-solid fa-right-from-bracket"></i>
                          {t('nav.logout')}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="nav-login-link"
                    onClick={() => setMobileOpen(false)}
                  >
                    <i className="fa-solid fa-user"></i>
                    {t('nav.login')}
                  </Link>
                )}
              </li>
            )}

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
