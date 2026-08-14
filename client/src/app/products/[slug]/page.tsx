import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findProduct, products } from '@/data/store';
import { ProductDetail } from '@/components/ProductDetail';

export function generateStaticParams() { return products.map((product) => ({ slug: product.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) return { title: 'Piece not found' };
  return {
    title: product.name,
    description: product.description,
    openGraph: { title: `${product.name} · MERS Tassel`, description: product.description, images: [{ url: product.image }] },
    twitter: { card: 'summary_large_image', title: `${product.name} · MERS Tassel`, description: product.description, images: [product.image] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
