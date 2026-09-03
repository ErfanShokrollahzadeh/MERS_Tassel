'use client';

import { use, useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Copy, MessageCircle } from 'lucide-react';
import { BlogCard } from '@/components/BlogCard';
import { MediaImage } from '@/components/MediaImage';
import { useI18n, type Locale, type TranslationKey } from '@/i18n/I18nProvider';
import { blogKeys, fetchBlogPostBySlug, fetchFeaturedPosts, postBlogComment } from '@/lib/blog';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';

const categoryKeys: Record<string, TranslationKey> = {
  Craftsmanship: 'journal.category.craftsmanship',
  Styling: 'journal.category.styling',
  Materials: 'journal.category.materials',
  Atelier: 'journal.category.atelier',
};

function relativeDate(value: string, locale: Locale) {
  const difference = new Date(value).getTime() - Date.now();
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (Math.abs(difference) >= day) return formatter.format(Math.round(difference / day), 'day');
  if (Math.abs(difference) >= hour) return formatter.format(Math.round(difference / hour), 'hour');
  return formatter.format(Math.round(difference / minute), 'minute');
}

function ArticleContent({ content }: { content: string }) {
  const blocks = content.trim().split(/\n{2,}/);

  return (
    <div className="article-body">
      {blocks.map((block, index) => {
        const text = block.trim();
        if (!text) return null;
        if (text.startsWith('### ')) return <h3 key={index}>{text.slice(4)}</h3>;
        if (text.startsWith('## ')) return <h2 key={index}>{text.slice(3)}</h2>;
        if (text.startsWith('> ')) return <blockquote key={index}>{text.slice(2)}</blockquote>;

        const lines = text.split('\n');
        if (lines.every((line) => line.startsWith('- '))) {
          return <ul key={index}>{lines.map((line) => <li key={line}>{line.slice(2)}</li>)}</ul>;
        }

        return <p key={index}>{lines.map((line, lineIndex) => <span key={lineIndex}>{line}{lineIndex < lines.length - 1 && <br />}</span>)}</p>;
      })}
    </div>
  );
}

export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { locale, t } = useI18n();
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.show);
  const [shareUrl, setShareUrl] = useState('');
  const [form, setForm] = useState({ authorName: '', authorEmail: '', content: '' });
  const post = useQuery({ queryKey: blogKeys.detail(slug), queryFn: () => fetchBlogPostBySlug(slug) });
  const related = useQuery({ queryKey: blogKeys.featured(), queryFn: fetchFeaturedPosts });
  const comment = useMutation({
    mutationFn: () => postBlogComment(slug, {
      authorName: form.authorName.trim(),
      authorEmail: form.authorEmail.trim(),
      content: form.content.trim(),
    }),
    onSuccess: () => {
      setForm((current) => ({ ...current, content: '' }));
      showToast({ title: t('journal.commentThanks'), tone: 'success' });
    },
  });

  useEffect(() => {
    setShareUrl(new URL(`/blog/${encodeURIComponent(slug)}`, window.location.origin).toString());
  }, [slug]);

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      authorName: current.authorName || `${user.firstName} ${user.lastName}`.trim(),
      authorEmail: current.authorEmail || user.email,
    }));
  }, [user]);

  if (post.isPending) return <main className="section container-narrow state-message">{t('journal.loading')}</main>;
  if (post.isError || !post.data) {
    return (
      <main className="section container-narrow state-message">
        <p>{t('journal.error')}</p>
        <button type="button" className="button button--ghost" onClick={() => post.refetch()}>{t('common.retry')}</button>
      </main>
    );
  }

  const article = post.data;
  const title = locale === 'tr' && article.titleTr ? article.titleTr : article.title;
  const excerpt = locale === 'tr' && article.excerptTr ? article.excerptTr : article.excerpt;
  const content = locale === 'tr' && article.contentTr ? article.contentTr : article.content;
  const category = categoryKeys[article.category] ? t(categoryKeys[article.category]) : article.category;
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(shareUrl);

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast({ title: t('journal.copySuccess'), tone: 'success' });
    } catch {
      showToast({ title: t('common.unexpected'), tone: 'error' });
    }
  };

  return (
    <article className="article-layout">
      <header>
        <span className="article-category">{category}</span>
        <p className="article-meta">
          {t('journal.minRead', { count: article.readingTimeMinutes })}
          <span aria-hidden="true"> · </span>
          <time dateTime={article.publishedAt}>{new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(article.publishedAt))}</time>
          <span aria-hidden="true"> · </span>
          {t('journal.by', { name: article.authorName })}
        </p>
        <h1>{title}</h1>
        <p className="article-excerpt">{excerpt}</p>
      </header>

      {article.coverImagePath && (
        <figure>
          <MediaImage src={article.coverImagePath} alt={title} sizes="(max-width: 1440px) 100vw, 1440px" priority />
          <figcaption>{title} · MERS Atelier</figcaption>
        </figure>
      )}

      <div className="article-columns">
        <aside className="share-bar" aria-label={t('journal.share')}>
          <a href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          <a href={`https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`} target="_blank" rel="noopener noreferrer">Pinterest</a>
          <a href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`} target="_blank" rel="noopener noreferrer">X</a>
          <button type="button" onClick={copyLink}><Copy size={15} /> {t('journal.copyLink')}</button>
        </aside>
        <ArticleContent content={content} />
      </div>

      <section className="comment-section" aria-labelledby="comments-heading">
        <h2 id="comments-heading"><MessageCircle aria-hidden="true" /> {t('journal.comments')} ({article.comments.length})</h2>
        {article.comments.length === 0 && <p className="comment-empty">{t('journal.noComments')}</p>}
        <div>
          {article.comments.map((item) => (
            <article className="comment-bubble" key={item.id}>
              <header>
                <strong>{item.authorName}</strong>
                <time dateTime={item.createdAt} title={new Date(item.createdAt).toLocaleString(locale)}>{relativeDate(item.createdAt, locale)}</time>
              </header>
              <p>{item.content}</p>
            </article>
          ))}
        </div>

        <form onSubmit={(event) => { event.preventDefault(); comment.mutate(); }}>
          <h3>{t('journal.leaveComment')}</h3>
          <p className="comment-form-help">{t('journal.commentHelp')}</p>
          <div className="comment-fields">
            <label>
              {t('journal.name')}
              <input required maxLength={120} autoComplete="name" value={form.authorName} onChange={(event) => setForm({ ...form, authorName: event.target.value })} />
            </label>
            <label>
              {t('journal.email')}
              <input required maxLength={254} type="email" autoComplete="email" value={form.authorEmail} onChange={(event) => setForm({ ...form, authorEmail: event.target.value })} />
            </label>
          </div>
          <label>
            {t('journal.comment')}
            <textarea required minLength={3} maxLength={4000} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} />
          </label>
          <button className="button button--primary" disabled={comment.isPending}>
            {comment.isPending ? t('journal.submitting') : t('journal.submit')}
          </button>
          {comment.isError && <p className="form-error" role="alert">{t('journal.commentError')}</p>}
        </form>
      </section>

      {related.data && related.data.filter((item) => item.slug !== slug).length > 0 && (
        <section className="related-stories" aria-labelledby="related-heading">
          <h2 id="related-heading">{t('journal.related')}</h2>
          <div className="blog-grid">
            {related.data.filter((item) => item.slug !== slug).slice(0, 2).map((item) => <BlogCard key={item.id} post={item} />)}
          </div>
        </section>
      )}
    </article>
  );
}
