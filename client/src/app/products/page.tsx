'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { ProductTile } from '@/components/ProductTile';
import { products } from '@/data/store';

const filters = [
  { name: 'All pieces', slug: '' }, { name: 'Necklaces', slug: 'necklaces' }, { name: 'Pendants', slug: 'pendants' },
  { name: 'Earrings', slug: 'earrings' }, { name: 'Rings', slug: 'rings' }, { name: 'Bracelets', slug: 'bracelets' }, { name: 'Bag charms', slug: 'bag-charms' },
];

function Catalog() {
  const searchParams = useSearchParams();
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(searchParams.get('sort') === 'new' ? 'newest' : 'featured');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const visible = useMemo(() => {
    const filtered = products.filter((product) => (!category || product.categorySlug === category) && (!query || `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase())));
    return [...filtered].sort((a, b) => sort === 'price-low' ? a.price.amount - b.price.amount : sort === 'price-high' ? b.price.amount - a.price.amount : sort === 'newest' ? Number(b.isNew) - Number(a.isNew) : Number(b.isFeatured) - Number(a.isFeatured));
  }, [category, query, sort]);

  return (
    <div className="catalog-page">
      <section className="catalog-hero"><div className="ambient ambient--one" /><div className="container-wide"><span className="eyebrow"><Sparkles size={12} /> The collection</span><h1>Objects for<br /><em>everyday wonder.</em></h1><p>Made slowly in Istanbul. Designed to feel unmistakably yours.</p></div></section>
      <section className="catalog-shell container-wide">
        <div className="catalog-toolbar">
          <div className="category-tabs" role="tablist" aria-label="Product categories">{filters.map((filter) => <button key={filter.slug} role="tab" aria-selected={category === filter.slug} onClick={() => setCategory(filter.slug)}>{filter.name}</button>)}</div>
          <button className="filter-trigger" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen}><SlidersHorizontal size={16} /> Filters</button>
          <label className="sort-control"><span className="sr-only">Sort products</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select><ChevronDown size={15} /></label>
        </div>
        {filtersOpen && <div className="filter-panel glass-panel"><label><span>Search the collection</span><div><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try ‘pearl’ or ‘ring’" />{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={15} /></button>}</div></label><label><span>Availability</span><select><option>All availability</option><option>Ready to ship</option><option>Made to order</option></select></label><label><span>Material</span><select><option>All materials</option><option>Gold vermeil</option><option>Sterling silver</option><option>Silk</option></select></label></div>}
        <div className="catalog-meta"><span>{visible.length} considered pieces</span>{(category || query) && <button onClick={() => { setCategory(''); setQuery(''); }}>Clear filters <X size={13} /></button>}</div>
        {visible.length ? <div className="product-grid catalog-grid">{visible.map((product) => <ProductTile key={product.id} product={product} />)}</div> : <div className="empty-results"><h2>No pieces found.</h2><p>Try a broader search or clear your filters.</p><button className="button button--primary" onClick={() => { setCategory(''); setQuery(''); }}>View all pieces</button></div>}
      </section>
      <section className="catalog-note"><div className="container-narrow"><span className="eyebrow">The MERS promise</span><h2>Made in small editions.<br />Never mass produced.</h2><p>Our hands set the pace. When a piece is gone, it may take a little while to return—and sometimes that is part of its beauty.</p></div></section>
    </div>
  );
}

export default function ProductsPage() { return <Suspense fallback={<div className="page-loading">Curating the collection…</div>}><Catalog /></Suspense>; }
