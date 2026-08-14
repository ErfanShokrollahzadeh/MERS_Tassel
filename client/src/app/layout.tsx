import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: { default: 'MERS Tassel — Objects of quiet beauty', template: '%s · MERS Tassel' },
  description: 'Handcrafted jewelry and tactile accessories, made slowly in our Istanbul atelier.',
  keywords: ['handcrafted jewelry', 'Istanbul atelier', 'tassel accessories', 'artisan jewelry'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'MERS Tassel — Objects of quiet beauty',
    description: 'Handcrafted jewelry and tactile accessories, made slowly in our Istanbul atelier.',
    type: 'website',
    images: [{ url: '/og.png', width: 1731, height: 909, alt: 'MERS Tassel — Objects of quiet beauty' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MERS Tassel — Objects of quiet beauty',
    description: 'Handcrafted jewelry and tactile accessories, made slowly in our Istanbul atelier.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
