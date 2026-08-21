'use client';

import { useState } from 'react';
import { Building2, Check, Clock3, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { SocialContactLinks } from '@/components/SocialContactLinks';
import { useSiteSettings } from '@/lib/useSiteSettings';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const { t, locale } = useI18n();
  const { data: settings } = useSiteSettings();

  const email = settings?.contactEmail;
  const address = settings?.contactAddress;
  const localizedAddress = locale === 'tr' ? address?.replace('Istanbul', 'İstanbul') : address;
  const businessCopy = locale === 'tr' ? {
    title: 'İşletme bilgileri', intro: 'MERSTassel, Türkiye’de faaliyet gösteren bireysel / şahıs satıcıdır. Ürün, sipariş, teslimat, iptal ve iade talepleriniz için bize dilediğiniz zaman ulaşabilirsiniz.',
    tradeName: 'Ticari ad', legalStatus: 'Hukuki statü', status: 'Bireysel / şahıs satıcı', address: 'İşletme ve iade adresi', phone: 'Telefon', hours: 'Çalışma saatleri', always: '7 gün 24 saat iletişime açık', response: 'Mesajlar mümkün olan en kısa sürede yanıtlanır.',
  } : {
    title: 'Business information', intro: 'MERSTassel operates in Türkiye as an individual / sole-proprietor seller. You may contact us at any time regarding products, orders, delivery, cancellations, and returns.',
    tradeName: 'Trade name', legalStatus: 'Legal status', status: 'Individual / sole-proprietor seller', address: 'Business and return address', phone: 'Telephone', hours: 'Working hours', always: 'Open for contact 24 hours, 7 days a week', response: 'Messages are answered as soon as reasonably possible.',
  };

  return (
    <div className="contact-page">
      <section className="contact-hero"><div className="container-wide"><span className="eyebrow">{t('contact.eyebrow')}</span><h1>{t('contact.title1')}<br /><em>{t('contact.title2')}</em></h1><p>{t('contact.lede')}</p></div></section>

      <section className="contact-layout container-wide">
        <aside>
          <div><Mail /><span><strong>{t('contact.write')}</strong>{email ? <a href={`mailto:${email}`}>{email}</a> : <span className="skeleton-block skeleton-block--inline" />}</span></div>
          <div><MapPin /><span><strong>{t('contact.visit')}</strong><p>{localizedAddress || <span className="skeleton-block skeleton-block--inline" />}<br />{t('contact.appointment')}</p></span></div>
          <section className="contact-socials"><strong>{t('contact.connect')}</strong><p>{t('contact.connectCopy')}</p><SocialContactLinks /></section>
          <blockquote>{t('contact.quote')}</blockquote>
        </aside>

        <form onSubmit={(event) => { event.preventDefault(); setSent(true); }}>
          {sent ? (
            <div className="form-success"><Check /><h2>{t('contact.sent')}</h2><p>{t('contact.sentCopy')}</p><button type="button" className="text-button" onClick={() => setSent(false)}>{t('contact.another')}</button></div>
          ) : (
            <>
              <div className="form-grid">
                <label className="field">{t('contact.name')}<input required /></label>
                <label className="field">{t('contact.email')}<input type="email" required /></label>
                <label className="field field--wide">{t('contact.help')}<select><option>{t('contact.product')}</option><option>{t('contact.order')}</option><option>{t('contact.repairs')}</option><option>{t('contact.press')}</option></select></label>
                <label className="field field--wide">{t('contact.message')}<textarea rows={7} required placeholder={t('contact.placeholder')} /></label>
              </div>
              <button className="button button--primary" type="submit">{t('contact.send')} <Send size={15} /></button>
            </>
          )}
        </form>
      </section>

      <section className="contact-business container-wide" aria-labelledby="business-information-title">
        <div className="contact-business__intro">
          <span className="eyebrow">MERSTassel · Türkiye</span>
          <h2 id="business-information-title">{businessCopy.title}</h2>
          <p>{businessCopy.intro}</p>
        </div>
        <div className="contact-business__details">
          <article><Building2 aria-hidden="true" /><div><span>{businessCopy.tradeName}</span><strong>MERSTassel</strong><small>{businessCopy.legalStatus}: {businessCopy.status}</small></div></article>
          <article><MapPin aria-hidden="true" /><div><span>{businessCopy.address}</span><strong>{localizedAddress || 'Eskişehir, Türkiye'}</strong></div></article>
          <article><Phone aria-hidden="true" /><div><span>{businessCopy.phone}</span><strong><a href={`tel:${settings?.contactPhone || '+900000000000'}`}>{settings?.contactPhone || '+90 000 000 0000'}</a></strong><small><a href="mailto:merstassel@gmail.com">merstassel@gmail.com</a></small></div></article>
          <article><Clock3 aria-hidden="true" /><div><span>{businessCopy.hours}</span><strong>{businessCopy.always}</strong><small>{businessCopy.response}</small></div></article>
        </div>
      </section>
    </div>
  );
}
