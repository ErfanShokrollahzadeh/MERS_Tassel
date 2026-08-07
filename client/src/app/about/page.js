'use client';

import AnimatedSection from '@/components/AnimatedSection';

const values = [
  { icon: '🎨', title: 'Artisan Craft', desc: 'Every piece is handcrafted by skilled Turkish artisans, preserving centuries-old traditions while embracing modern design.' },
  { icon: '🌿', title: 'Sustainable', desc: 'We use ethically sourced materials and eco-friendly packaging to minimize our environmental footprint.' },
  { icon: '💖', title: 'Made with Love', desc: 'Passion drives everything we do. Each accessory carries the warmth and dedication of its maker.' },
  { icon: '✨', title: 'Unique Designs', desc: 'No two pieces are exactly alike. Our designs blend Turkish heritage with contemporary fashion trends.' },
];

const team = [
  { name: 'Merve Yılmaz', role: 'Founder & Designer', emoji: '👩‍🎨' },
  { name: 'Selin Kaya', role: 'Head Artisan', emoji: '👩‍🔧' },
  { name: 'Emre Demir', role: 'Operations Manager', emoji: '👨‍💼' },
];

const milestones = [
  { year: '2020', event: 'MERS Tassel was born from a small workshop in Istanbul.' },
  { year: '2021', event: 'Launched online store and shipped first international orders.' },
  { year: '2022', event: 'Expanded collection to 100+ unique designs across 6 categories.' },
  { year: '2023', event: 'Reached 500+ happy customers worldwide.' },
  { year: '2024', event: 'Introduced new Jasuichi and Solid Azon collections.' },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <div className="page-header">
        <div className="floating-shape" style={{ width: 250, height: 250, top: '5%', right: '8%', animation: 'float 8s ease-in-out infinite' }}></div>
        <div className="floating-shape" style={{ width: 180, height: 180, bottom: '5%', left: '5%', animation: 'float 6s ease-in-out infinite reverse' }}></div>
        <div className="container">
          <h1>About MERS Tassel</h1>
          <p>Our story, our passion, our craft — all from the heart of Turkey</p>
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
                  Our Story
                </p>
                <h2 style={{ marginBottom: '24px' }}>
                  Where Tradition Meets Modern Elegance
                </h2>
                <p style={{ fontSize: '1.05rem', lineHeight: 1.8, marginBottom: '16px' }}>
                  MERS Tassel was founded in 2020 in the vibrant city of Istanbul, Turkey — a place 
                  where East meets West, and centuries of artisan tradition flow through every street 
                  and bazaar.
                </p>
                <p style={{ fontSize: '1.05rem', lineHeight: 1.8, marginBottom: '16px' }}>
                  What started as a small passion project creating tassel accessories for friends and 
                  family has grown into a beloved brand serving customers worldwide. Our founder, 
                  inspired by the rich tapestry of Turkish craftsmanship, set out to create accessories 
                  that are both beautiful and meaningful.
                </p>
                <p style={{ fontSize: '1.05rem', lineHeight: 1.8 }}>
                  Today, every MERS Tassel piece is still handcrafted with the same love and attention 
                  to detail that started it all — from our signature necklaces to our unique Jasuichi 
                  and Solid Azon collections.
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
              <h2>Our Values</h2>
              <p>The principles that guide every accessory we create</p>
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
              <h2>Our Journey</h2>
              <p>From a small Istanbul workshop to a global accessories brand</p>
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
              <h2>Meet Our Team</h2>
              <p>The passionate people behind MERS Tassel</p>
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
              Join the MERS Tassel Family
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: '500px', margin: '0 auto 30px', fontSize: '1.1rem' }}>
              Discover accessories that celebrate craftsmanship, culture, and creativity.
            </p>
            <a href="/products" className="btn-mers-gold">
              ✨ Explore Our Collection
            </a>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
