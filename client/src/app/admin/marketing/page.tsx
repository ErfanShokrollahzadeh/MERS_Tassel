'use client';

import { NotConnected } from '@/components/admin/NotConnected';

export default function MarketingPage() {
  return (
    <NotConnected
      kicker="Growth intelligence"
      title="Marketing pulse"
      summary="Acquisition, attribution and cohort analysis."
      planned={[
        'Session and funnel tracking from a commerce event stream',
        'Attribution by traffic source and campaign',
        'Cohort retention across weekly customer groups',
        'Acquisition cost and return on ad spend',
      ]}
    />
  );
}
