'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { t } = useLanguage();
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect
  if (isAuthenticated) {
    router.push('/');
    return null;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero Header */}
      <section className="page-header">
        <div className="floating-shape" style={{ width: 200, height: 200, top: '10%', right: '15%' }} />
        <div className="floating-shape" style={{ width: 120, height: 120, bottom: '20%', left: '10%' }} />
        <div className="container">
          <h1>{t('auth.login_title')}</h1>
          <p>{t('auth.login_subtitle')}</p>
        </div>
      </section>

      {/* Login Form */}
      <section className="section-mers">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-5 col-md-7">
              <div className="auth-card">
                <div className="auth-card-header">
                  <div className="auth-icon">
                    <i className="fa-solid fa-right-to-bracket"></i>
                  </div>
                  <h3>{t('auth.login_btn')}</h3>
                </div>

                {error && (
                  <div className="alert-mers error">
                    <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 8 }}></i>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="auth-field">
                    <label htmlFor="username">
                      <i className="fa-solid fa-user"></i>
                      {t('auth.username')}
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      placeholder={t('auth.username_ph')}
                      value={formData.username}
                      onChange={handleChange}
                      required
                      autoComplete="username"
                    />
                  </div>

                  <div className="auth-field">
                    <label htmlFor="password">
                      <i className="fa-solid fa-lock"></i>
                      {t('auth.password')}
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      placeholder={t('auth.password_ph')}
                      value={formData.password}
                      onChange={handleChange}
                      required
                      autoComplete="current-password"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-mers-primary auth-submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="auth-spinner"></span>
                        {t('auth.logging_in')}
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-arrow-right-to-bracket" style={{ marginRight: 8 }}></i>
                        {t('auth.login_btn')}
                      </>
                    )}
                  </button>
                </form>

                <div className="auth-footer">
                  <p>
                    {t('auth.no_account')}{' '}
                    <Link href="/signup">{t('nav.signup')}</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
