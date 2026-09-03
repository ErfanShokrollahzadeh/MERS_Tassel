'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { MediaImage } from '@/components/MediaImage';
import { useI18n, type TranslationKey } from '@/i18n/I18nProvider';
import type { BlogPostSummary } from '@/types/blog';

const categoryKeys: Record<string, TranslationKey> = {
  Craftsmanship: 'journal.category.craftsmanship',
  Styling: 'journal.category.styling',
  Materials: 'journal.category.materials',
  Atelier: 'journal.category.atelier',
};

export function BlogCard({ post }: { post: BlogPostSummary }) {
  const { locale, t } = useI18n();
  const title = locale === 'tr' && post.titleTr ? post.titleTr : post.title;
  const excerpt = locale === 'tr' && post.excerptTr ? post.excerptTr : post.excerpt;
  const category = categoryKeys[post.category] ? t(categoryKeys[post.category]) : post.category;

  return (
    <article className="blog-card">
      <Link className="blog-card__image" href={`/blog/${post.slug}`} aria-label={title}>
        {post.coverImagePath ? (
          <MediaImage
            src={post.coverImagePath}
            alt={title}
            sizes="(max-width: 800px) 100vw, 33vw"
          />
        ) : (
          <span className="blog-card__placeholder" aria-hidden="true" />
        )}
        <span className="blog-card__category">{category}</span>
      </Link>
      <div className="blog-card__copy">
        <time dateTime={post.publishedAt}>
          {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(post.publishedAt))}
        </time>
        <h3><Link href={`/blog/${post.slug}`}>{title}</Link></h3>
        <p>{excerpt}</p>
        <footer>
          <span>{t('journal.minRead', { count: post.readingTimeMinutes })}</span>
          <Link href={`/blog/${post.slug}`} aria-label={title}><ArrowUpRight size={18} /></Link>
        </footer>
      </div>
    </article>
  );
}
