'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { MediaImage } from '@/components/MediaImage';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { useI18n } from '@/i18n/I18nProvider';
import { ApiError, login } from '@/lib/auth';
import { useSiteSettings } from '@/lib/useSiteSettings';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';

/** Only same-origin paths are honoured, so `?next=` cannot be used as an open redirect. */
function safeDestination() {
  const requested = new URLSearchParams(window.location.search).get('next');
  return requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/account';
}

export default function LoginPage() {
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const setSession = useAuthStore((state) => state.setSession);
  const router = useRouter();
  const { t } = useI18n();
  const settings = useSiteSettings();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    const form = new FormData(event.currentTarget);
    try {
      const session = await login({
        email: String(form.get('email') || ''),
        password: String(form.get('password') || ''),
      });
      setSession(session);
      await useCartStore.getState().load();
      router.replace(safeDestination());
    } catch (requestError) {
      setError(
        requestError instanceof ApiError && requestError.status === 0
          ? t('auth.connectionError')
          : requestError instanceof ApiError && requestError.code === 'locked_out'
            ? t('auth.locked')
            : t('auth.loginError'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const art = settings.data?.heroImagePath;

  return (
    <div className="auth-page">
      <div className="auth-visual">
        {art ? <MediaImage src={art} alt={t('common.jewelryAlt')} sizes="55vw" priority /> : <span className="skeleton-block auth-visual__placeholder" />}
        <Link href="/" className="wordmark wordmark--footer"><span className="wordmark__seal">M</span><span>MERS <i>Tassel</i></span></Link>
        <blockquote>{t('auth.loginQuote')}</blockquote>
      </div>
      <main className="auth-form">
        <div className="auth-language"><LanguageSwitch /></div>
        <Link href="/" className="auth-mobile-brand">MERS <i>Tassel</i></Link>
        <span className="eyebrow">{t('auth.welcome')}</span>
        <h1>{t('auth.await1')}<br />{t('auth.await2')}</h1>
        <p>{t('auth.loginCopy')}</p>
        <form onSubmit={onSubmit}>
          <label>{t('checkout.email')}<input name="email" type="email" required autoComplete="email" /></label>
          <label>{t('auth.password')}<div><input name="password" type={show ? 'text' : 'password'} required autoComplete="current-password" /><button type="button" onClick={() => setShow(!show)} aria-label={t('auth.showPassword')}>{show ? <EyeOff /> : <Eye />}</button></div></label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <div className="auth-options"><label><input type="checkbox" /> {t('auth.remember')}</label><a href="#">{t('auth.forgot')}</a></div>
          <button type="submit" className="button button--primary button--block" disabled={submitting}>{submitting ? t('auth.signingIn') : t('auth.signIn')} <ArrowRight /></button>
        </form>
        <span className="auth-switch">{t('auth.new')} <Link href="/signup">{t('auth.create')}</Link></span>
      </main>
    </div>
  );
}
