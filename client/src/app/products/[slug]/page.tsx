import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { ProductDetail } from '@/components/ProductDetail';
import { fetchProduct, fetchRelatedProducts } from '@/lib/catalog';
import { mediaUrl } from '@/lib/apiClient';
import { productCopy } from '@/i18n/catalog';
import type { Product } from '@/types/commerce';

/**
 * Rendered per request rather than prebuilt: the catalog is now editable from the admin
 * panel, so a build-time snapshot of slugs would go stale the moment a product is added.
 */
export const dynamic = 'force-dynamic';

async function loadProduct(slug: string): Promise<Product | null> {
  try {
    return await fetchProduct(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return { title: 'Piece not found' };

  const cookieStore = await cookies();
  const locale = cookieStore.get('mers-locale')?.value === 'tr' ? 'tr' : 'en';
  const display = productCopy(product, locale);

  // Open Graph needs absolute URLs; stored paths are relative to the API host.
  const image = mediaUrl(product.image);

  return {
    title: product.seoTitle || display.name,
    description: product.metaDescription || display.description,
    openGraph: {
      title: `${display.name} · MERS Tassel`,
      description: display.description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${display.name} · MERS Tassel`,
      description: display.description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) notFound();

  // A failed related-products call must not take down the product page itself.
  const related = await fetchRelatedProducts(slug, 4).catch(() => []);

  return <ProductDetail product={product} related={related} />;
}
