'use client';

import { useState, type FormEvent } from 'react';
import { ArrowRight, ArrowUpRight, Check, LoaderCircle } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { subscribeToNewsletter, type NewsletterSource } from '@/lib/newsletter';
import { useToastStore } from '@/stores/toast';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function NewsletterForm({ source, compact = false }: { source: NewsletterSource; compact?: boolean }) {
  const { t, locale } = useI18n();
  const showToast = useToastStore((state) => state.show);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const inputId = `${source}-newsletter-email`;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'submitting') return;

    setStatus('submitting');
    try {
      const subscription = await subscribeToNewsletter(email, locale, source);
      setStatus('success');
      showToast({
        tone: 'success',
        title: t('newsletter.successTitle'),
        message: subscription.alreadySubscribed ? t('newsletter.alreadyCopy') : t('newsletter.successCopy'),
      });
    } catch {
      setStatus('error');
      showToast({ tone: 'error', title: t('newsletter.errorTitle'), message: t('newsletter.errorCopy') });
    }
  };

  const feedback = status === 'success'
    ? t('newsletter.successCopy')
    : status === 'error'
      ? t('newsletter.errorCopy')
      : t('home.privacy');

  const buttonLabel = status === 'submitting'
    ? t('newsletter.submitting')
    : status === 'success'
      ? t('newsletter.joined')
      : compact
        ? t('footer.subscribe')
        : t('home.join');

  return (
    <form onSubmit={submit} className={`newsletter-form newsletter-form--${status}`}>
      <label className="sr-only" htmlFor={inputId}>{t('footer.email')}</label>
      <input
        id={inputId}
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => { setEmail(event.target.value); if (status !== 'idle') setStatus('idle'); }}
        placeholder={compact ? t('footer.email') : 'you@example.com'}
        disabled={status === 'submitting'}
        required
      />
      <button
        type="submit"
        className={compact ? undefined : 'button button--light'}
        aria-label={buttonLabel}
        disabled={status === 'submitting'}
      >
        {!compact && <span>{buttonLabel}</span>}
        {status === 'submitting'
          ? <LoaderCircle className="newsletter-form__spinner" size={compact ? 18 : 17} />
          : status === 'success'
            ? <Check size={compact ? 18 : 17} />
            : compact
              ? <ArrowUpRight size={18} />
              : <ArrowRight size={17} />}
      </button>
      {(!compact || status !== 'idle') && (
        <small className={`newsletter-form__feedback newsletter-form__feedback--${status}`} role="status">
          {feedback}
        </small>
      )}
    </form>
  );
}
