'use client';

import Link from 'next/link';
import { ArrowUpRight, Camera } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { useSiteSettings } from '@/lib/useSiteSettings';

export function StoreFooter() {
  const { t } = useI18n();
  const { data: settings } = useSiteSettings();

  const siteName = settings?.siteName ?? 'MERS Tassel';
  const instagram = settings?.instagramUrl;
  const location = settings?.contactAddress;

  return (
    <footer className="store-footer">
      <div className="container-wide footer-grid">
        <div className="footer-brand">
          <Link href="/" className="wordmark wordmark--footer"><span className="wordmark__seal">M</span><span>MERS <i>Tassel</i></span></Link>
          <p>{t('footer.tagline')}</p>
        </div>
        <div><span className="footer-label">{t('footer.explore')}</span><Link href="/products">{t('footer.shopAll')}</Link><Link href="/products?sort=new">{t('footer.new')}</Link><Link href="/about">{t('footer.atelier')}</Link></div>
        <div><span className="footer-label">{t('footer.care')}</span><Link href="/contact">{t('footer.contact')}</Link><Link href="/contact">{t('footer.shipping')}</Link><Link href="/contact">{t('footer.jewelryCare')}</Link></div>
        <div className="footer-newsletter"><span className="footer-label">{t('footer.notes')}</span><p>{t('footer.notesCopy')}</p><form onSubmit={(event) => event.preventDefault()}><label className="sr-only" htmlFor="footer-email">{t('footer.email')}</label><input id="footer-email" type="email" placeholder={t('footer.email')} required /><button aria-label={t('footer.subscribe')}><ArrowUpRight size={18} /></button></form></div>
      </div>
      <div className="container-wide footer-bottom">
        <span>© {new Date().getFullYear()} {siteName}{location ? ` · ${location}` : ''}</span>
        <LanguageSwitch />
        {instagram && <a href={instagram} aria-label="Instagram" target="_blank" rel="noreferrer noopener"><Camera size={17} /></a>}
      </div>
    </footer>
  );
}
