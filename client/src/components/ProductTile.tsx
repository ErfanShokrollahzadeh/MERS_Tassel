'use client';

import Link from 'next/link';
import { ArrowUpRight, Heart, Plus } from 'lucide-react';
import { Product } from '@/types/commerce';
import { useCartStore } from '@/stores/cart';
import { MediaImage } from '@/components/MediaImage';

export function ProductTile({ product, priority = false }: { product: Product; priority?: boolean }) {
  const add = useCartStore((state) => state.add);
  const sale = product.compareAt && product.compareAt.amount > product.price.amount;

  return (
    <article className="product-tile">
      <div className="product-tile__media">
        <Link href={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
          <MediaImage src={product.image} alt={product.name} sizes="(max-width: 720px) 50vw, (max-width: 1050px) 50vw, 25vw" priority={priority} />
        </Link>
        <div className="product-badges">{product.isNew && <span className="badge">New</span>}{sale && <span className="badge badge--dark">Save ${product.compareAt!.amount - product.price.amount}</span>}{product.stock === 0 && <span className="badge badge--muted">Sold out</span>}</div>
        <button className="tile-heart" aria-label={`Save ${product.name}`}><Heart size={18} /></button>
        <button className="quick-add" onClick={() => add(product)} disabled={product.stock === 0}><Plus size={16} /> {product.stock === 0 ? 'Unavailable' : 'Quick add'}</button>
      </div>
      <div className="product-tile__body">
        <div><p>{product.category}</p><Link href={`/products/${product.slug}`}><h3>{product.name}</h3></Link></div>
        <div className="product-price"><strong>${product.price.amount}</strong>{sale && <del>${product.compareAt!.amount}</del>}<ArrowUpRight size={16} /></div>
      </div>
    </article>
  );
}
