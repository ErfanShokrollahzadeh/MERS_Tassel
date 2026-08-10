'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="footer-mers">
      <div className="container">
        <div className="row g-4">
          {/* Brand Column */}
          <div className="col-lg-4 col-md-6">
            <span className="footer-brand">
              MERS <span>Tassel</span>
            </span>
            <p className="footer-description">
              {t('footer.brand_desc')}
            </p>
            <div className="footer-social">
              <a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a>
              <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook"></i></a>
              <a href="#" aria-label="X (Twitter)"><i className="fa-brands fa-x-twitter"></i></a>
              <a href="#" aria-label="Pinterest"><i className="fa-brands fa-pinterest"></i></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-2 col-md-6">
            <h5 className="footer-title">{t('footer.quick_links')}</h5>
            <ul className="footer-links">
              <li><Link href="/">{t('nav.home')}</Link></li>
              <li><Link href="/products">{t('nav.products')}</Link></li>
              <li><Link href="/about">{t('nav.about')}</Link></li>
              <li><Link href="/contact">{t('nav.contact')}</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="col-lg-3 col-md-6">
            <h5 className="footer-title">{t('footer.categories')}</h5>
            <ul className="footer-links">
              <li><Link href="/products?category=necklaces">{t('category.necklaces')}</Link></li>
              <li><Link href="/products?category=pendants">{t('category.pendants')}</Link></li>
              <li><Link href="/products?category=bag-accessories">{t('category.bag-accessories')}</Link></li>
              <li><Link href="/products?category=keychains">{t('category.keychains')}</Link></li>
              <li><Link href="/products?category=prayer-beads">{t('category.prayer-beads')}</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-lg-3 col-md-6">
            <h5 className="footer-title">{t('footer.contact_us')}</h5>
            <ul className="footer-links">
              <li>📍 Turkey</li>
              <li>📧 hello@merstassel.com</li>
              <li>📱 +90 555 123 4567</li>
              <li>🕐 : 7/24 Support</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p>
            © {currentYear} {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
