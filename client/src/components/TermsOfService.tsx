'use client';

import Link from 'next/link';
import { ArrowLeft, Check, FileCheck2, Mail, MessageCircle } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { termsOfService } from '@/content/termsOfService';

export function TermsOfService({ compact = false }: { compact?: boolean }) {
  const { locale } = useI18n();
  const content = termsOfService(locale);

  return (
    <article className={`terms-document${compact ? ' terms-document--compact' : ''}`}>
      <header className="terms-document__header">
        <span className="terms-document__mark" aria-hidden="true"><FileCheck2 /></span>
        <div>
          <span className="eyebrow">{content.eyebrow}</span>
          <h1>{content.title}</h1>
          <p>{content.intro}</p>
          <time dateTime="2026-08-28">{content.updated}</time>
        </div>
      </header>

      <aside className="terms-summary" aria-labelledby="terms-summary-title">
        <h2 id="terms-summary-title">{content.summaryTitle}</h2>
        <ul>{content.summary.map((item) => <li key={item}><Check aria-hidden="true" /><span>{item}</span></li>)}</ul>
      </aside>

      <div className="terms-sections">
        {content.sections.map((section) => (
          <section key={section.number} id={`terms-${section.number}`}>
            <span aria-hidden="true">{section.number}</span>
            <div><h2>{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
          </section>
        ))}
      </div>

      <aside className="terms-contact">
        <div><span className="terms-contact__icon" aria-hidden="true"><MessageCircle /></span><div><h2>{content.contactTitle}</h2><p>{content.contactCopy}</p></div></div>
        <div className="terms-contact__links">
          <a href="mailto:merstassel@gmail.com"><Mail />merstassel@gmail.com</a>
          <a href="https://wa.me/905528482640" target="_blank" rel="noreferrer"><MessageCircle />WhatsApp</a>
        </div>
      </aside>

      {!compact && <footer className="terms-document__footer"><Link className="button button--ghost" href="/signup"><ArrowLeft />{content.back}</Link></footer>}
    </article>
  );
}
