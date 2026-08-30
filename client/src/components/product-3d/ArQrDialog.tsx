'use client';

import { Copy, Check, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { productArUrl } from './modelUrls';
import { useI18n } from '@/i18n/I18nProvider';

export function ArQrDialog({ slug, productName, onClose }: { slug: string; productName: string; onClose: () => void }) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const url = productArUrl(slug);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((node) => !node.hasAttribute('disabled'));
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onCloseRef.current(); return; }
      if (event.key !== 'Tab') return;
      const nodes = focusable();
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previous?.focus(); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void import('qrcode').then((QRCode) => {
      if (!canvasRef.current || cancelled) return;
      return QRCode.toCanvas(canvasRef.current, url, { width: 260, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#24151f', light: '#fffaf7' } });
    }).catch(() => { if (!cancelled) setError(t('model.qrError')); });
    return () => { cancelled = true; };
  }, [t, url]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1600); }
    catch { setError(t('model.copyUnavailable')); }
  };

  return (
    <div className="model-dialog-root" role="presentation">
      <button className="model-dialog-scrim" onClick={onClose} aria-label={t('model.close')} />
      <section ref={dialogRef} className="model-dialog model-qr-dialog" role="dialog" aria-modal="true" aria-labelledby="qr-title">
        <button className="model-dialog__close" onClick={onClose} aria-label={t('model.close')}><X size={18} /></button>
        <span className="eyebrow">{t('model.continueMobile')}</span>
        <h2 id="qr-title">{t('model.scanTitle', { name: productName })}</h2>
        <p>{t('model.scanCopy')}</p>
        <div className="model-qr"><canvas ref={canvasRef} aria-label={t('model.qrLabel', { name: productName })} />{error && <small role="alert">{error}</small>}</div>
        <div className="model-qr-link"><code>{url}</code><button type="button" onClick={copy} aria-label={t('model.copyLink')}>{copied ? <Check size={16} /> : <Copy size={16} />}</button></div>
        <button className="button button--ghost" onClick={copy}>{copied ? t('model.linkCopied') : t('model.copyLink')}</button>
      </section>
    </div>
  );
}
