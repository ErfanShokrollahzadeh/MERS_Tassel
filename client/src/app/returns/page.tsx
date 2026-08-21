import type { Metadata } from 'next';
import { InformationPage } from '@/components/InformationPage';

export const metadata: Metadata = {
  title: 'Returns and Right of Withdrawal | MERSTassel',
  description: 'MERSTassel return, refund and 14-day right of withdrawal policy for distance sales in Türkiye.',
};

export default function ReturnsPage() { return <InformationPage id="returns" />; }
