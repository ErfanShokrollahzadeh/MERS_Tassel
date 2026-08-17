'use client';

import Link from 'next/link';
import { ArrowRight, Gem, HandHeart, Leaf } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { MediaImage } from '@/components/MediaImage';
import { catalogKeys, fetchFeaturedProducts, fetchSiteSettings } from '@/lib/catalog';
import { useI18n, type TranslationKey } from '@/i18n/I18nProvider';

const values = [
  { icon: HandHeart, title: 'about.hands', copy: 'about.handsCopy' },
  { icon: Gem, title: 'about.memory', copy: 'about.memoryCopy' },
  { icon: Leaf, title: 'about.less', copy: 'about.lessCopy' },
];

export function AboutContent() {
  const { t, locale } = useI18n();

  const settings = useQuery({ queryKey: catalogKeys.settings(), queryFn: () => fetchSiteSettings() });
  const featured = useQuery({ queryKey: catalogKeys.featured(8), queryFn: () => fetchFeaturedProducts(8) });

  // Atelier imagery: the settings hero if set, otherwise the last featured piece.
  const atelierImage = settings.data?.heroImagePath || featured.data?.at(-1)?.image || '';

  const headline = locale === 'tr' && settings.data?.aboutHeadlineTr ? settings.data.aboutHeadlineTr : settings.data?.aboutHeadline;
  const body = locale === 'tr' && settings.data?.aboutBodyTr ? settings.data.aboutBodyTr : settings.data?.aboutBody;

  return (
    <div className="story-page">
      <section className="story-hero"><div className="container-narrow"><span className="eyebrow">{t('about.eyebrow')}</span><h1>{t('about.title1')}<br /><em>{t('about.title2')}</em></h1><p>{t('about.lede')}</p></div></section>

      <section className="story-split">
        <div>{atelierImage ? <MediaImage src={atelierImage} alt={t('common.atelierAlt')} sizes="(max-width: 800px) 100vw, 52vw" /> : <span className="skeleton-block story-image-placeholder" />}</div>
        <article>
          <span className="eyebrow">{t('about.beginning')}</span>
          <h2>{headline || t('about.idea')}</h2>
          {body ? <p>{body}</p> : <p>{t('about.p1')}</p>}
          <p>{t('about.p2')}</p>
          <blockquote>{t('about.quote')}</blockquote>
        </article>
      </section>

      <section className="section story-values"><div className="container-wide"><div className="center-heading"><span className="eyebrow">{t('about.guides')}</span><h2>{t('about.care')}</h2></div><div>{values.map((value) => <article key={value.title}><value.icon /><h3>{t(value.title as TranslationKey)}</h3><p>{t(value.copy as TranslationKey)}</p></article>)}</div></div></section>

      <section className="story-cta"><span className="eyebrow">{t('about.keepsake')}</span><h2>{t('about.find')}</h2><Link href="/products" className="button button--light">{t('common.explore')} <ArrowRight /></Link></section>
    </div>
  );
}
