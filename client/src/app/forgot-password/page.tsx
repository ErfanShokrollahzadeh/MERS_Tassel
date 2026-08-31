'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, MailCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { MediaImage } from '@/components/MediaImage';
import { useI18n } from '@/i18n/I18nProvider';
import { ApiError, forgotPassword } from '@/lib/auth';
import { useSiteSettings } from '@/lib/useSiteSettings';

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { t } = useI18n();
  const art = useSiteSettings().data?.heroImagePath;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    const email = String(new FormData(event.currentTarget).get('email') || '');
    try {
      await forgotPassword({ email });
      setSent(true);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : t('common.unexpected'));
    } finally {
      setSubmitting(false);
    }
  };

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
        {sent ? (
          <div className="auth-confirmation" role="status">
            <MailCheck aria-hidden="true" />
            <span className="eyebrow">MERS Tassel</span>
            <h1>{t('auth.resetLinkSent')}</h1>
            <p>{t('auth.resetLinkSentCopy')}</p>
            <Link href="/login" className="button button--primary button--block"><ArrowLeft /> {t('auth.backToLogin')}</Link>
          </div>
        ) : (
          <>
            <span className="eyebrow">MERS Tassel</span>
            <h1>{t('auth.forgotTitle')}</h1>
            <p>{t('auth.forgotLede')}</p>
            <form onSubmit={onSubmit}>
              <label>{t('checkout.email')}<input name="email" type="email" required autoComplete="email" /></label>
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button type="submit" className="button button--primary button--block" disabled={submitting}>{submitting ? t('auth.sendingLink') : t('auth.sendResetLink')} <ArrowRight /></button>
            </form>
            <span className="auth-switch"><Link href="/login">← {t('auth.backToLogin')}</Link></span>
          </>
        )}
      </main>
    </div>
  );
}
