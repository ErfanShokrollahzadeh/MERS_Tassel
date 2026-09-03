import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await cookies()).get('mers-locale')?.value === 'tr' ? 'tr' : 'en';
  const title = locale === 'tr' ? 'Editoryal Günlük' : 'Editorial Journal';
  const description = locale === 'tr'
    ? 'El yapımı takılar, özenli malzemeler ve MERS atölyesindeki yaşam üzerine hikâyeler.'
    : 'Stories of handcrafted jewelry, thoughtful materials, and life inside the MERS atelier.';

  return {
    title,
    description,
    alternates: { canonical: '/blog' },
    openGraph: { title: `${title} · MERS Tassel`, description, type: 'website' },
  };
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
