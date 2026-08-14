'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MediaImage } from '@/components/MediaImage';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { useI18n } from '@/i18n/I18nProvider';

export default function SignupPage() {
  const { t } = useI18n();
  return <div className="auth-page"><div className="auth-visual auth-visual--signup"><MediaImage src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1400&q=88" alt="Gold jewelry in the atelier" sizes="55vw" priority /><Link href="/" className="wordmark wordmark--footer"><span className="wordmark__seal">M</span><span>MERS <i>Tassel</i></span></Link><blockquote>{t('auth.signupQuote')}</blockquote></div><main className="auth-form"><div className="auth-language"><LanguageSwitch /></div><Link href="/" className="auth-mobile-brand">MERS <i>Tassel</i></Link><span className="eyebrow">{t('auth.join')}</span><h1>{t('auth.begin1')}<br />{t('auth.begin2')}</h1><p>{t('auth.signupCopy')}</p><form onSubmit={(event) => event.preventDefault()}><div className="auth-name-row"><label>{t('auth.first')}<input required autoComplete="given-name" /></label><label>{t('auth.last')}<input required autoComplete="family-name" /></label></div><label>{t('checkout.email')}<input type="email" required autoComplete="email" /></label><label>{t('auth.password')}<input type="password" required minLength={8} autoComplete="new-password" /></label><label className="auth-consent"><input type="checkbox" /> {t('auth.consent')}</label><Link href="/products" className="button button--primary button--block">{t('auth.createAccount')} <ArrowRight /></Link></form><span className="auth-switch">{t('auth.already')} <Link href="/login">{t('auth.signIn')}</Link></span></main></div>;
}
