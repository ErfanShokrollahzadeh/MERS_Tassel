import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { InformationPage } from '@/components/InformationPage';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await cookies()).get('mers-locale')?.value === 'tr' ? 'tr' : 'en';
  return locale === 'tr'
    ? { title: 'Çerez Politikası', description: 'MERSTassel çerezleri, tarayıcı depolaması ve ziyaretçi tercihleri hakkında bilgi.' }
    : { title: 'Cookie Policy', description: 'How MERSTassel uses cookies, browser storage, and visitor preferences.' };
}

export default function CookiesPage() { return <InformationPage id="cookies" />; }
