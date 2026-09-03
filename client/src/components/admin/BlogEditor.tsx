'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  adminBlogKeys,
  blogKeys,
  createBlogPost,
  fetchAdminPost,
  updateBlogPost,
  uploadBlogCover,
} from '@/lib/blog';
import { mediaUrl } from '@/lib/apiClient';
import { useToastStore } from '@/stores/toast';
import type { BlogPostInput } from '@/types/blog';

const categories = ['Craftsmanship', 'Styling', 'Materials', 'Atelier'];

const emptyPost = (): BlogPostInput => ({
  title: '',
  titleTr: '',
  slug: '',
  excerpt: '',
  excerptTr: '',
  content: '',
  contentTr: '',
  category: 'Craftsmanship',
  tags: '',
  authorName: 'MERS Atelier',
  readingTimeMinutes: 3,
  isPublished: true,
  publishedAt: new Date().toISOString(),
});

const slugify = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const toDateTimeInput = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

export function BlogEditor({ id }: { id?: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.show);
  const [form, setForm] = useState<BlogPostInput>(emptyPost);
  const [manualSlug, setManualSlug] = useState(false);
  const post = useQuery({
    queryKey: adminBlogKeys.post(id ?? 0),
    queryFn: () => fetchAdminPost(id!),
    enabled: id !== undefined && Number.isFinite(id),
  });
  const cover = useMutation({
    mutationFn: uploadBlogCover,
    onSuccess: (coverImagePath) => setForm((current) => ({ ...current, coverImagePath })),
    onError: (error) => showToast({
      tone: 'error',
      title: 'Cover upload failed',
      message: error instanceof Error ? error.message : 'Choose a JPEG, PNG or WebP image up to 10 MB.',
    }),
  });
  const save = useMutation({
    mutationFn: (input: BlogPostInput) => id ? updateBlogPost(id, input) : createBlogPost(input),
    onSuccess: async (saved) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminBlogKeys.all }),
        queryClient.invalidateQueries({ queryKey: blogKeys.all }),
      ]);
      showToast({ tone: 'success', title: id ? 'Story updated' : 'Story published', message: saved.title });
      router.push('/admin/blog');
    },
    onError: (error) => showToast({
      tone: 'error',
      title: 'Could not save this story',
      message: error instanceof Error ? error.message : '',
    }),
  });

  useEffect(() => {
    if (!post.data) return;
    setForm({
      title: post.data.title,
      titleTr: post.data.titleTr ?? '',
      slug: post.data.slug,
      excerpt: post.data.excerpt,
      excerptTr: post.data.excerptTr ?? '',
      content: post.data.content,
      contentTr: post.data.contentTr ?? '',
      coverImagePath: post.data.coverImagePath,
      authorName: post.data.authorName,
      authorAvatarPath: post.data.authorAvatarPath,
      category: post.data.category,
      tags: post.data.tags ?? '',
      readingTimeMinutes: post.data.readingTimeMinutes,
      isPublished: post.data.isPublished,
      publishedAt: post.data.publishedAt,
    });
    setManualSlug(true);
  }, [post.data]);

  const set = <Key extends keyof BlogPostInput>(key: Key, value: BlogPostInput[Key]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    save.mutate({
      ...form,
      title: form.title.trim(),
      titleTr: form.titleTr?.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim(),
      excerptTr: form.excerptTr?.trim(),
      content: form.content.trim(),
      contentTr: form.contentTr?.trim(),
      authorName: form.authorName.trim() || 'MERS Atelier',
      category: form.category.trim(),
      tags: form.tags?.trim(),
    });
  };

  if (id !== undefined && (!Number.isFinite(id) || post.isError)) {
    return <div className="admin-page"><p className="admin-empty form-error">This story could not be loaded.</p></div>;
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div><span className="eyebrow">Editorial studio</span><h1>{id ? 'Edit story' : 'New story'}</h1></div>
        <button
          className="admin-button admin-button--primary"
          type="submit"
          form="blog-editor-form"
          disabled={save.isPending || cover.isPending || (id !== undefined && post.isPending)}
        >
          {save.isPending ? 'Saving…' : 'Save story'}
        </button>
      </header>

      {id !== undefined && post.isPending ? (
        <p className="admin-empty">Loading story…</p>
      ) : (
        <form id="blog-editor-form" className="admin-form-grid" onSubmit={submit}>
          <section className="admin-card">
            <h2>Story</h2>
            <label>
              Title (EN)
              <input required maxLength={240} value={form.title} onChange={(event) => {
                set('title', event.target.value);
                if (!manualSlug) set('slug', slugify(event.target.value));
              }} />
            </label>
            <label>Title (TR)<input maxLength={240} value={form.titleTr} onChange={(event) => set('titleTr', event.target.value)} /></label>
            <label>
              Slug
              <input required maxLength={240} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(event) => {
                setManualSlug(true);
                set('slug', slugify(event.target.value));
              }} />
              <small>Used in the public URL. Lowercase letters, numbers, and hyphens only.</small>
            </label>
            <div className="comment-fields">
              <label>
                Category
                <select value={form.category} onChange={(event) => set('category', event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select>
              </label>
              <label>Tags<input maxLength={600} placeholder="pearls, care, styling" value={form.tags} onChange={(event) => set('tags', event.target.value)} /></label>
            </div>
            <label>Excerpt (EN)<textarea required maxLength={1200} value={form.excerpt} onChange={(event) => set('excerpt', event.target.value)} /></label>
            <label>Excerpt (TR)<textarea maxLength={1200} value={form.excerptTr} onChange={(event) => set('excerptTr', event.target.value)} /></label>
            <label>Body (EN, Markdown)<textarea required minLength={40} rows={14} value={form.content} onChange={(event) => set('content', event.target.value)} /></label>
            <label>Body (TR, Markdown)<textarea rows={14} value={form.contentTr} onChange={(event) => set('contentTr', event.target.value)} /></label>
          </section>

          <aside className="admin-card">
            <h2>Publishing</h2>
            <label>Author<input maxLength={160} value={form.authorName} onChange={(event) => set('authorName', event.target.value)} /></label>
            <label>
              Cover image
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={cover.isPending}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) cover.mutate(file);
                }}
              />
              {cover.isPending && <small>Uploading cover…</small>}
            </label>
            {form.coverImagePath && <img className="admin-cover-preview" src={mediaUrl(form.coverImagePath)} alt="Cover preview" />}
            <label>Reading time<input required type="number" min={1} max={120} value={form.readingTimeMinutes} onChange={(event) => set('readingTimeMinutes', Number(event.target.value))} /></label>
            <label>
              Publication date
              <input type="datetime-local" required value={toDateTimeInput(form.publishedAt)} onChange={(event) => set('publishedAt', new Date(event.target.value).toISOString())} />
            </label>
            <label className="admin-check"><input type="checkbox" checked={form.isPublished} onChange={(event) => set('isPublished', event.target.checked)} /> Published</label>
            <p className="admin-form-note">Future publication dates remain hidden until their scheduled time.</p>
            {save.isError && <p className="form-error" role="alert">Could not save this story. Review the fields and try again.</p>}
          </aside>
        </form>
      )}
    </div>
  );
}
