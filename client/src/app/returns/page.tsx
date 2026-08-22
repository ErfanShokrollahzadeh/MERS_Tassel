import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { InformationPage } from '@/components/InformationPage';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await cookies()).get('mers-locale')?.value === 'tr' ? 'tr' : 'en';
  return locale === 'tr'
    ? { title: 'İade ve Cayma Hakkı', description: 'Türkiye’de mesafeli satışlar için MERS Tassel iade, geri ödeme ve 14 günlük cayma hakkı politikası.' }
    : { title: 'Returns and Right of Withdrawal', description: 'MERS Tassel return, refund, and 14-day right of withdrawal policy for distance sales in Türkiye.' };
}

export default function ReturnsPage() { return <InformationPage id="returns" />; }
