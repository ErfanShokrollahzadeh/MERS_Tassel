'use client';

import Link from 'next/link';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { useI18n } from '@/i18n/I18nProvider';

export function CheckoutCancel({ order }: { order?: string }) {
  const { t } = useI18n();
  return <div className="checkout-success checkout-cancel"><div className="success-language"><LanguageSwitch /></div><div className="success-orbit"><ShoppingBag /></div><span className="eyebrow">{order ? t('success.order', { number: order }) : t('cancel.eyebrow')}</span><h1>{t('cancel.title')}</h1><p>{t('cancel.copy')}</p><div className="success-actions"><Link className="button button--primary" href="/checkout">{t('cancel.return')}</Link><Link className="button button--ghost" href="/products"><ArrowLeft /> {t('cancel.explore')}</Link></div></div>;
}
