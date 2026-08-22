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

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await cookies()).get('mers-locale')?.value === 'tr' ? 'tr' : 'en';
  const title = locale === 'tr'
    ? 'MERS Tassel — Sessiz güzellikte nesneler'
    : 'MERS Tassel — Objects of quiet beauty';
  const description = locale === 'tr'
    ? 'Türkiye’de özenle ve elde üretilen takılar ile zamansız aksesuarları keşfedin.'
    : 'Discover handcrafted jewelry and timeless accessories, thoughtfully made in Türkiye.';

  return {
    title: { default: title, template: '%s · MERS Tassel' },
    description,
    keywords: ['handcrafted jewelry', 'el yapımı takı', 'Türkiye atelier', 'Türkiye atölye', 'artisan jewelry'],
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    openGraph: {
      title,
      description,
      type: 'website',
      images: [{ url: '/og.png', width: 1731, height: 909, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og.png'],
    },
  };
}

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
