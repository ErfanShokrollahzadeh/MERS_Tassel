import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { TermsOfService } from '@/components/TermsOfService';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await cookies()).get('mers-locale')?.value === 'tr' ? 'tr' : 'en';
  return locale === 'tr'
    ? { title: 'Kullanım Koşulları', description: 'MERSTassel hesap, alışveriş, değişim, iade, Mağaza Cüzdanı, gizlilik ve güvenlik koşulları.' }
    : { title: 'Terms of Service', description: 'MERSTassel account, shopping, exchange, return, Store Wallet, privacy, and security terms.' };
}

export default function TermsPage() {
  return <div className="terms-page"><div className="container-narrow"><TermsOfService /></div></div>;
}
