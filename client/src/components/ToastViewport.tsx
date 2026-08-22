'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';
import { useToastStore } from '@/stores/toast';
import { useI18n } from '@/i18n/I18nProvider';

const icons = { success: CheckCircle2, error: CircleAlert, info: Info };

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);
  const { t } = useI18n();
  return <div className="toast-viewport" aria-live="polite" aria-atomic="false"><AnimatePresence initial={false}>{toasts.map((toast) => {
    const Icon = icons[toast.tone];
    return <motion.div className={`toast toast--${toast.tone} glass-panel`} key={toast.id} initial={{ opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 24, scale: .97 }} role={toast.tone === 'error' ? 'alert' : 'status'}><Icon aria-hidden="true" /><div><strong>{toast.title}</strong>{toast.message && <p>{toast.message}</p>}</div><button onClick={() => dismiss(toast.id)} aria-label={t('common.dismissNotification')}><X /></button></motion.div>;
  })}</AnimatePresence></div>;
}
