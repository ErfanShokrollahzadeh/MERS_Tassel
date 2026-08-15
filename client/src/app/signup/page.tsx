'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { MediaImage } from '@/components/MediaImage';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { useI18n } from '@/i18n/I18nProvider';
import { ApiError, signup } from '@/lib/auth';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';

export default function SignupPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const setSession = useAuthStore((state) => state.setSession);
  const router = useRouter();
  const { t, locale } = useI18n();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const session = await signup({
        first_name: String(form.get('first_name') || ''),
        last_name: String(form.get('last_name') || ''),
        email: String(form.get('email') || ''),
        password: String(form.get('password') || ''),
      });
      setSession(session);
      await useCartStore.getState().load();
      router.replace('/products');
    } catch (requestError) {
      setError(locale === 'tr' ? t('auth.signupError') : requestError instanceof ApiError ? requestError.message : t('auth.signupError'));
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="auth-page"><div className="auth-visual auth-visual--signup"><MediaImage src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1400&q=88" alt="Gold jewelry in the atelier" sizes="55vw" priority /><Link href="/" className="wordmark wordmark--footer"><span className="wordmark__seal">M</span><span>MERS <i>Tassel</i></span></Link><blockquote>{t('auth.signupQuote')}</blockquote></div><main className="auth-form"><div className="auth-language"><LanguageSwitch /></div><Link href="/" className="auth-mobile-brand">MERS <i>Tassel</i></Link><span className="eyebrow">{t('auth.join')}</span><h1>{t('auth.begin1')}<br />{t('auth.begin2')}</h1><p>{t('auth.signupCopy')}</p><form onSubmit={onSubmit}><div className="auth-name-row"><label>{t('auth.first')}<input name="first_name" required autoComplete="given-name" /></label><label>{t('auth.last')}<input name="last_name" required autoComplete="family-name" /></label></div><label>{t('checkout.email')}<input name="email" type="email" required autoComplete="email" /></label><label>{t('auth.password')}<input name="password" type="password" required minLength={8} autoComplete="new-password" /></label><label className="auth-consent"><input type="checkbox" /> {t('auth.consent')}</label>{error && <p className="auth-error" role="alert">{error}</p>}<button type="submit" className="button button--primary button--block" disabled={submitting}>{submitting ? t('auth.creating') : t('auth.createAccount')} <ArrowRight /></button></form><span className="auth-switch">{t('auth.already')} <Link href="/login">{t('auth.signIn')}</Link></span></main></div>;
}
