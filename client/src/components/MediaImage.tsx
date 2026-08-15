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

  return (
    <span className={`media-image${loaded ? ' media-image--loaded' : ''}${className ? ` ${className}` : ''}`}>
      <span className="media-image__skeleton" aria-hidden="true" />
      <Image src={resolved} alt={alt} fill sizes={sizes} priority={priority} className="media-image__asset" onLoad={() => setLoaded(true)} />
    </span>
  );
}
