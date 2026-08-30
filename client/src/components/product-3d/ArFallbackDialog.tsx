'use client';

import { CameraOff, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { DeviceCapabilities } from './deviceCapabilities';
import { useI18n } from '@/i18n/I18nProvider';

export function ArFallbackDialog({ capabilities, onClose }: { capabilities: DeviceCapabilities; onClose: () => void }) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const title = capabilities.isIOS ? t('model.iosTitle') : capabilities.isAndroid ? t('model.androidTitle') : t('model.desktopTitle');
  const copy = capabilities.isSecureContext
    ? capabilities.isIOS
      ? t('model.iosCopy')
      : capabilities.isAndroid
        ? t('model.androidCopy')
        : t('model.desktopCopy')
    : t('model.httpsCopy');

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

  return (
    <div className="model-dialog-root" role="presentation">
      <button className="model-dialog-scrim" onClick={onClose} aria-label={t('model.close')} />
      <section ref={dialogRef} className="model-dialog" role="dialog" aria-modal="true" aria-labelledby="ar-fallback-title">
        <button className="model-dialog__close" onClick={onClose} aria-label={t('model.close')}><X size={18} /></button>
        <div className="model-dialog__icon"><CameraOff size={22} /></div>
        <span className="eyebrow">{t('model.arGuidance')}</span>
        <h2 id="ar-fallback-title">{title}</h2>
        <p>{copy}</p>
        <p className="model-dialog__privacy">{t('model.privacy')}</p>
        <button className="button button--primary" onClick={onClose}>{t('model.continue3d')}</button>
      </section>
    </div>
  );
}
