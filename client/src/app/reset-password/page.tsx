'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { Suspense, useState, type FormEvent } from 'react';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { MediaImage } from '@/components/MediaImage';
import { useI18n } from '@/i18n/I18nProvider';
import { ApiError, resetPassword } from '@/lib/auth';
import { useSiteSettings } from '@/lib/useSiteSettings';
import { useToastStore } from '@/stores/toast';

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const email = params.get('email') || '';
  const token = params.get('token') || '';

  if (!email || !token) {
    return (
      <div className="auth-invalid" role="alert">
        <ShieldAlert aria-hidden="true" />
        <h1>{t('auth.invalidResetLink')}</h1>
        <p>{t('auth.invalidResetLinkCopy')}</p>
        <Link href="/forgot-password" className="button button--primary button--block">{t('auth.sendResetLink')} <ArrowRight /></Link>
      </div>
    );
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get('newPassword') || '');
    const confirmPassword = String(form.get('confirmPassword') || '');
    if (newPassword !== confirmPassword) return setError(t('auth.passwordsDoNotMatch'));
    if (newPassword.length < 8 || !/\d/.test(newPassword)) return setError(t('auth.passwordRejected'));

    setSubmitting(true);
    try {
      await resetPassword({ email, token, newPassword });
      useToastStore.getState().show({ tone: 'success', title: t('auth.resetSuccess') });
      router.replace('/login?reset=success');
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.fieldError('newPassword') || requestError.message : t('common.unexpected'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <span className="eyebrow">MERS Tassel</span>
      <h1>{t('auth.resetTitle')}</h1>
      <p>{t('auth.resetLede')}</p>
      <form onSubmit={onSubmit}>
        <label>{t('auth.newPassword')}<div><input name="newPassword" type={showPassword ? 'text' : 'password'} required minLength={8} autoComplete="new-password" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={t('auth.showPassword')}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
        <label>{t('auth.confirmPassword')}<input name="confirmPassword" type={showPassword ? 'text' : 'password'} required minLength={8} autoComplete="new-password" /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button type="submit" className="button button--primary button--block" disabled={submitting}>{submitting ? t('auth.resettingPassword') : t('auth.resetTitle')} <ArrowRight /></button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const art = useSiteSettings().data?.heroImagePath;
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
        <Suspense fallback={<p>{t('common.loadingShort')}</p>}><ResetPasswordForm /></Suspense>
      </main>
    </div>
  );
}
