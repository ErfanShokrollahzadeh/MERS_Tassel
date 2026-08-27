'use client';

import Link from 'next/link';
import { CalendarClock, FileCheck2, MessageCircle, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';

const whatsapp = 'https://wa.me/905528482640?text=';

export function ExchangePolicyNotice({ compact = false }: { compact?: boolean }) {
  const { locale } = useI18n();
  const copy = locale === 'tr' ? {
    eyebrow: 'DEĞİŞİM VE İADE',
    title: 'Kutuyu ve belgenizi saklayın.',
    intro: 'Teslimattan sonra değişim veya iade düşünüyorsanız ürünü, kutusunu ve satış belgesini özenle koruyun.',
    exchange: 'Değişim talebinizi teslimattan itibaren 3 iş günü içinde WhatsApp üzerinden iletin.',
    integrity: 'MERS Tassel’in gönüllü değişim programı için satış belgesi ile ürün kutusu/ambalajı eksiksiz ve hasarsız olmalıdır.',
    return: 'Mesafeli satışlarda, kanuni istisnalar saklı kalmak üzere, 14 takvim günü içinde cayma hakkınız vardır. İnceleme sırasında ürünün değerinde azalma olup olmadığı ayrıca değerlendirilir.',
    whatsapp: 'WhatsApp’tan yazın',
    details: 'İade koşullarını okuyun',
  } : {
    eyebrow: 'EXCHANGES & RETURNS',
    title: 'Keep the box and your sales document.',
    intro: 'If you may exchange or return an item after delivery, please protect the product, its box and the sales document carefully.',
    exchange: 'Contact us on WhatsApp within 3 business days of delivery to request a product exchange.',
    integrity: 'For the voluntary MERS Tassel exchange program, the sales document and product box/packaging must be complete and undamaged.',
    return: 'For distance sales, you have a 14-calendar-day statutory withdrawal right, subject to legal exceptions. Any loss of value caused during inspection is assessed separately.',
    whatsapp: 'Message on WhatsApp',
    details: 'Read the return terms',
  };

  const message = encodeURIComponent(locale === 'tr'
    ? 'Merhaba MERS Tassel, teslim aldığım sipariş için değişim talebi oluşturmak istiyorum.'
    : 'Hello MERS Tassel, I would like to request an exchange for a delivered order.');

  return (
    <section className={`exchange-policy${compact ? ' exchange-policy--compact' : ''}`} aria-labelledby="exchange-policy-title">
      <div className="exchange-policy__heading">
        <span className="eyebrow">{copy.eyebrow}</span>
        <h2 id="exchange-policy-title">{copy.title}</h2>
        {!compact && <p>{copy.intro}</p>}
      </div>
      <div className="exchange-policy__rules">
        <p><CalendarClock aria-hidden="true" /><span>{copy.exchange}</span></p>
        <p><FileCheck2 aria-hidden="true" /><span>{copy.integrity}</span></p>
        <p><ShieldCheck aria-hidden="true" /><span>{copy.return}</span></p>
      </div>
      <div className="exchange-policy__actions">
        <a className="button button--primary" href={`${whatsapp}${message}`} target="_blank" rel="noreferrer"><MessageCircle /> {copy.whatsapp}</a>
        <Link className="text-button" href="/returns">{copy.details}</Link>
      </div>
    </section>
  );
}
