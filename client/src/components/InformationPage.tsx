'use client';

import Link from 'next/link';
import { ArrowRight, Droplets, Eye, Gem, HandHeart, Handshake, LockKeyhole, PackageCheck, RotateCcw, Scale, ShieldCheck, Sparkles, Sprout, TrendingUp, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nProvider';
import { informationPage, type InformationPageId } from '@/content/informationPages';
import { useSiteSettings } from '@/lib/useSiteSettings';

const visuals = {
  privacy: { hero: ShieldCheck, cards: [Eye, LockKeyhole, ShieldCheck] },
  invest: { hero: Sprout, cards: [HandHeart, TrendingUp, Handshake] },
  shipping: { hero: PackageCheck, cards: [Sparkles, Truck, RotateCcw] },
  care: { hero: Gem, cards: [Droplets, Sparkles, HandHeart] },
} as const;

export function InformationPage({ id }: { id: InformationPageId }) {
  const { locale, t } = useI18n();
  const { data: settings } = useSiteSettings();
  const content = informationPage(locale, id);
  const { hero: HeroIcon, cards } = visuals[id];
  const ctaHref = id === 'invest' && settings?.contactEmail
    ? `mailto:${settings.contactEmail}?subject=${encodeURIComponent(locale === 'tr' ? 'MERS ortaklık görüşmesi' : 'MERS partnership inquiry')}`
    : content.ctaHref;

  return (
    <main className={`information-page information-page--${id}`}>
      <section className="information-hero">
        <div className="information-glow information-glow--one" />
        <div className="information-glow information-glow--two" />
        <div className="container-wide information-hero__grid">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}>
            <span className="eyebrow">{content.eyebrow}</span>
            <h1>{content.title}<br /><em>{content.accent}</em></h1>
            <p>{content.lede}</p>
            <div className="information-note"><Scale aria-hidden="true" /><span>{content.note}</span></div>
          </motion.div>
          <motion.div className="information-emblem" initial={{ opacity: 0, scale: .85, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: .7, delay: .12 }} aria-hidden="true">
            <i /><i /><i />
            <span><HeroIcon /></span>
          </motion.div>
        </div>
      </section>

      <section className="information-card-band">
        <div className="container-wide information-cards">
          {content.cards.map((card, index) => {
            const Icon = cards[index];
            return <article key={card.title}><span><Icon aria-hidden="true" /></span><b>0{index + 1}</b><h2>{card.title}</h2><p>{card.copy}</p></article>;
          })}
        </div>
      </section>

      <section className="information-detail section">
        <div className="container-wide">
          <header><span className="eyebrow">{content.sectionLabel}</span><p>{String(content.sections.length).padStart(2, '0')} / MERS</p></header>
          <div className="information-sections">
            {content.sections.map((section) => (
              <article key={section.number}><span>{section.number}</span><h2>{section.title}</h2><p>{section.copy}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="information-cta">
        <div className="information-cta__mark" aria-hidden="true"><HeroIcon /></div>
        <div className="container-narrow">
          <span className="eyebrow">MERS Tassel · {t('footer.contact')}</span>
          <h2>{content.ctaTitle}</h2><p>{content.ctaCopy}</p>
          {ctaHref.startsWith('/') ? <Link className="button button--light" href={ctaHref}>{content.ctaLabel}<ArrowRight /></Link> : <a className="button button--light" href={ctaHref}>{content.ctaLabel}<ArrowRight /></a>}
        </div>
      </section>
    </main>
  );
}
