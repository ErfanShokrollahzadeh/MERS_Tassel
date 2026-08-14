import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findProduct, products } from '@/data/store';
import { ProductDetail } from '@/components/ProductDetail';
import { cookies } from 'next/headers';
import { productCopy } from '@/i18n/catalog';

export function generateStaticParams() { return products.map((product) => ({ slug: product.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) return { title: 'Piece not found' };
  const cookieStore = await cookies();
  const locale = cookieStore.get('mers-locale')?.value === 'tr' ? 'tr' : 'en';
  const display = productCopy(product, locale);
  return {
    title: display.name,
    description: display.description,
    openGraph: { title: `${display.name} · MERS Tassel`, description: display.description, images: [{ url: product.image }] },
    twitter: { card: 'summary_large_image', title: `${display.name} · MERS Tassel`, description: display.description, images: [product.image] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
