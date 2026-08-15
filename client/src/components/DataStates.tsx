'use client';

import { AlertCircle, PackageOpen, RefreshCw } from 'lucide-react';
import { ApiError } from '@/lib/apiClient';

/** Placeholder tiles that hold the catalog grid's shape while products load. */
export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="product-grid" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, index) => (
        <article className="tile-skeleton" key={index}>
          <span className="tile-skeleton__media skeleton-block" />
          <span className="tile-skeleton__line skeleton-block" />
          <span className="tile-skeleton__line tile-skeleton__line--short skeleton-block" />
        </article>
      ))}
      <span className="sr-only">Loading pieces…</span>
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="table-skeleton" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, row) => (
        <div className="table-skeleton__row" key={row}>
          {Array.from({ length: columns }).map((__, column) => (
            <span className="skeleton-block" key={column} />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function PanelSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="panel-skeleton" aria-busy="true">
      {Array.from({ length: lines }).map((_, index) => (
        <span className="skeleton-block" key={index} />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="state-block state-block--empty">
      <PackageOpen size={26} />
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}

/**
 * Failure state. A network-level failure is a different problem from a rejected request,
 * so it gets its own wording instead of showing the raw message.
 */
export function ErrorState({
  error,
  onRetry,
  title = 'Something went wrong',
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  const offline = error instanceof ApiError && error.status === 0;
  const message = offline
    ? 'The atelier service is not responding. Check that the API is running, then try again.'
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred.';

  return (
    <div className="state-block state-block--error" role="alert">
      <AlertCircle size={26} />
      <h3>{offline ? 'Cannot reach the service' : title}</h3>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="button button--ghost" onClick={onRetry}>
          <RefreshCw size={15} /> Try again
        </button>
      )}
    </div>
  );
}
