import { CheckoutSuccess } from '@/components/CheckoutSuccess';

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId = '' } = await searchParams;
  return <CheckoutSuccess sessionId={sessionId} />;
}
