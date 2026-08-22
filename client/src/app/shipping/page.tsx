import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { InformationPage } from '@/components/InformationPage';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await cookies()).get('mers-locale')?.value === 'tr' ? 'tr' : 'en';
  return locale === 'tr'
    ? { title: 'Teslimat ve Kargo Koşulları', description: 'MERS Tassel siparişleri için PTT kargo ücretleri, hazırlık süresi, teslimat tahminleri ve gönderi desteği.' }
    : { title: 'Shipping and Delivery Terms', description: 'PTT shipping charges, preparation times, delivery estimates, and parcel support for MERS Tassel orders in Türkiye.' };
}

export default function ShippingPage() { return <InformationPage id="shipping" />; }
