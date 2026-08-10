'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

export default function SignupPage() {
  const { t } = useLanguage();
  const { signup, isAuthenticated } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    password2: '',
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

  // Simple password strength: 0–4
  const getPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strengthScore = getPasswordStrength(formData.password);
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', '#E74C3C', '#F39C12', '#3498DB', '#4CAF50'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (formData.password !== formData.password2) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await signup(formData);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
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
          <h1>{t('auth.signup_title')}</h1>
          <p>{t('auth.signup_subtitle')}</p>
        </div>
      </section>

      {/* Signup Form */}
      <section className="section-mers">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6 col-md-8">
              <div className="auth-card">
                <div className="auth-card-header">
                  <div className="auth-icon">
                    <i className="fa-solid fa-user-plus"></i>
                  </div>
                  <h3>{t('auth.signup_btn')}</h3>
                </div>

                {error && (
                  <div className="alert-mers error">
                    <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 8 }}></i>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Name Row */}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="auth-field">
                        <label htmlFor="first_name">
                          <i className="fa-solid fa-user"></i>
                          {t('auth.first_name')}
                        </label>
                        <input
                          type="text"
                          id="first_name"
                          name="first_name"
                          placeholder={t('auth.first_name_ph')}
                          value={formData.first_name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="auth-field">
                        <label htmlFor="last_name">
                          <i className="fa-solid fa-user"></i>
                          {t('auth.last_name')}
                        </label>
                        <input
                          type="text"
                          id="last_name"
                          name="last_name"
                          placeholder={t('auth.last_name_ph')}
                          value={formData.last_name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="auth-field">
                    <label htmlFor="username">
                      <i className="fa-solid fa-at"></i>
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
                    <label htmlFor="email">
                      <i className="fa-solid fa-envelope"></i>
                      {t('auth.email')}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder={t('auth.email_ph')}
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
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
                      autoComplete="new-password"
                    />
                    {/* Password strength bar */}
                    {formData.password && (
                      <div className="password-strength">
                        <div className="password-strength-bar">
                          <div
                            className="password-strength-fill"
                            style={{
                              width: `${(strengthScore / 4) * 100}%`,
                              backgroundColor: strengthColors[strengthScore],
                            }}
                          />
                        </div>
                        <span
                          className="password-strength-label"
                          style={{ color: strengthColors[strengthScore] }}
                        >
                          {strengthLabels[strengthScore]}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="auth-field">
                    <label htmlFor="password2">
                      <i className="fa-solid fa-shield-halved"></i>
                      {t('auth.password2')}
                    </label>
                    <input
                      type="password"
                      id="password2"
                      name="password2"
                      placeholder={t('auth.password2_ph')}
                      value={formData.password2}
                      onChange={handleChange}
                      required
                      autoComplete="new-password"
                    />
                    {formData.password2 && formData.password !== formData.password2 && (
                      <span className="auth-field-error">
                        <i className="fa-solid fa-circle-xmark"></i> Passwords do not match
                      </span>
                    )}
                    {formData.password2 && formData.password === formData.password2 && (
                      <span className="auth-field-success">
                        <i className="fa-solid fa-circle-check"></i> Passwords match
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-mers-primary auth-submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="auth-spinner"></span>
                        {t('auth.signing_up')}
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-sparkles" style={{ marginRight: 8 }}></i>
                        {t('auth.signup_btn')}
                      </>
                    )}
                  </button>
                </form>

                <div className="auth-footer">
                  <p>
                    {t('auth.have_account')}{' '}
                    <Link href="/login">{t('nav.login')}</Link>
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
