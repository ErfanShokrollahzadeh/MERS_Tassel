'use client';

import { useDeferredValue, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { BlogCard } from '@/components/BlogCard';
import { useI18n, type TranslationKey } from '@/i18n/I18nProvider';
import { blogKeys, fetchBlogPosts, fetchFeaturedPosts } from '@/lib/blog';

const categories: { value: string; label: TranslationKey }[] = [
  { value: 'All', label: 'journal.all' },
  { value: 'Craftsmanship', label: 'journal.category.craftsmanship' },
  { value: 'Styling', label: 'journal.category.styling' },
  { value: 'Materials', label: 'journal.category.materials' },
  { value: 'Atelier', label: 'journal.category.atelier' },
];

export default function BlogPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim());
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const query = {
    search: deferredSearch || undefined,
    tag: category === 'All' ? undefined : category,
    page,
    pageSize: 9,
  };
  const posts = useQuery({ queryKey: blogKeys.list(query), queryFn: () => fetchBlogPosts(query) });
  const featured = useQuery({ queryKey: blogKeys.featured(), queryFn: fetchFeaturedPosts });

  return (
    <>
      <section className="blog-hero" aria-labelledby="blog-page-title">
        <div className="container-wide">
          <span className="eyebrow">{t('journal.kicker')}</span>
          <h1 id="blog-page-title">{t('journal.pageTitle')}</h1>
          <p>{t('journal.pageLede')}</p>
          {featured.data?.[0] && (
            <div className="blog-featured">
              <span className="eyebrow">{t('journal.featured')}</span>
              <BlogCard post={featured.data[0]} />
            </div>
          )}
        </div>
      </section>

      <main className="section container-wide">
        <div className="blog-filters">
          <label>
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">{t('journal.search')}</span>
            <input
              type="search"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder={t('journal.search')}
            />
          </label>
          <div role="group" aria-label={t('journal.filters')}>
            {categories.map((item) => (
              <button
                key={item.value}
                type="button"
                className={category === item.value ? 'active' : ''}
                aria-pressed={category === item.value}
                onClick={() => { setCategory(item.value); setPage(1); }}
              >
                {t(item.label)}
              </button>
            ))}
          </div>
        </div>

        {posts.isPending && <p className="state-message">{t('journal.loading')}</p>}
        {posts.isError && (
          <div className="state-message">
            <p>{t('journal.error')}</p>
            <button type="button" className="button button--ghost" onClick={() => posts.refetch()}>{t('common.retry')}</button>
          </div>
        )}
        {posts.data && posts.data.items.length === 0 && <p className="state-message">{t('journal.empty')}</p>}
        {posts.data && posts.data.items.length > 0 && (
          <div className="blog-grid">{posts.data.items.map((post) => <BlogCard key={post.id} post={post} />)}</div>
        )}
        {posts.data && posts.data.totalPages > 1 && (
          <nav className="blog-pagination" aria-label={t('journal.title')}>
            <button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>
              ← <span>{t('common.previous')}</span>
            </button>
            <span>{page} / {posts.data.totalPages}</span>
            <button type="button" disabled={page === posts.data.totalPages} onClick={() => setPage((current) => current + 1)}>
              <span>{t('common.next')}</span> →
            </button>
          </nav>
        )}
      </main>
    </>
  );
}
