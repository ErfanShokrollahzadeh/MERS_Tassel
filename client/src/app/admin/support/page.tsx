'use client';

import { NotConnected } from '@/components/admin/NotConnected';

export default function SupportPage() {
  return (
    <NotConnected
      kicker="Customer care"
      title="Support"
      summary="Conversations, internal notes and customer context."
      planned={[
        'Ticket inbox with search, filters and a board view',
        'Threaded replies plus private internal notes',
        'Canned responses and attachments',
        'Customer context drawn from their order history',
      ]}
    />
  );
}
