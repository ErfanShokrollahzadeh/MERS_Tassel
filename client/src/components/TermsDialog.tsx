'use client';

import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { termsOfService } from '@/content/termsOfService';
import { TermsOfService } from '@/components/TermsOfService';

type TermsDialogProps = { open: boolean; onClose: () => void; onAccept: () => void };

export function TermsDialog({ open, onClose, onAccept }: TermsDialogProps) {
  const { locale } = useI18n();
  const content = termsOfService(locale);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose, open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="terms-modal" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section className="terms-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="terms-dialog__bar">
          <div><span className="eyebrow">MERSTASSEL · {content.updated}</span><h2 id={titleId}>{content.title}</h2></div>
          <button ref={closeRef} type="button" aria-label={content.close} onClick={onClose}><X /></button>
        </header>
        <div className="terms-dialog__scroll"><TermsOfService compact /></div>
        <footer className="terms-dialog__actions">
          <button type="button" className="button button--ghost" onClick={onClose}>{content.close}</button>
          <button type="button" className="button button--primary" onClick={onAccept}>{content.accept}<Check /></button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
