import type { Metadata } from 'next';
import { KavanozPageExperience } from '@/components/KavanozPageExperience';

export const metadata: Metadata = {
  title: 'Kavanoz Gift Box Builder | MERS Tassel',
  description: 'Build a personalized MERS Tassel gift box with jewelry, cute keepsakes, everyday pieces and a private handwritten message.',
};

export default function KavanozPage() {
  return <KavanozPageExperience />;
}
