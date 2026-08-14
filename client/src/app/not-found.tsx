'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';

export default function NotFound() {
  const { locale } = useI18n();
  const tr = locale === 'tr';
  return <div className="checkout-success"><span className="eyebrow">404 · MERS Tassel</span><h1>{tr ? 'Bu sayfa bulunamadı.' : 'This page wandered off.'}</h1><p>{tr ? 'Aradığınız sayfa taşınmış olabilir. Koleksiyona dönüp keşfetmeye devam edebilirsiniz.' : 'The page you were looking for may have moved. Return to the collection and keep exploring.'}</p><Link className="button button--primary" href="/products"><ArrowLeft /> {tr ? 'Koleksiyona dön' : 'Return to the collection'}</Link></div>;
}
