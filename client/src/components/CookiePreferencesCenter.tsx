'use client';

import Link from 'next/link';
import { Check, Cookie, ShieldCheck, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import {
  OPEN_COOKIE_SETTINGS_EVENT,
  readCookiePreferences,
  saveCookiePreferences,
  type CookiePreferences,
} from '@/lib/cookiePreferences';

const copy = {
  en: {
    bannerLabel: 'Your privacy choices',
    bannerTitle: 'Cookies, with your permission.',
    bannerCopy: 'We use necessary storage for security, language, accounts, and shopping. Analytics and marketing stay off unless you allow them.',
    necessaryOnly: 'Necessary only', acceptAll: 'Accept all', manage: 'Manage choices', policy: 'Cookie Policy',
    settingsLabel: 'Privacy controls', settingsTitle: 'Cookie settings',
    settingsCopy: 'Choose which optional technologies this device may use. You can return here from the footer at any time.',
    necessary: 'Strictly necessary', necessaryCopy: 'Required for security, sign-in, language, saved bag, checkout, and remembering this choice.', alwaysOn: 'Always on',
    analytics: 'Analytics', analyticsCopy: 'Helps us understand site performance and improve the shopping experience when enabled.',
    marketing: 'Marketing', marketingCopy: 'Supports campaign measurement and personalized promotions when enabled.',
    save: 'Save choices', close: 'Close cookie settings', saved: 'Your preferences are saved on this device.',
  },
  tr: {
    bannerLabel: 'Gizlilik seçimleriniz',
    bannerTitle: 'Çerezler, izninizle.',
    bannerCopy: 'Güvenlik, dil, hesap ve alışveriş için gerekli depolamayı kullanırız. Analiz ve pazarlama siz izin vermedikçe kapalı kalır.',
    necessaryOnly: 'Yalnızca gerekli', acceptAll: 'Tümünü kabul et', manage: 'Seçimleri yönet', policy: 'Çerez Politikası',
    settingsLabel: 'Gizlilik kontrolleri', settingsTitle: 'Çerez ayarları',
    settingsCopy: 'Bu cihazda hangi isteğe bağlı teknolojilerin kullanılabileceğini seçin. Alt bilgiden istediğiniz zaman buraya dönebilirsiniz.',
    necessary: 'Kesinlikle gerekli', necessaryCopy: 'Güvenlik, giriş, dil, kayıtlı çanta, ödeme ve bu seçimi hatırlamak için gereklidir.', alwaysOn: 'Her zaman açık',
    analytics: 'Analiz', analyticsCopy: 'Etkinleştirildiğinde site performansını anlamamıza ve alışveriş deneyimini iyileştirmemize yardımcı olur.',
    marketing: 'Pazarlama', marketingCopy: 'Etkinleştirildiğinde kampanya ölçümünü ve kişiselleştirilmiş tanıtımları destekler.',
    save: 'Seçimleri kaydet', close: 'Çerez ayarlarını kapat', saved: 'Tercihleriniz bu cihazda kaydedildi.',
  },
} as const;

export function CookiePreferencesCenter() {
  const { locale } = useI18n();
  const text = copy[locale];
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    const saved = readCookiePreferences();
    setPreferences(saved);
    setAnalytics(saved?.analytics ?? false);
    setMarketing(saved?.marketing ?? false);
    setMounted(true);
  }, []);

  useEffect(() => {
    const open = () => {
      const saved = readCookiePreferences();
      setAnalytics(saved?.analytics ?? false);
      setMarketing(saved?.marketing ?? false);
      setShowSaved(false);
      setSettingsOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    const previous = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setSettingsOpen(false); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [settingsOpen]);

  const commit = (next: { analytics: boolean; marketing: boolean }, announce = false) => {
    const saved = saveCookiePreferences(next);
    setPreferences(saved);
    setAnalytics(saved.analytics);
    setMarketing(saved.marketing);
    setShowSaved(announce);
    if (!announce) setSettingsOpen(false);
  };

  if (!mounted) return null;

  return (
    <>
      {!preferences && !settingsOpen && (
        <section className="cookie-banner" aria-label={text.bannerLabel}>
          <div className="cookie-banner__icon" aria-hidden="true"><Cookie /></div>
          <div className="cookie-banner__copy"><span>{text.bannerLabel}</span><h2>{text.bannerTitle}</h2><p>{text.bannerCopy} <Link href="/cookies">{text.policy}</Link></p></div>
          <div className="cookie-banner__actions">
            <button type="button" className="cookie-button cookie-button--quiet" onClick={() => commit({ analytics: false, marketing: false })}>{text.necessaryOnly}</button>
            <button type="button" className="cookie-button cookie-button--primary" onClick={() => commit({ analytics: true, marketing: true })}>{text.acceptAll}</button>
            <button type="button" className="cookie-manage" onClick={() => setSettingsOpen(true)}>{text.manage}</button>
          </div>
        </section>
      )}

      {settingsOpen && (
        <div className="cookie-modal" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setSettingsOpen(false); }}>
          <section className="cookie-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <header>
              <div className="cookie-dialog__mark" aria-hidden="true"><Cookie /></div>
              <div><span>{text.settingsLabel}</span><h2 id={titleId}>{text.settingsTitle}</h2></div>
              <button type="button" className="cookie-dialog__close" aria-label={text.close} onClick={() => setSettingsOpen(false)}><X /></button>
            </header>
            <p className="cookie-dialog__intro">{text.settingsCopy} <Link href="/cookies">{text.policy}</Link></p>
            <div className="cookie-options">
              <article className="cookie-option">
                <div><ShieldCheck aria-hidden="true" /><span><strong>{text.necessary}</strong><small>{text.necessaryCopy}</small></span></div>
                <em><Check />{text.alwaysOn}</em>
              </article>
              <label className="cookie-option">
                <span><strong>{text.analytics}</strong><small>{text.analyticsCopy}</small></span>
                <input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} />
                <i aria-hidden="true" />
              </label>
              <label className="cookie-option">
                <span><strong>{text.marketing}</strong><small>{text.marketingCopy}</small></span>
                <input type="checkbox" checked={marketing} onChange={(event) => setMarketing(event.target.checked)} />
                <i aria-hidden="true" />
              </label>
            </div>
            {showSaved && <p className="cookie-dialog__saved" role="status"><Check />{text.saved}</p>}
            <footer>
              <button type="button" className="cookie-button cookie-button--quiet" onClick={() => commit({ analytics: false, marketing: false }, true)}>{text.necessaryOnly}</button>
              <button type="button" className="cookie-button cookie-button--primary" onClick={() => { commit({ analytics, marketing }); }}>{text.save}</button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
