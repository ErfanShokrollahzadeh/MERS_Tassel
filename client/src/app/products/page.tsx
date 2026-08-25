'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ProductTile } from '@/components/ProductTile';
import { EmptyState, ErrorState, ProductGridSkeleton } from '@/components/DataStates';
import { catalogKeys, fetchCategories, fetchProducts, type CatalogSort } from '@/lib/catalog';
import { useI18n } from '@/i18n/I18nProvider';
import { categoryName } from '@/i18n/catalog';

const PAGE_SIZE = 12;

function Catalog() {
  const { t, locale } = useI18n();
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const shouldFocusSearch = searchParams.get('focus') === 'search';

  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [query, setQuery] = useState(urlSearch);
  const [debouncedQuery, setDebouncedQuery] = useState(urlSearch);
  const [sort, setSort] = useState<CatalogSort>(searchParams.get('sort') === 'new' ? 'newest' : 'featured');
  const [filtersOpen, setFiltersOpen] = useState(Boolean(urlSearch) || shouldFocusSearch);
  const [page, setPage] = useState(1);
  useEffect(() => {
    const video = heroVideoRef.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!video) return;

    const syncMotionPreference = () => {
      if (reducedMotion.matches) {
        video.pause();
        return;
      }

      video.muted = true;
      video.defaultMuted = true;
      void video.play().catch(() => undefined);
    };

    syncMotionPreference();
    reducedMotion.addEventListener('change', syncMotionPreference);
    return () => reducedMotion.removeEventListener('change', syncMotionPreference);
  }, []);

  // Debounce so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Navbar searches can target this route while it is already mounted.
  useEffect(() => {
    setQuery(urlSearch);
    setDebouncedQuery(urlSearch);
    if (urlSearch || shouldFocusSearch) setFiltersOpen(true);
  }, [urlSearch, shouldFocusSearch]);

  // Any change to the filters invalidates the current page number.
  useEffect(() => setPage(1), [category, debouncedQuery, sort]);

  const params = useMemo(
    () => ({ category: category || undefined, search: debouncedQuery || undefined, sort, page, pageSize: PAGE_SIZE }),
    [category, debouncedQuery, sort, page],
  );

  const products = useQuery({
    queryKey: catalogKeys.products(params),
    queryFn: () => fetchProducts(params),
    // Keeps the previous page visible while the next one loads, avoiding a full-grid flash.
    placeholderData: keepPreviousData,
  });

  const categories = useQuery({ queryKey: catalogKeys.categories(), queryFn: () => fetchCategories() });

  const clearAll = () => { setCategory(''); setQuery(''); setDebouncedQuery(''); };
  const result = products.data;

  return (
    <div className="catalog-page">
      <section className="catalog-hero catalog-hero--video">
        <video
          ref={heroVideoRef}
          className="catalog-hero__video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/images/products-collection-video-poster.jpg"
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src="/videos/products-collection-hero.mp4" type="video/mp4" />
        </video>
        <div className="catalog-hero__veil" aria-hidden="true" />
        <div className="ambient ambient--one" />
        <div className="container-wide catalog-hero__content">
          <span className="eyebrow"><Sparkles size={12} /> {t('catalog.eyebrow')}</span>
          <h1>{t('catalog.title1')}<br /><em>{t('catalog.title2')}</em></h1>
          <p>{t('catalog.lede')}</p>
        </div>
      </section>

      <section id="catalog-products" className="catalog-shell container-wide">
        <div className="catalog-toolbar">
          <div className="category-tabs" role="tablist" aria-label={t('catalog.categories')}>
            <button role="tab" aria-selected={category === ''} onClick={() => setCategory('')}>{t('catalog.all')}</button>
            {categories.data?.map((item) => (
              <button key={item.slug} role="tab" aria-selected={category === item.slug} onClick={() => setCategory(item.slug)}>
                {categoryName(item, locale)}
              </button>
            ))}
          </div>
          <button className="filter-trigger" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen}><SlidersHorizontal size={16} /> {t('catalog.filters')}</button>
          <label className="sort-control">
            <span className="sr-only">{t('catalog.sort')}</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as CatalogSort)}>
              <option value="featured">{t('catalog.featured')}</option>
              <option value="newest">{t('catalog.newest')}</option>
              <option value="price-low">{t('catalog.low')}</option>
              <option value="price-high">{t('catalog.high')}</option>
            </select>
            <ChevronDown size={15} />
          </label>
        </div>

        {filtersOpen && (
          <div className="filter-panel glass-panel">
            <label>
              <span>{t('catalog.search')}</span>
              <div>
                <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('catalog.searchPlaceholder')} />
                {query && <button onClick={() => setQuery('')} aria-label={t('catalog.clearSearch')}><X size={15} /></button>}
              </div>
            </label>
          </div>
        )}

        <div className="catalog-meta">
          <span>{result ? t('catalog.count', { count: result.total }) : ' '}</span>
          {(category || query) && <button onClick={clearAll}>{t('catalog.clear')} <X size={13} /></button>}
        </div>

        {products.isPending && <ProductGridSkeleton count={PAGE_SIZE} />}
        {products.isError && <ErrorState error={products.error} onRetry={() => products.refetch()} />}

        {result && (result.items.length ? (
          <>
            <div className={`product-grid catalog-grid${products.isFetching ? ' product-grid--refreshing' : ''}`}>
              {result.items.map((product) => <ProductTile key={product.id} product={product} />)}
            </div>
            {result.totalPages > 1 && (
              <nav className="catalog-pagination" aria-label={t('catalog.sort')}>
                <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>{t('common.previous')}</button>
                {Array.from({ length: result.totalPages }).map((_, index) => (
                  <button key={index} className={page === index + 1 ? 'active' : ''} onClick={() => setPage(index + 1)} aria-current={page === index + 1 ? 'page' : undefined}>
                    {index + 1}
                  </button>
                ))}
                <button disabled={page >= result.totalPages} onClick={() => setPage((current) => current + 1)}>{t('common.next')}</button>
              </nav>
            )}
          </>
        ) : (
          <EmptyState title={t('catalog.empty')} message={t('catalog.emptyCopy')} action={<button className="button button--primary" onClick={clearAll}>{t('catalog.viewAll')}</button>} />
        ))}
      </section>

      <section className="catalog-note"><div className="container-narrow"><span className="eyebrow">{t('catalog.promise')}</span><h2>{t('catalog.promiseTitle')}</h2><p>{t('catalog.promiseCopy')}</p></div></section>
    </div>
  );
}

export default function ProductsPage() {
  const { t } = useI18n();
  return <Suspense fallback={<div className="page-loading">{t('common.loading')}</div>}><Catalog /></Suspense>;
}
