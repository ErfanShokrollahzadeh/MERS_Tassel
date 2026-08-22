import type { Metadata } from 'next';
import { Inter, Lora } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { cookies } from 'next/headers';
import type { Locale } from '@/i18n/I18nProvider';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-lora',
  display: 'swap',
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: { default: 'MERS Tassel — Objects of quiet beauty · Sessiz güzellikte nesneler', template: '%s · MERS Tassel' },
  description: 'Handcrafted jewelry made slowly in Istanbul. İstanbul’da yavaşça ve elde üretilen takılar.',
  keywords: ['handcrafted jewelry', 'el yapımı takı', 'Istanbul atelier', 'İstanbul atölye', 'artisan jewelry'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'MERS Tassel — Objects of quiet beauty · Sessiz güzellikte nesneler',
    description: 'Handcrafted jewelry made slowly in Istanbul. İstanbul’da yavaşça ve elde üretilen takılar.',
    type: 'website',
    images: [{ url: '/og.png', width: 1731, height: 909, alt: 'MERS Tassel — Objects of quiet beauty · Sessiz güzellikte nesneler' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MERS Tassel — Objects of quiet beauty · Sessiz güzellikte nesneler',
    description: 'Handcrafted jewelry made slowly in Istanbul. İstanbul’da yavaşça ve elde üretilen takılar.',
    images: ['/og.png'],
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const saved = cookieStore.get('mers-locale')?.value;
  const locale: Locale = saved === 'tr' ? 'tr' : 'en';
  return (
    <html lang={locale} className={`${inter.variable} ${lora.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning><Providers initialLocale={locale}>{children}</Providers></body>
    </html>
  );
}
