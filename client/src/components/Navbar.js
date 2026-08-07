'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
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
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="nav-item ms-lg-3">
              <Link
                href="/products"
                className="btn btn-mers-primary btn-sm"
                style={{ padding: '10px 28px', fontSize: '0.9rem' }}
              >
                ✨ Shop Now
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
