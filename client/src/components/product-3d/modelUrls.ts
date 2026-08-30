import { mediaUrl } from '@/lib/apiClient';

export function modelUrl(path?: string | null) {
  return mediaUrl(path);
}

export function productArUrl(slug: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const origin = typeof window !== 'undefined'
    ? (configured ? safeOrigin(configured) : window.location.origin)
    : (configured ? safeOrigin(configured) : 'http://localhost:3000');
  return `${origin}/products/${encodeURIComponent(slug)}?ar=1#product-3d`;
}

function safeOrigin(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.origin;
  } catch {
    return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  }
}
