'use client';

import { useState } from 'react';
import { Check, Mail, MapPin, Send } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const { t } = useI18n();
  return <div className="contact-page">
    <section className="contact-hero"><div className="container-wide"><span className="eyebrow">{t('contact.eyebrow')}</span><h1>{t('contact.title1')}<br /><em>{t('contact.title2')}</em></h1><p>{t('contact.lede')}</p></div></section>
    <section className="contact-layout container-wide"><aside><div><Mail /><span><strong>{t('contact.write')}</strong><a href="mailto:hello@merstattel.com">hello@merstattel.com</a></span></div><div><MapPin /><span><strong>{t('contact.visit')}</strong><p>Karaköy, İstanbul<br />{t('contact.appointment')}</p></span></div><blockquote>{t('contact.quote')}</blockquote></aside>
      <form onSubmit={(event) => { event.preventDefault(); setSent(true); }}>{sent ? <div className="form-success"><Check /><h2>{t('contact.sent')}</h2><p>{t('contact.sentCopy')}</p><button type="button" className="text-button" onClick={() => setSent(false)}>{t('contact.another')}</button></div> : <><div className="form-grid"><label className="field">{t('contact.name')}<input required /></label><label className="field">{t('contact.email')}<input type="email" required /></label><label className="field field--wide">{t('contact.help')}<select><option>{t('contact.product')}</option><option>{t('contact.order')}</option><option>{t('contact.repairs')}</option><option>{t('contact.press')}</option></select></label><label className="field field--wide">{t('contact.message')}<textarea rows={7} required placeholder={t('contact.placeholder')} /></label></div><button className="button button--primary" type="submit">{t('contact.send')} <Send size={15} /></button></>}</form>
    </section>
  </div>;
}
