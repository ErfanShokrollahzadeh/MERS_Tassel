'use client';

import Link from 'next/link';
import { ArrowRight, Gem, HandHeart, Leaf } from 'lucide-react';
import { products } from '@/data/store';
import { MediaImage } from '@/components/MediaImage';
import { useI18n, type TranslationKey } from '@/i18n/I18nProvider';

const values = [
  { icon: HandHeart, title: 'about.hands', copy: 'about.handsCopy' },
  { icon: Gem, title: 'about.memory', copy: 'about.memoryCopy' },
  { icon: Leaf, title: 'about.less', copy: 'about.lessCopy' },
];

export function AboutContent() {
  const { t } = useI18n();
  return <div className="story-page">
    <section className="story-hero"><div className="container-narrow"><span className="eyebrow">{t('about.eyebrow')}</span><h1>{t('about.title1')}<br /><em>{t('about.title2')}</em></h1><p>{t('about.lede')}</p></div></section>
    <section className="story-split"><div><MediaImage src={products[7].image} alt="MERS Tassel atelier" sizes="(max-width: 800px) 100vw, 52vw" /></div><article><span className="eyebrow">{t('about.beginning')}</span><h2>{t('about.idea')}</h2><p>{t('about.p1')}</p><p>{t('about.p2')}</p><blockquote>{t('about.quote')}</blockquote></article></section>
    <section className="section story-values"><div className="container-wide"><div className="center-heading"><span className="eyebrow">{t('about.guides')}</span><h2>{t('about.care')}</h2></div><div>{values.map((value) => <article key={value.title}><value.icon /><h3>{t(value.title as TranslationKey)}</h3><p>{t(value.copy as TranslationKey)}</p></article>)}</div></div></section>
    <section className="story-cta"><span className="eyebrow">{t('about.keepsake')}</span><h2>{t('about.find')}</h2><Link href="/products" className="button button--light">{t('common.explore')} <ArrowRight /></Link></section>
  </div>;
}
