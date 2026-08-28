'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowUpRight, Heart, Plus } from 'lucide-react';
import { Product } from '@/types/commerce';
import { useCartStore } from '@/stores/cart';
import { MediaImage } from '@/components/MediaImage';
import { useI18n } from '@/i18n/I18nProvider';
import { productCopy } from '@/i18n/catalog';
import { useAuthStore } from '@/stores/auth';
import { formatMoney } from '@/lib/money';

export function ProductTile({ product, priority = false }: { product: Product; priority?: boolean }) {
  const add = useCartStore((state) => state.add);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const pathname = usePathname();
  const { t, locale } = useI18n();
  const display = productCopy(product, locale);
  const sale = product.compareAt && product.compareAt.amount > product.price.amount;

  const addProtected = () => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    // Quick-add takes the first available finish; the detail page is where colour is chosen.
    const firstInStock = product.variants.find((variant) => variant.stock > 0) ?? product.variants[0];
    if (!firstInStock) return;
    void add(product.slug, firstInStock.color);
  };

  return (
    <article className="product-tile">
      <div className="product-tile__media">
        <Link href={`/products/${product.slug}`} aria-label={t('product.view', { name: display.name })}>
          <MediaImage src={product.image} alt={display.name} sizes="(max-width: 720px) 50vw, (max-width: 1050px) 50vw, 25vw" priority={priority} />
        </Link>
        <div className="product-badges">{product.isNew && <span className="badge">{t('product.new')}</span>}{sale && <span className="badge badge--dark">{t('product.save', { amount: formatMoney(product.compareAt!.amount - product.price.amount, locale) })}</span>}{product.stock === 0 && <span className="badge badge--muted">{t('product.soldOut')}</span>}</div>
        <button className="tile-heart" aria-label={t('product.savePiece', { name: display.name })}><Heart size={18} /></button>
        <button className="quick-add" onClick={addProtected} disabled={product.stock === 0}><Plus size={16} /> {product.stock === 0 ? t('product.unavailable') : t('product.quickAdd')}</button>
      </div>
      <div className="product-tile__body">
        <div><p>{display.category}</p><Link href={`/products/${product.slug}`}><h3>{display.name}</h3></Link></div>
        <div className="product-price"><strong>{formatMoney(product.price.amount, locale)}</strong>{sale && <del>{formatMoney(product.compareAt!.amount, locale)}</del>}<ArrowUpRight size={16} /></div>
      </div>
    </article>
  );
}
