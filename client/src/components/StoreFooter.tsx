'use client';

import Link from 'next/link';
import { useI18n } from '@/i18n/I18nProvider';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { SocialContactLinks } from '@/components/SocialContactLinks';
import { useSiteSettings } from '@/lib/useSiteSettings';
import { NewsletterForm } from '@/components/NewsletterForm';

export function StoreFooter() {
  const { t } = useI18n();
  const { data: settings } = useSiteSettings();

  const siteName = settings?.siteName ?? 'MERS Tassel';

  return (
    <footer className="store-footer">
      <div className="container-wide footer-grid">
        <section className="footer-brand">
          <Link href="/" className="wordmark wordmark--footer"><span className="wordmark__seal">M</span><span>MERS <i>Tassel</i></span></Link>
          <p>{t('footer.tagline')}</p>
          <span className="footer-label footer-social-label">{t('footer.follow')}</span>
          <SocialContactLinks />
        </section>

        <nav className="footer-directory" aria-label={t('footer.navigation')}>
          <div className="footer-column"><span className="footer-label">{t('footer.explore')}</span><Link href="/products">{t('footer.shopAll')}</Link><Link href="/products?sort=new">{t('footer.new')}</Link><Link href="/about">{t('footer.atelier')}</Link></div>
          <div className="footer-column"><span className="footer-label">{t('footer.care')}</span><Link href="/contact">{t('footer.contact')}</Link><Link href="/shipping">{t('footer.shipping')}</Link><Link href="/returns">{t('footer.returns')}</Link><Link href="/care">{t('footer.jewelryCare')}</Link></div>
          <div className="footer-column"><span className="footer-label">{t('footer.privacy')}</span><Link href="/privacy">{t('footer.security')}</Link><Link href="/invest">{t('footer.invest')}</Link></div>
        </nav>

        <section className="footer-newsletter"><span className="footer-label">{t('footer.notes')}</span><p>{t('footer.notesCopy')}</p><NewsletterForm source="footer" compact /></section>
      </div>
      <div className="container-wide footer-bottom">
        <span>© {new Date().getFullYear()} {siteName}</span>
        <div className="footer-bottom__meta">
          <span>{t('footer.location')}</span>
          <span>{t('footer.rights')}</span>
          <LanguageSwitch />
        </div>
      </div>
    </footer>
  );
}
