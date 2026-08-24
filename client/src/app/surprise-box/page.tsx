import type { Metadata } from 'next';
import { SurpriseBoxPageExperience } from '@/components/SurpriseBoxPageExperience';

export const metadata: Metadata = {
  title: 'Surprise Gift Box | MERS Tassel',
  description: 'Choose the recipient, mood and budget. The MERS Tassel atelier will curate a personal gift box whose contents remain a surprise until it is opened.',
};

export default function SurpriseBoxPage() {
  return <SurpriseBoxPageExperience />;
}
