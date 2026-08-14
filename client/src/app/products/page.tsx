'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { ProductTile } from '@/components/ProductTile';
import { products } from '@/data/store';
import { useI18n } from '@/i18n/I18nProvider';
import { categoryName, productCopy } from '@/i18n/catalog';

const filters = [
  { name: 'All pieces', slug: '' }, { name: 'Necklaces', slug: 'necklaces' }, { name: 'Pendants', slug: 'pendants' },
  { name: 'Earrings', slug: 'earrings' }, { name: 'Rings', slug: 'rings' }, { name: 'Bracelets', slug: 'bracelets' }, { name: 'Bag charms', slug: 'bag-charms' },
];

function Catalog() {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(searchParams.get('sort') === 'new' ? 'newest' : 'featured');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const visible = useMemo(() => {
    const filtered = products.filter((product) => { const display = productCopy(product, locale); return (!category || product.categorySlug === category) && (!query || `${display.name} ${display.category} ${display.description}`.toLocaleLowerCase(locale).includes(query.toLocaleLowerCase(locale))); });
    return [...filtered].sort((a, b) => sort === 'price-low' ? a.price.amount - b.price.amount : sort === 'price-high' ? b.price.amount - a.price.amount : sort === 'newest' ? Number(b.isNew) - Number(a.isNew) : Number(b.isFeatured) - Number(a.isFeatured));
  }, [category, locale, query, sort]);

  return (
    <div className="catalog-page">
      <section className="catalog-hero"><div className="ambient ambient--one" /><div className="container-wide"><span className="eyebrow"><Sparkles size={12} /> {t('catalog.eyebrow')}</span><h1>{t('catalog.title1')}<br /><em>{t('catalog.title2')}</em></h1><p>{t('catalog.lede')}</p></div></section>
      <section className="catalog-shell container-wide">
        <div className="catalog-toolbar">
          <div className="category-tabs" role="tablist" aria-label={t('catalog.categories')}>{filters.map((filter) => <button key={filter.slug} role="tab" aria-selected={category === filter.slug} onClick={() => setCategory(filter.slug)}>{filter.slug ? categoryName(filter.name, locale) : t('catalog.all')}</button>)}</div>
          <button className="filter-trigger" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen}><SlidersHorizontal size={16} /> {t('catalog.filters')}</button>
          <label className="sort-control"><span className="sr-only">{t('catalog.sort')}</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">{t('catalog.featured')}</option><option value="newest">{t('catalog.newest')}</option><option value="price-low">{t('catalog.low')}</option><option value="price-high">{t('catalog.high')}</option></select><ChevronDown size={15} /></label>
        </div>
        {filtersOpen && <div className="filter-panel glass-panel"><label><span>{t('catalog.search')}</span><div><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('catalog.searchPlaceholder')} />{query && <button onClick={() => setQuery('')} aria-label={t('catalog.clearSearch')}><X size={15} /></button>}</div></label><label><span>{t('catalog.availability')}</span><select><option>{t('catalog.allAvailability')}</option><option>{t('catalog.ready')}</option><option>{t('catalog.made')}</option></select></label><label><span>{t('catalog.material')}</span><select><option>{t('catalog.allMaterials')}</option><option>{t('catalog.gold')}</option><option>{t('catalog.silver')}</option><option>{t('catalog.silk')}</option></select></label></div>}
        <div className="catalog-meta"><span>{t('catalog.count', { count: visible.length })}</span>{(category || query) && <button onClick={() => { setCategory(''); setQuery(''); }}>{t('catalog.clear')} <X size={13} /></button>}</div>
        {visible.length ? <div className="product-grid catalog-grid">{visible.map((product) => <ProductTile key={product.id} product={product} />)}</div> : <div className="empty-results"><h2>{t('catalog.empty')}</h2><p>{t('catalog.emptyCopy')}</p><button className="button button--primary" onClick={() => { setCategory(''); setQuery(''); }}>{t('catalog.viewAll')}</button></div>}
      </section>
      <section className="catalog-note"><div className="container-narrow"><span className="eyebrow">{t('catalog.promise')}</span><h2>{t('catalog.promiseTitle')}</h2><p>{t('catalog.promiseCopy')}</p></div></section>
    </div>
  );
}

export default function ProductsPage() { return <Suspense fallback={<div className="page-loading">Curating the collection…</div>}><Catalog /></Suspense>; }
