'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { MediaImage } from '@/components/MediaImage';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { useI18n } from '@/i18n/I18nProvider';
import { ApiError, signup } from '@/lib/auth';
import { useSiteSettings } from '@/lib/useSiteSettings';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';

export default function SignupPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const setSession = useAuthStore((state) => state.setSession);
  const router = useRouter();
  const { t } = useI18n();
  const settings = useSiteSettings();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    try {
      const session = await signup({
        firstName: String(form.get('firstName') || ''),
        lastName: String(form.get('lastName') || ''),
        email: String(form.get('email') || ''),
        password: String(form.get('password') || ''),
      });
      setSession(session);
      await useCartStore.getState().load();
      router.replace('/account');
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        if (requestError.status === 0) {
          setError(t('auth.connectionError'));
        } else {
          // Server-side field errors bind straight onto the inputs.
          setFieldErrors(requestError.errors ?? {});
          setError(requestError.errors ? '' : requestError.message);
        }
      } else {
        setError(t('auth.signupError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const art = settings.data?.heroImagePath;
  const fieldError = (name: string) => fieldErrors[name]?.[0];

  return (
    <div className="auth-page">
      <div className="auth-visual auth-visual--signup">
        {art ? <MediaImage src={art} alt="Gold jewelry in the atelier" sizes="55vw" priority /> : <span className="skeleton-block auth-visual__placeholder" />}
        <Link href="/" className="wordmark wordmark--footer"><span className="wordmark__seal">M</span><span>MERS <i>Tassel</i></span></Link>
        <blockquote>{t('auth.signupQuote')}</blockquote>
      </div>
      <main className="auth-form">
        <div className="auth-language"><LanguageSwitch /></div>
        <Link href="/" className="auth-mobile-brand">MERS <i>Tassel</i></Link>
        <span className="eyebrow">{t('auth.join')}</span>
        <h1>{t('auth.begin1')}<br />{t('auth.begin2')}</h1>
        <p>{t('auth.signupCopy')}</p>
        <form onSubmit={onSubmit}>
          <div className="auth-name-row">
            <label>{t('auth.first')}<input name="firstName" required autoComplete="given-name" />{fieldError('firstName') && <small role="alert">{fieldError('firstName')}</small>}</label>
            <label>{t('auth.last')}<input name="lastName" required autoComplete="family-name" />{fieldError('lastName') && <small role="alert">{fieldError('lastName')}</small>}</label>
          </div>
          <label>{t('checkout.email')}<input name="email" type="email" required autoComplete="email" />{fieldError('email') && <small role="alert">{fieldError('email')}</small>}</label>
          <label>{t('auth.password')}<input name="password" type="password" required minLength={8} autoComplete="new-password" />{fieldError('password') && <small role="alert">{fieldError('password')}</small>}</label>
          <label className="auth-consent"><input type="checkbox" /> {t('auth.consent')}</label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button type="submit" className="button button--primary button--block" disabled={submitting}>{submitting ? t('auth.creating') : t('auth.createAccount')} <ArrowRight /></button>
        </form>
        <span className="auth-switch">{t('auth.already')} <Link href="/login">{t('auth.signIn')}</Link></span>
      </main>
    </div>
  );
}
