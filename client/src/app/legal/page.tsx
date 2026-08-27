import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { InformationPage } from '@/components/InformationPage';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await cookies()).get('mers-locale')?.value === 'tr' ? 'tr' : 'en';
  return locale === 'tr'
    ? { title: 'Yasal Bildirim', description: 'MERSTassel işletme bilgileri, web sitesi kullanım koşulları ve müşteri politikaları.' }
    : { title: 'Legal Notice', description: 'MERSTassel business information, website terms of use, and customer policies.' };
}

export default function LegalPage() { return <InformationPage id="legal" />; }
