import { CheckoutCancel } from '@/components/CheckoutCancel';

export default async function CheckoutCancelPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  return <CheckoutCancel order={order} />;
}
