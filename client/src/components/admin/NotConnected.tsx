'use client';

import Link from 'next/link';
import { Construction } from 'lucide-react';

/**
 * Placeholder for admin sections whose backend is not part of this pass.
 *
 * These pages previously rendered invented figures — fake revenue, fake tickets — which is
 * worse than showing nothing, because it looks like real data. This states plainly that the
 * section is not wired up and points at what does work.
 */
export function NotConnected({
  kicker,
  title,
  summary,
  planned,
}: {
  kicker: string;
  title: string;
  summary: string;
  planned: string[];
}) {
  return (
    <>
      <div className="admin-page-heading">
        <div><span className="admin-kicker">{kicker}</span><h1>{title}</h1><p>{summary}</p></div>
      </div>

      <section className="admin-card not-connected">
        <Construction size={28} />
        <h2>Not connected yet</h2>
        <p>
          This section has no backend behind it in the current build. Rather than show invented
          numbers, it stays empty until the endpoints exist.
        </p>

        <div className="not-connected__list">
          <h3>Planned for this section</h3>
          <ul>{planned.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>

        <div className="not-connected__actions">
          <Link className="admin-button admin-button--primary" href="/admin">Back to overview</Link>
          <Link className="admin-button admin-button--secondary" href="/admin/orders">Go to orders</Link>
        </div>
      </section>
    </>
  );
}
