'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, Clock, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { blogKeys, fetchBlogPosts } from '@/lib/blog';
import { mediaUrl } from '@/lib/apiClient';
import { useI18n } from '@/i18n/I18nProvider';

const categories = ['', 'Craftsmanship', 'Styling', 'Materials', 'Atelier'];

export function BlogListing() {
  const { locale } = useI18n();
  const [tag, setTag] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const q = useQuery({
    queryKey: blogKeys.list({ tag, search, page, pageSize: 9 }),
    queryFn: () => fetchBlogPosts({ tag, search, page, pageSize: 9 }),
  });

  const first = q.data?.items[0];

  return (
    <main className="journal-page">
      <section className="blog-hero">
        <div className="container-wide">
          <span className="eyebrow">MERS · Journal</span>
          <h1>{locale === 'tr' ? 'Ellerden doğan hikâyeler.' : 'Stories shaped by hand.'}</h1>
          <p>
            {locale === 'tr'
              ? 'Zanaat, malzeme ve iyi yaşanmış nesneler üzerine notlar.'
              : 'Notes on craftsmanship, materials, and objects made to live beautifully.'}
          </p>
          {first && (
            <Link href={`/blog/${first.slug}`} className="blog-hero__feature">
              <span>{first.category}</span>
              <strong>{locale === 'tr' && first.titleTr ? first.titleTr : first.title}</strong>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </section>

      <section className="section journal-section">
        <div className="container-wide">
          <div className="blog-filters">
            <label className="blog-search-input">
              <Search size={16} aria-hidden="true" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={locale === 'tr' ? 'Hikâyelerde ara…' : 'Search stories…'}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="blog-search-clear"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </label>
            <div className="blog-filters__categories" role="tablist">
              {categories.map((c) => (
                <button
                  key={c || 'all'}
                  role="tab"
                  aria-selected={tag === c}
                  className={tag === c ? 'active' : ''}
                  onClick={() => {
                    setTag(c);
                    setPage(1);
                  }}
                >
                  {c || (locale === 'tr' ? 'Tümü' : 'All')}
                </button>
              ))}
            </div>
          </div>

          {q.isPending && (
            <div className="blog-state">
              <div className="blog-spinner" />
              <p>{locale === 'tr' ? 'Hikâyeler toplanıyor…' : 'Gathering stories…'}</p>
            </div>
          )}

          {q.isError && (
            <div className="blog-state blog-state--error">
              <p>{locale === 'tr' ? 'Günlük yüklenemedi.' : 'The journal could not be loaded.'}</p>
            </div>
          )}

          {q.data && !q.data.items.length && (
            <div className="blog-state">
              <p>{locale === 'tr' ? 'Hikâye bulunamadı. Başka bir arama deneyin.' : 'No stories found. Try another search.'}</p>
            </div>
          )}

          <div className="blog-grid">
            {q.data?.items.map((p) => (
              <Link className="blog-card" href={`/blog/${p.slug}`} key={p.id}>
                <div className="blog-card__image">
                  {p.coverImagePath ? (
                    <img
                      src={mediaUrl(p.coverImagePath)}
                      alt={locale === 'tr' && p.titleTr ? p.titleTr : p.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="blog-card__placeholder">
                      <span>MERS</span>
                    </div>
                  )}
                  <span className="blog-card__category-badge">{p.category}</span>
                </div>
                <div className="blog-card__copy">
                  <div className="blog-card__meta">
                    <time dateTime={p.publishedAt}>
                      {new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }).format(new Date(p.publishedAt))}
                    </time>
                    <span className="blog-card__meta-divider" aria-hidden="true">·</span>
                    <span className="blog-card__reading-time">
                      <Clock size={12} />
                      {p.readingTimeMinutes} {locale === 'tr' ? 'dk okuma' : 'min read'}
                    </span>
                  </div>
                  <h2 className="blog-card__heading">
                    {locale === 'tr' && p.titleTr ? p.titleTr : p.title}
                  </h2>
                  <p className="blog-card__summary">
                    {locale === 'tr' && p.excerptTr ? p.excerptTr : p.excerpt}
                  </p>
                  <div className="blog-card__footer">
                    <span className="blog-card__read-link">
                      {locale === 'tr' ? 'Hikâyeyi Keşfet' : 'Explore story'}
                      <ArrowRight size={13} className="blog-card__arrow" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {q.data && q.data.totalPages > 1 && (
            <nav className="blog-pagination" aria-label="Pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage((x) => x - 1)}
                className="button button--ghost"
              >
                ← {locale === 'tr' ? 'Önceki' : 'Previous'}
              </button>
              <span>
                {page} / {q.data.totalPages}
              </span>
              <button
                disabled={page === q.data.totalPages}
                onClick={() => setPage((x) => x + 1)}
                className="button button--ghost"
              >
                {locale === 'tr' ? 'Sonraki' : 'Next'} →
              </button>
            </nav>
          )}
        </div>
      </section>
    </main>
  );
}
