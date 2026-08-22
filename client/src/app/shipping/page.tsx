import type { Metadata } from 'next';
import { InformationPage } from '@/components/InformationPage';

export const metadata: Metadata = {
  title: 'Shipping and Delivery Terms | MERSTassel',
  description: 'PTT shipping charges, preparation times, delivery estimates, and parcel support for MERSTassel orders in Türkiye.',
};

export default function ShippingPage() { return <InformationPage id="shipping" />; }
