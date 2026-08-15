'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ArrowRight, LockKeyhole, ShieldAlert } from 'lucide-react';
import { ApiError, login } from '@/lib/auth';
import { useAuthStore } from '@/stores/auth';

function safeDestination() {
  const requested = new URLSearchParams(window.location.search).get('next');
  return requested?.startsWith('/admin') && !requested.startsWith('//') ? requested : '/admin';
}

export default function AdminLoginPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const router = useRouter();

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

      // Authenticating is not enough — this workspace is for administrators only.
      if (session.user.role !== 'admin') {
        clearSession();
        setError('This account does not have workspace access.');
        return;
      }

      setSession(session);
      router.replace(safeDestination());
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.status === 0
            ? 'The atelier service is not responding. Start the API and try again.'
            : requestError.message
          : 'Sign in could not be completed.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__panel glass-panel">
        <Link href="/" className="wordmark"><span className="wordmark__seal">M</span><span>MERS <i>Tassel</i></span></Link>
        <span className="admin-kicker">Atelier workspace</span>
        <h1>Sign in to continue</h1>
        <p>Manage the catalog, orders and storefront settings.</p>

        <form onSubmit={onSubmit}>
          <label>Email address<input name="email" type="email" required autoComplete="email" autoFocus /></label>
          <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
          {error && <p className="auth-error" role="alert"><ShieldAlert size={15} /> {error}</p>}
          <button type="submit" className="admin-button admin-button--primary admin-button--block" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'} <ArrowRight size={16} />
          </button>
        </form>

        <p className="admin-login__note"><LockKeyhole size={13} /> Administrator access only. Storefront accounts sign in at <Link href="/login">the shop</Link>.</p>
      </div>
    </div>
  );
}
