import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { AboutContent } from '@/components/AboutContent';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await cookies()).get('mers-locale')?.value === 'tr' ? 'tr' : 'en';
  return locale === 'tr'
    ? { title: 'Atölyemiz', description: 'MERS Tassel’in el emeğine dayanan üretim yaklaşımını, hikâyesini ve değerlerini keşfedin.' }
    : { title: 'Our Atelier', description: 'Discover the story, values, and hands-on making process behind MERS Tassel.' };
}

export default function AboutPage() { return <AboutContent />; }
