'use client';

import Link from 'next/link';
import { ArrowDown, Gift, Gem, Heart, PackageCheck, Sparkles } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { KavanozBuilder } from '@/components/KavanozBuilder';

const pageCopy = {
  en: {
    eyebrow: 'The MERS gift atelier',
    titleOne: 'One box.',
    titleTwo: 'Entirely yours.',
    lede: 'Create a gift that feels unmistakably personal. Pair jewelry, playful keepsakes and everyday pieces, then leave the finishing details to our atelier.',
    begin: 'Begin your Kavanoz',
    browse: 'Browse the collection',
    guide: 'How your Kavanoz comes together',
    choose: 'Choose with feeling',
    chooseCopy: 'Gather two to six pieces from across the collection.',
    personalize: 'Add your words',
    personalizeCopy: 'Include a private message and presentation notes.',
    prepare: 'Prepared by hand',
    prepareCopy: 'We arrange, wrap and finish your box in the atelier.',
    seal: 'Made to be opened slowly',
    jewelry: 'Jewelry',
    keepsakes: 'Keepsakes',
    notes: 'Your note',
  },
  tr: {
    eyebrow: 'MERS hediye atölyesi',
    titleOne: 'Tek kutu.',
    titleTwo: 'Tamamen size özel.',
    lede: 'Gerçekten kişisel hissettiren bir hediye hazırlayın. Takıları, sevimli hatıraları ve günlük parçaları bir araya getirin; son dokunuşları atölyemize bırakın.',
    begin: 'Kavanozunuzu oluşturmaya başlayın',
    browse: 'Koleksiyonu inceleyin',
    guide: 'Kavanozunuz nasıl hazırlanır?',
    choose: 'Hissederek seçin',
    chooseCopy: 'Koleksiyonun farklı köşelerinden iki ila altı parça seçin.',
    personalize: 'Kendi sözlerinizi ekleyin',
    personalizeCopy: 'Özel mesajınızı ve sunum notlarınızı bizimle paylaşın.',
    prepare: 'Elde hazırlanır',
    prepareCopy: 'Kutunuzu atölyede düzenler, paketler ve tamamlarız.',
    seal: 'Yavaşça açılması için hazırlandı',
    jewelry: 'Takılar',
    keepsakes: 'Hatıralar',
    notes: 'Notunuz',
  },
} as const;

export function KavanozPageExperience() {
  const { locale } = useI18n();
  const text = pageCopy[locale];

  return (
    <main className="kavanoz-page">
      <section className="kavanoz-page-hero" aria-labelledby="kavanoz-page-title">
        <div className="kavanoz-page-glow kavanoz-page-glow--one" aria-hidden="true" />
        <div className="kavanoz-page-glow kavanoz-page-glow--two" aria-hidden="true" />
        <div className="container-wide kavanoz-page-hero__grid">
          <div className="kavanoz-page-hero__copy">
            <span className="eyebrow"><Sparkles /> {text.eyebrow}</span>
            <h1 id="kavanoz-page-title">{text.titleOne}<br /><em>{text.titleTwo}</em></h1>
            <p>{text.lede}</p>
            <div className="kavanoz-page-actions">
              <a className="button button--primary" href="#kavanoz">{text.begin} <ArrowDown /></a>
              <Link className="button button--ghost" href="/products">{text.browse}</Link>
            </div>
          </div>

          <div className="kavanoz-page-art" aria-hidden="true">
            <div className="kavanoz-page-art__halo" />
            <div className="kavanoz-page-art__lid"><span /><span /></div>
            <div className="kavanoz-page-art__jar">
              <div className="kavanoz-page-art__label"><Gift /><span>MERS</span><strong>Kavanoz</strong><small>{text.seal}</small></div>
              <span className="kavanoz-page-token kavanoz-page-token--gem"><Gem /></span>
              <span className="kavanoz-page-token kavanoz-page-token--heart"><Heart /></span>
              <span className="kavanoz-page-token kavanoz-page-token--note">M</span>
            </div>
            <span className="kavanoz-page-tag kavanoz-page-tag--one">01 · {text.jewelry}</span>
            <span className="kavanoz-page-tag kavanoz-page-tag--two">02 · {text.keepsakes}</span>
            <span className="kavanoz-page-tag kavanoz-page-tag--three">03 · {text.notes}</span>
          </div>
        </div>
      </section>

      <section className="kavanoz-page-guide" aria-label={text.guide}>
        <div className="container-wide">
          <span className="kavanoz-page-guide__title">{text.guide}</span>
          <div className="kavanoz-page-guide__grid">
            <article><span>01</span><Heart /><div><h2>{text.choose}</h2><p>{text.chooseCopy}</p></div></article>
            <article><span>02</span><Gift /><div><h2>{text.personalize}</h2><p>{text.personalizeCopy}</p></div></article>
            <article><span>03</span><PackageCheck /><div><h2>{text.prepare}</h2><p>{text.prepareCopy}</p></div></article>
          </div>
        </div>
      </section>

      <KavanozBuilder />
    </main>
  );
}
