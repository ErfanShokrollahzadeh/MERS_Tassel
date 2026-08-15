'use client';

import { NotConnected } from '@/components/admin/NotConnected';

export default function PromotionsPage() {
  return (
    <NotConnected
      kicker="Campaigns"
      title="Promotions"
      summary="Discount codes and automatic offers."
      planned={[
        'Percentage, fixed-amount and free-shipping discounts',
        'Redemption limits and scheduling windows',
        'Eligibility by collection, product or customer segment',
        'Attributed revenue per campaign',
      ]}
    />
  );
}
