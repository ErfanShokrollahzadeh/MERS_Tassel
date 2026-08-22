'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';

export default function NotFound() {
  const { t } = useI18n();
  return <div className="checkout-success"><span className="eyebrow">404 · MERS Tassel</span><h1>{t('notFound.title')}</h1><p>{t('notFound.copy')}</p><Link className="button button--primary" href="/products"><ArrowLeft /> {t('notFound.action')}</Link></div>;
}
