'use client';

import { Languages } from 'lucide-react';
import { useI18n, type Locale } from '@/i18n/I18nProvider';

export function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  const select = (next: Locale) => setLocale(next);
  return <div className={`language-switch${compact ? ' language-switch--compact' : ''}`} role="group" aria-label={t('language.label')}><Languages aria-hidden="true" /><button type="button" className={locale === 'en' ? 'active' : ''} onClick={() => select('en')} aria-pressed={locale === 'en'}>EN</button><i>/</i><button type="button" className={locale === 'tr' ? 'active' : ''} onClick={() => select('tr')} aria-pressed={locale === 'tr'}>TR</button></div>;
}
