'use client';

import Image from 'next/image';
import { useState } from 'react';

export function MediaImage({ src, alt, sizes, priority = false, className = '' }: { src: string; alt: string; sizes: string; priority?: boolean; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  return <span className={`media-image${loaded ? ' media-image--loaded' : ''}${className ? ` ${className}` : ''}`}>
    <span className="media-image__skeleton" aria-hidden="true" />
    <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="media-image__asset" onLoad={() => setLoaded(true)} />
  </span>;
}
