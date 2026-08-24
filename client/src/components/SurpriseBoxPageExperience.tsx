'use client';

import Link from 'next/link';
import { ArrowDown, Gift, Heart, PackageCheck, Sparkles, WandSparkles } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { SurpriseBoxBuilder } from '@/components/SurpriseBoxBuilder';

const pageCopy = {
  en: {
    eyebrow: 'The mystery gift atelier',
    titleOne: 'Thoughtful in every detail.',
    titleTwo: 'Surprising by design.',
    lede: 'You choose who it is for, the mood and the value. Our atelier turns those clues into a one-of-a-kind gift—beautifully wrapped and kept secret until the moment it is opened.',
    begin: 'Create a Surprise Box',
    browse: 'Explore gift ideas',
    mystery: 'Contents kept beautifully secret',
    seal: 'Curated for one person only',
    hintOne: 'Your clues',
    hintTwo: 'Our curation',
    hintThree: 'Their moment',
    guide: 'How the surprise unfolds',
    direct: 'Set the direction',
    directCopy: 'Choose the recipient, budget and the feelings you want the gift to carry.',
    curate: 'We curate privately',
    curateCopy: 'Our team handpicks a balanced mix without revealing the exact pieces.',
    reveal: 'They discover it',
    revealCopy: 'The box arrives gift-ready, sealed with your personal note inside.',
  },
  tr: {
    eyebrow: 'Gizemli hediye atölyesi',
    titleOne: 'Her ayrıntısı düşünceli.',
    titleTwo: 'Sürprizi özenle tasarlandı.',
    lede: 'Kimin için olduğunu, tarzı ve bütçeyi siz seçin. Atölyemiz bu ipuçlarını yalnızca o kişiye özel bir hediyeye dönüştürsün; kutu açılana kadar içindekiler güzel bir sır olarak kalsın.',
    begin: 'Sürpriz Kutu oluşturun',
    browse: 'Hediye fikirlerini keşfedin',
    mystery: 'İçindekiler özenle gizli tutulur',
    seal: 'Yalnızca bir kişi için seçildi',
    hintOne: 'Sizin ipuçlarınız',
    hintTwo: 'Bizim seçkimiz',
    hintThree: 'Onların anı',
    guide: 'Sürpriz nasıl hazırlanır?',
    direct: 'Yönü siz belirleyin',
    directCopy: 'Alıcıyı, bütçeyi ve hediyenin taşımasını istediğiniz hissi seçin.',
    curate: 'Gizlice biz seçelim',
    curateCopy: 'Ekibimiz tam parçaları açıklamadan dengeli bir seçkiyi özenle hazırlar.',
    reveal: 'Onlar keşfetsin',
    revealCopy: 'Kutu, kişisel notunuz içinde ve hediyeye hazır biçimde mühürlü gelir.',
  },
} as const;

export function SurpriseBoxPageExperience() {
  const { locale } = useI18n();
  const text = pageCopy[locale];

  return (
    <main className="surprise-page">
      <section className="surprise-page-hero" aria-labelledby="surprise-page-title">
        <div className="surprise-page-glow surprise-page-glow--one" aria-hidden="true" />
        <div className="surprise-page-glow surprise-page-glow--two" aria-hidden="true" />
        <div className="container-wide surprise-page-hero__grid">
          <div className="surprise-page-hero__copy">
            <span className="eyebrow"><WandSparkles /> {text.eyebrow}</span>
            <h1 id="surprise-page-title">{text.titleOne}<br /><em>{text.titleTwo}</em></h1>
            <p>{text.lede}</p>
            <div className="surprise-page-actions">
              <a className="button button--primary" href="#surprise-box">{text.begin} <ArrowDown /></a>
              <Link className="button button--ghost" href="/products">{text.browse}</Link>
            </div>
          </div>

          <div className="surprise-page-stage" aria-hidden="true">
            <div className="surprise-page-stage__orbit surprise-page-stage__orbit--outer" />
            <div className="surprise-page-stage__orbit surprise-page-stage__orbit--inner" />
            <span className="surprise-page-spark surprise-page-spark--one"><Sparkles /></span>
            <span className="surprise-page-spark surprise-page-spark--two">?</span>
            <span className="surprise-page-spark surprise-page-spark--three"><Heart /></span>
            <div className="surprise-box-art">
              <div className="surprise-box-art__lid"><span /></div>
              <div className="surprise-box-art__body">
                <span className="surprise-box-art__ribbon" />
                <div className="surprise-box-art__seal"><Gift /><small>MERS</small><strong>Surprise</strong></div>
              </div>
            </div>
            <span className="surprise-page-mystery"><Sparkles /> {text.mystery}</span>
            <span className="surprise-page-seal">{text.seal}</span>
            <span className="surprise-page-tag surprise-page-tag--one">01 · {text.hintOne}</span>
            <span className="surprise-page-tag surprise-page-tag--two">02 · {text.hintTwo}</span>
            <span className="surprise-page-tag surprise-page-tag--three">03 · {text.hintThree}</span>
          </div>
        </div>
      </section>

      <section className="surprise-page-guide" aria-label={text.guide}>
        <div className="container-wide">
          <span className="surprise-page-guide__title">{text.guide}</span>
          <div className="surprise-page-guide__grid">
            <article><span>01</span><Heart /><div><h2>{text.direct}</h2><p>{text.directCopy}</p></div></article>
            <article><span>02</span><Sparkles /><div><h2>{text.curate}</h2><p>{text.curateCopy}</p></div></article>
            <article><span>03</span><PackageCheck /><div><h2>{text.reveal}</h2><p>{text.revealCopy}</p></div></article>
          </div>
        </div>
      </section>

      <SurpriseBoxBuilder />
    </main>
  );
}
