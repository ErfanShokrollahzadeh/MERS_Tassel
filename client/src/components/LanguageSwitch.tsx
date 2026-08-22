'use client';

import { useRouter } from 'next/navigation';
import { useI18n, type Locale } from '@/i18n/I18nProvider';

export function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  const router = useRouter();
  const select = (next: Locale) => {
    if (next === locale) return;
    setLocale(next);
    // Server components (including localized metadata and product SEO copy) read the
    // locale cookie, so refresh their payload after the client preference is persisted.
    router.refresh();
  };
  return (
    <div className={`language-switch${compact ? ' language-switch--compact' : ''}`} role="group" aria-label={t('language.label')} translate="no">
      <button type="button" lang="en" aria-label={t('language.en')} className={locale === 'en' ? 'active' : ''} onClick={() => select('en')} aria-pressed={locale === 'en'}>EN</button>
      <i aria-hidden="true">/</i>
      <button type="button" lang="tr" aria-label={t('language.tr')} className={locale === 'tr' ? 'active' : ''} onClick={() => select('tr')} aria-pressed={locale === 'tr'}>TR</button>
    </div>
  );
}
