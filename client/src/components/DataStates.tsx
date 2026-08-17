'use client';

import { AlertCircle, PackageOpen, RefreshCw } from 'lucide-react';
import { ApiError } from '@/lib/apiClient';
import { useI18n } from '@/i18n/I18nProvider';

/** Placeholder tiles that hold the catalog grid's shape while products load. */
export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  const { t } = useI18n();
  return (
    <div className="product-grid" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, index) => (
        <article className="tile-skeleton" key={index}>
          <span className="tile-skeleton__media skeleton-block" />
          <span className="tile-skeleton__line skeleton-block" />
          <span className="tile-skeleton__line tile-skeleton__line--short skeleton-block" />
        </article>
      ))}
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  const { t } = useI18n();
  return (
    <div className="table-skeleton" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, row) => (
        <div className="table-skeleton__row" key={row}>
          {Array.from({ length: columns }).map((__, column) => (
            <span className="skeleton-block" key={column} />
          ))}
        </div>
      ))}
      <span className="sr-only">{t('common.loadingShort')}</span>
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
  title,
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  const { t } = useI18n();
  const offline = error instanceof ApiError && error.status === 0;
  const message = offline ? t('common.offlineCopy') : t('common.unexpected');

  return (
    <div className="state-block state-block--error" role="alert">
      <AlertCircle size={26} />
      <h3>{offline ? t('common.offlineTitle') : title || t('common.errorTitle')}</h3>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="button button--ghost" onClick={onRetry}>
          <RefreshCw size={15} /> {t('common.retry')}
        </button>
      )}
    </div>
  );
}
