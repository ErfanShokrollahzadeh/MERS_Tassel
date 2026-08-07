'use client';

import { useState } from 'react';
import AnimatedSection from '@/components/AnimatedSection';
import { submitContactForm } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ContactPage() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await submitContactForm(formData);
      setStatus({
        type: 'success',
        message: response.message || 'Thank you! Your message has been sent successfully. We\'ll get back to you soon! 💖',
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Sorry, something went wrong. Please try again or email us directly.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <div className="page-header">
        <div className="floating-shape" style={{ width: 220, height: 220, top: '8%', left: '8%', animation: 'float 7s ease-in-out infinite' }}></div>
        <div className="floating-shape" style={{ width: 160, height: 160, bottom: '8%', right: '12%', animation: 'float 5s ease-in-out infinite reverse' }}></div>
        <div className="container">
          <h1>{t('contact.title')}</h1>
          <p>{t('contact.subtitle')}</p>
        </div>
      </div>

      <section className="section-mers">
        <div className="container">
          <div className="row g-5">
            {/* Contact Info Sidebar */}
            <div className="col-lg-5">
              <AnimatedSection>
                <div className="contact-info-card">
                  <h3>{t('contact.get_in_touch')}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '35px', fontSize: '1.05rem' }}>
                    {t('contact.get_in_touch_desc')}
                  </p>

                  <div className="contact-info-item">
                    <span className="icon">📍</span>
                    <div>
                      <strong>{t('contact.visit_us')}</strong>
                      <p style={{ whiteSpace: 'pre-line' }}>{t('contact.visit_us_desc')}</p>
                    </div>
                  </div>
                  <div className="contact-info-item">
                    <span className="icon">📧</span>
                    <div>
                      <strong>{t('contact.email_us')}</strong>
                      <p style={{ whiteSpace: 'pre-line' }}>hello@merstassel.com{'\n'}support@merstassel.com</p>
                    </div>
                  </div>
                  <div className="contact-info-item">
                    <span className="icon">📱</span>
                    <div>
                      <strong>{t('contact.call_us')}</strong>
                      <p style={{ whiteSpace: 'pre-line' }}>{t('contact.call_us_desc')}</p>
                    </div>
                  </div>
                  <div className="contact-info-item">
                    <span className="icon">💬</span>
                    <div>
                      <strong>{t('contact.social')}</strong>
                      <p style={{ whiteSpace: 'pre-line' }}>@merstassel on Instagram{'\n'}MERS Tassel on Facebook</p>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div style={{ marginTop: '30px', paddingTop: '30px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '12px', fontWeight: 500 }}>{t('contact.follow_us')}</p>
                    <div className="footer-social">
                      <a href="#" aria-label="Instagram" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'var(--white)' }}>📷</a>
                      <a href="#" aria-label="Facebook" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'var(--white)' }}>📘</a>
                      <a href="#" aria-label="Twitter" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'var(--white)' }}>🐦</a>
                      <a href="#" aria-label="Pinterest" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'var(--white)' }}>📌</a>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>

            {/* Contact Form */}
            <div className="col-lg-7">
              <AnimatedSection delay={200}>
                <div style={{
                  background: 'var(--white)',
                  borderRadius: 'var(--radius-md)',
                  padding: '50px 40px',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid rgba(183,110,121,0.08)',
                }}>
                  <h3 style={{ marginBottom: '8px' }}>{t('contact.send_message')}</h3>
                  <p style={{ marginBottom: '30px', color: 'var(--gray-500)' }}>
                    {t('contact.send_message_desc')}
                  </p>

                  {/* Status Messages */}
                  {status.message && (
                    <div className={`alert-mers ${status.type} mb-4`}>
                      {status.message}
                    </div>
                  )}

                  <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">{t('contact.form.name')}</label>
                        <input
                          type="text"
                          name="name"
                          className="form-control"
                          placeholder={t('contact.form.name_ph')}
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">{t('contact.form.email')}</label>
                        <input
                          type="email"
                          name="email"
                          className="form-control"
                          placeholder="e.g. ayse@email.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">{t('contact.form.subject')}</label>
                        <input
                          type="text"
                          name="subject"
                          className="form-control"
                          placeholder={t('contact.form.subject_ph')}
                          value={formData.subject}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">{t('contact.form.message')}</label>
                        <textarea
                          name="message"
                          className="form-control"
                          rows="6"
                          placeholder={t('contact.form.message_ph')}
                          value={formData.message}
                          onChange={handleChange}
                          required
                        ></textarea>
                      </div>
                      <div className="col-12">
                        <button
                          type="submit"
                          className="btn-mers-primary w-100"
                          disabled={submitting}
                          style={{ padding: '16px', fontSize: '1.05rem' }}
                        >
                          {submitting ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              {t('contact.form.sending')}
                            </>
                          ) : (
                            t('contact.form.submit')
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-mers bg-soft">
        <div className="container">
          <AnimatedSection>
            <div className="section-title">
              <h2>{t('contact.faq.title')}</h2>
              <p>{t('contact.faq.subtitle')}</p>
            </div>
          </AnimatedSection>

          <div className="row justify-content-center">
            <div className="col-lg-8">
              {[
                { q: t('contact.faq.1.q'), a: t('contact.faq.1.a') },
                { q: t('contact.faq.2.q'), a: t('contact.faq.2.a') },
                { q: t('contact.faq.3.q'), a: t('contact.faq.3.a') },
                { q: t('contact.faq.4.q'), a: t('contact.faq.4.a') },
              ].map((faq, index) => (
                <AnimatedSection key={index} delay={index * 100}>
                  <div style={{
                    background: 'var(--white)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '28px 32px',
                    marginBottom: '16px',
                    boxShadow: 'var(--shadow-sm)',
                    borderLeft: '4px solid var(--rose-gold)',
                    transition: 'all 0.3s ease',
                  }}>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--deep-plum)' }}>
                      {faq.q}
                    </h4>
                    <p style={{ margin: 0, color: 'var(--gray-700)', fontSize: '0.95rem' }}>
                      {faq.a}
                    </p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
