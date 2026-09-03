'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import { blogKeys, fetchFeaturedPosts } from '@/lib/blog';
import { BlogCard } from '@/components/BlogCard';
import { useI18n } from '@/i18n/I18nProvider';

export function EditorialJournalSection() {
  const { t } = useI18n();
  const featured = useQuery({
    queryKey: blogKeys.featured(),
    queryFn: fetchFeaturedPosts,
  });

  return (
    <section className="editorial-journal section" aria-labelledby="journal-heading">
      <div className="container-wide">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t('journal.kicker')}</span>
            <h2 id="journal-heading">{t('journal.title')}</h2>
          </div>
          <Link href="/blog">{t('journal.explore')} <ArrowUpRight size={16} /></Link>
        </div>

        {featured.isPending && (
          <div className="blog-grid" aria-label={t('journal.loading')}>
            {[1, 2, 3].map((item) => <span key={item} className="blog-card blog-card--skeleton skeleton-block" />)}
          </div>
        )}
        {featured.isError && <p className="state-message">{t('journal.error')}</p>}
        {featured.data && featured.data.length > 0 && (
          <div className="blog-grid">{featured.data.map((post) => <BlogCard key={post.id} post={post} />)}</div>
        )}
      </div>
    </section>
  );
}
