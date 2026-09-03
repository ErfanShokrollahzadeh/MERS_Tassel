'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ImagePlus, Save, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { blogKeys, savePost } from '@/lib/blog';
import { mediaUrl } from '@/lib/apiClient';
import { useToastStore } from '@/stores/toast';
import type { BlogPostDetail, BlogPostInput } from '@/types/blog';

const blankPost: BlogPostInput = {
  title: '', titleTr: '', slug: '', category: 'Craftsmanship', tags: '', excerpt: '', excerptTr: '',
  content: '', contentTr: '', authorName: 'MERS Atelier', readingTimeMinutes: 3, isPublished: true,
};

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function BlogPostEditor({ post }: { post?: BlogPostDetail }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.show);
  const [form, setForm] = useState<BlogPostInput>(post ? {
    ...blankPost, ...post, titleTr: post.titleTr ?? '', excerptTr: post.excerptTr ?? '',
    contentTr: post.contentTr ?? '', tags: post.tags ?? '',
  } : blankPost);
  const [manualSlug, setManualSlug] = useState(Boolean(post));
  const [cover, setCover] = useState<File | null>(null);
  const [preview, setPreview] = useState(post?.coverImagePath ? mediaUrl(post.coverImagePath) : '');

  useEffect(() => () => { if (preview.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);

  const mutation = useMutation({
    mutationFn: () => savePost(form, cover, post?.id),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: blogKeys.admin });
      void queryClient.invalidateQueries({ queryKey: blogKeys.all });
      showToast({ tone: 'success', title: post ? 'Story updated' : 'Story created', message: `“${saved.title}” ${saved.isPublished ? 'is live in the journal.' : 'was saved as a draft.'}` });
      router.push('/admin/blog');
    },
    onError: (error) => showToast({ tone: 'error', title: 'Story could not be saved', message: error instanceof Error ? error.message : '' }),
  });

  function update<K extends keyof BlogPostInput>(key: K, value: BlogPostInput[K]) {
    setForm((current) => ({ ...current, [key]: value, ...(key === 'title' && !manualSlug ? { slug: slugify(String(value)) } : {}) }));
  }

  function chooseCover(file: File | null) {
    if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setCover(file);
    setPreview(file ? URL.createObjectURL(file) : (post?.coverImagePath ? mediaUrl(post.coverImagePath) : ''));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <form className="blog-editor" onSubmit={submit}>
      <div className="blog-editor__topbar">
        <div>
          <Link href="/admin/blog" className="blog-editor__back"><ArrowLeft size={15} /> Back to journal</Link>
          <span className="admin-kicker">Editorial desk</span>
          <h1>{post ? 'Edit story' : 'Create a new story'}</h1>
          <p>{post ? 'Refine the story, translations, and publishing details.' : 'Share craftsmanship, styling notes, and life inside the atelier.'}</p>
        </div>
        <div className="blog-editor__actions">
          <Link className="admin-button admin-button--secondary" href="/admin/blog">Cancel</Link>
          <button className="admin-button admin-button--primary" disabled={mutation.isPending}><Save size={15} /> {mutation.isPending ? 'Saving…' : post ? 'Save changes' : 'Create story'}</button>
        </div>
      </div>

      <div className="blog-editor__layout">
        <div className="blog-editor__content">
          <section className="admin-card editor-panel">
            <header><div><span className="editor-language">EN</span><h2>English story</h2></div><small>Required</small></header>
            <label><span>Title</span><input required maxLength={220} value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="The quiet art of making by hand" /></label>
            <label><span>Excerpt</span><textarea required maxLength={1000} value={form.excerpt} onChange={(event) => update('excerpt', event.target.value)} rows={4} placeholder="A short introduction shown on journal cards…" /><small>{form.excerpt.length}/1000</small></label>
            <label><span>Body <em>Markdown supported</em></span><textarea className="editor-body-input" required minLength={50} maxLength={100000} value={form.content} onChange={(event) => update('content', event.target.value)} rows={18} placeholder={'## Begin with a heading\n\nWrite your story here…'} /><small>{form.content.length} characters</small></label>
          </section>

          <section className="admin-card editor-panel">
            <header><div><span className="editor-language">TR</span><h2>Türkçe çeviri</h2></div><small>Optional</small></header>
            <label><span>Başlık</span><input maxLength={220} value={form.titleTr} onChange={(event) => update('titleTr', event.target.value)} placeholder="Elle üretmenin sessiz sanatı" /></label>
            <label><span>Özet</span><textarea maxLength={1000} value={form.excerptTr} onChange={(event) => update('excerptTr', event.target.value)} rows={4} placeholder="Günlük kartlarında gösterilen kısa giriş…" /></label>
            <label><span>İçerik <em>Markdown kullanabilirsiniz</em></span><textarea className="editor-body-input" maxLength={100000} value={form.contentTr} onChange={(event) => update('contentTr', event.target.value)} rows={18} placeholder={'## Bir başlıkla başlayın\n\nHikâyenizi buraya yazın…'} /></label>
          </section>
        </div>

        <aside className="blog-editor__sidebar">
          <section className="admin-card editor-panel editor-publish-panel">
            <header><h2>Publishing</h2><span className={`status ${form.isPublished ? 'status--active' : 'status--pending'}`}>{form.isPublished ? 'Published' : 'Draft'}</span></header>
            <label className="editor-switch"><span><strong>Publish story</strong><small>Show this story on the storefront.</small></span><input type="checkbox" checked={form.isPublished} onChange={(event) => update('isPublished', event.target.checked)} /><i /></label>
            <label><span>Reading time</span><div className="editor-input-suffix"><input required type="number" min="1" max="120" value={form.readingTimeMinutes} onChange={(event) => update('readingTimeMinutes', Number(event.target.value))} /><span>minutes</span></div></label>
            <label><span>Author</span><input required maxLength={100} value={form.authorName} onChange={(event) => update('authorName', event.target.value)} /></label>
          </section>

          <section className="admin-card editor-panel">
            <header><h2>Story details</h2></header>
            <label><span>URL slug</span><div className="editor-slug"><span>/blog/</span><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={220} value={form.slug} onChange={(event) => { setManualSlug(true); update('slug', slugify(event.target.value)); }} /></div><small>Generated from the English title; you can edit it.</small></label>
            <label><span>Category</span><select value={form.category} onChange={(event) => update('category', event.target.value)}>{['Craftsmanship', 'Styling', 'Materials', 'Atelier'].map((category) => <option key={category}>{category}</option>)}</select></label>
            <label><span>Tags</span><input value={form.tags} onChange={(event) => update('tags', event.target.value)} placeholder="silver, care, atelier" /><small>Separate tags with commas.</small></label>
          </section>

          <section className="admin-card editor-panel">
            <header><h2>Cover image</h2></header>
            <label className={`editor-cover-drop${preview ? ' has-image' : ''}`}>
              {preview ? <img src={preview} alt="Story cover preview" /> : <><ImagePlus size={25} /><strong>Choose a cover image</strong><small>JPG, PNG or WebP</small></>}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseCover(event.target.files?.[0] ?? null)} />
            </label>
            {preview && <button type="button" className="editor-remove-cover" onClick={() => { chooseCover(null); setPreview(''); update('removeCoverImage', true); }}><X size={14} /> Remove cover</button>}
          </section>
        </aside>
      </div>
    </form>
  );
}
