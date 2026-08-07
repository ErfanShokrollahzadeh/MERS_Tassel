'use client';

import AnimatedSection from '@/components/AnimatedSection';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();

  const values = [
    { icon: '🎨', title: t('about.values.1.title'), desc: t('about.values.1.desc') },
    { icon: '🌿', title: t('about.values.2.title'), desc: t('about.values.2.desc') },
    { icon: '💖', title: t('about.values.3.title'), desc: t('about.values.3.desc') },
    { icon: '✨', title: t('about.values.4.title'), desc: t('about.values.4.desc') },
  ];

  const team = [
    { name: 'Merve Yılmaz', role: t('about.team.role1'), emoji: '👩‍🎨' },
    { name: 'Selin Kaya', role: t('about.team.role2'), emoji: '👩‍🔧' },
    { name: 'Emre Demir', role: t('about.team.role3'), emoji: '👨‍💼' },
  ];

  const milestones = [
    { year: '2020', event: t('about.journey.1') },
    { year: '2021', event: t('about.journey.2') },
    { year: '2022', event: t('about.journey.3') },
    { year: '2023', event: t('about.journey.4') },
    { year: '2024', event: t('about.journey.5') },
  ];

  return (
    <>
      {/* Hero */}
      <div className="page-header">
        <div className="floating-shape" style={{ width: 250, height: 250, top: '5%', right: '8%', animation: 'float 8s ease-in-out infinite' }}></div>
        <div className="floating-shape" style={{ width: 180, height: 180, bottom: '5%', left: '5%', animation: 'float 6s ease-in-out infinite reverse' }}></div>
        <div className="container">
          <h1>{t('about.title')}</h1>
          <p>{t('about.subtitle')}</p>
        </div>
      </div>

      {/* Our Story */}
      <section className="section-mers">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <AnimatedSection>
                <div className="about-image-wrapper" style={{
                  background: 'var(--gradient-primary)',
                  height: '450px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8rem',
                }}>
                  🧵
                </div>
              </AnimatedSection>
            </div>
            <div className="col-lg-6">
              <AnimatedSection delay={200}>
                <p style={{ color: 'var(--rose-gold)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem', marginBottom: '12px' }}>
                  {t('hero.our_story')}
                </p>
                <h2 style={{ marginBottom: '24px' }}>
                  {t('about.story.title')}
                </h2>
                <p style={{ fontSize: '1.05rem', lineHeight: 1.8, marginBottom: '16px' }}>
                  {t('about.story.p1')}
                </p>
                <p style={{ fontSize: '1.05rem', lineHeight: 1.8, marginBottom: '16px' }}>
                  {t('about.story.p2')}
                </p>
                <p style={{ fontSize: '1.05rem', lineHeight: 1.8 }}>
                  {t('about.story.p3')}
                </p>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-mers bg-soft">
        <div className="container">
          <AnimatedSection>
            <div className="section-title">
              <h2>{t('about.values.title')}</h2>
              <p>{t('about.values.subtitle')}</p>
            </div>
          </AnimatedSection>

          <div className="row g-4">
            {values.map((value, index) => (
              <div className="col-lg-3 col-md-6" key={index}>
                <AnimatedSection delay={index * 150}>
                  <div className="value-card">
                    <span className="icon">{value.icon}</span>
                    <h4 style={{ color: 'var(--deep-plum)', marginBottom: '12px' }}>{value.title}</h4>
                    <p style={{ fontSize: '0.95rem' }}>{value.desc}</p>
                  </div>
                </AnimatedSection>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-mers">
        <div className="container">
          <AnimatedSection>
            <div className="section-title">
              <h2>{t('about.journey.title')}</h2>
              <p>{t('about.journey.subtitle')}</p>
            </div>
          </AnimatedSection>

          <div className="row justify-content-center">
            <div className="col-lg-8">
              {milestones.map((milestone, index) => (
                <AnimatedSection key={index} delay={index * 150}>
                  <div style={{
                    display: 'flex',
                    gap: '30px',
                    marginBottom: '40px',
                    alignItems: 'flex-start',
                  }}>
                    <div style={{
                      minWidth: '80px',
                      height: '80px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--gradient-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--white)',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      fontSize: '1.2rem',
                      flexShrink: 0,
                    }}>
                      {milestone.year}
                    </div>
                    <div style={{
                      background: 'var(--white)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '24px 30px',
                      boxShadow: 'var(--shadow-sm)',
                      flex: 1,
                      borderLeft: '3px solid var(--rose-gold)',
                    }}>
                      <p style={{ margin: 0, fontSize: '1.05rem' }}>{milestone.event}</p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-mers bg-soft">
        <div className="container">
          <AnimatedSection>
            <div className="section-title">
              <h2>{t('about.team.title')}</h2>
              <p>{t('about.team.subtitle')}</p>
            </div>
          </AnimatedSection>

          <div className="row g-4 justify-content-center">
            {team.map((member, index) => (
              <div className="col-lg-3 col-md-4 col-sm-6" key={index}>
                <AnimatedSection delay={index * 150}>
                  <div className="team-card">
                    <div className="team-avatar">
                      <span>{member.emoji}</span>
                    </div>
                    <h4 style={{ color: 'var(--deep-plum)', marginBottom: '4px', fontSize: '1.2rem' }}>
                      {member.name}
                    </h4>
                    <p style={{ color: 'var(--rose-gold)', fontWeight: 500, fontSize: '0.95rem' }}>
                      {member.role}
                    </p>
                  </div>
                </AnimatedSection>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-mers bg-dark" style={{ textAlign: 'center' }}>
        <div className="container">
          <AnimatedSection>
            <h2 style={{ color: 'var(--white)', marginBottom: '16px' }}>
              {t('cta.title')}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: '500px', margin: '0 auto 30px', fontSize: '1.1rem' }}>
              {t('cta.subtitle')}
            </p>
            <a href="/products" className="btn-mers-gold">
              {t('cta.btn')}
            </a>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
