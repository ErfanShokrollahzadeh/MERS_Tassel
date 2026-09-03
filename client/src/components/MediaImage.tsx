'use client';

import Image from 'next/image';
import { useState } from 'react';
import { mediaUrl } from '@/lib/apiClient';

/**
 * Renders media stored by the API. Paths arrive relative (`/uploads/...`) and are resolved
 * against the API origin here, so callers can pass what the DTO gave them unchanged.
 */
export function MediaImage({
  src,
  alt,
  sizes,
  priority = false,
  className = '',
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const resolved = mediaUrl(src);

  // A product with no media yet still needs to occupy its slot in the grid.
  if (!resolved) {
    return <span className={`media-image media-image--empty${className ? ` ${className}` : ''}`} aria-hidden="true" />;
  }

  // Seeded editorial photographs can be remote while admin uploads remain local. Rendering
  // remote sources as a native image keeps the catalog open to any approved content host
  // without maintaining a growing Next.js domain allowlist; local uploads still use the
  // optimizer and same-origin API proxy below.
  if (/^https?:\/\//i.test(resolved)) {
    return (
      <span className={`media-image${loaded ? ' media-image--loaded' : ''}${className ? ` ${className}` : ''}`}>
        <span className="media-image__skeleton" aria-hidden="true" />
        <img src={resolved} alt={alt} className="media-image__asset" loading={priority ? 'eager' : 'lazy'} referrerPolicy="no-referrer" onLoad={() => setLoaded(true)} />
      </span>
    );
  }

  return (
    <span className={`media-image${loaded ? ' media-image--loaded' : ''}${className ? ` ${className}` : ''}`}>
      <span className="media-image__skeleton" aria-hidden="true" />
      <Image src={resolved} alt={alt} fill sizes={sizes} priority={priority} loading={priority ? 'eager' : undefined} className="media-image__asset" onLoad={() => setLoaded(true)} />
    </span>
  );
}
