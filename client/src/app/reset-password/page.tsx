'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Check, Eye, EyeOff, ShieldAlert } from 'lucide-react';
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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    if (newPassword !== confirmPassword) return setError(t('auth.passwordsDoNotMatch'));
    if (newPassword.length < 8 || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) return setError(t('auth.resetRequirementsCopy'));

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

  const requirements = [
    { label: t('auth.passwordLength'), met: newPassword.length >= 8 },
    { label: t('auth.passwordLetter'), met: /[a-z]/.test(newPassword) },
    { label: t('auth.passwordNumber'), met: /\d/.test(newPassword) },
    { label: t('auth.passwordsMatch'), met: confirmPassword.length > 0 && newPassword === confirmPassword },
  ];
  const ready = requirements.every((requirement) => requirement.met);

  return (
    <>
      <span className="eyebrow">MERS Tassel</span>
      <h1>{t('auth.resetTitle')}</h1>
      <p>{t('auth.resetRequirementsCopy')}</p>
      <form className="auth-reset-form" onSubmit={onSubmit}>
        <label htmlFor="new-password">{t('auth.newPassword')}<div className="auth-password-input"><input id="new-password" name="newPassword" type={showPassword ? 'text' : 'password'} required minLength={8} maxLength={128} autoComplete="new-password" aria-describedby="password-requirements" value={newPassword} onChange={(event) => { setNewPassword(event.target.value); setError(''); }} /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-pressed={showPassword} aria-label={t(showPassword ? 'auth.hidePassword' : 'auth.showPassword')}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
        <label htmlFor="confirm-password">{t('auth.confirmPassword')}<div className="auth-password-input"><input id="confirm-password" name="confirmPassword" type={showConfirmation ? 'text' : 'password'} required minLength={8} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setError(''); }} /><button type="button" onClick={() => setShowConfirmation((current) => !current)} aria-pressed={showConfirmation} aria-label={t(showConfirmation ? 'auth.hidePassword' : 'auth.showPassword')}>{showConfirmation ? <EyeOff /> : <Eye />}</button></div></label>
        <ul id="password-requirements" className="password-requirements" aria-label={t('auth.passwordRequirements')}>
          {requirements.map((requirement) => <li className={requirement.met ? 'is-met' : ''} key={requirement.label}><Check aria-hidden="true" />{requirement.label}</li>)}
        </ul>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button type="submit" className="button button--primary button--block" disabled={submitting || !ready}>{submitting ? t('auth.resettingPassword') : t('auth.resetTitle')} <ArrowRight /></button>
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
      <main className="auth-form auth-form--recovery">
        <div className="auth-recovery-nav"><Link href="/" className="auth-mobile-brand">MERS <i>Tassel</i></Link><LanguageSwitch /></div>
        <div className="auth-recovery-content"><Suspense fallback={<div className="auth-reset-loading"><span className="skeleton-block" /><span className="skeleton-block" /><p>{t('common.loadingShort')}</p></div>}><ResetPasswordForm /></Suspense></div>
      </main>
    </div>
  );
}
