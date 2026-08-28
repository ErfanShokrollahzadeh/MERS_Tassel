'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Loader2, Plus, Star, Trash2, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminKeys,
  createProduct,
  deleteProductMedia,
  reorderProductMedia,
  updateProduct,
  type ProductDraft,
  type VariantDraft,
} from '@/lib/admin';
import { ApiError, mediaUrl } from '@/lib/apiClient';
import { useToastStore } from '@/stores/toast';
import type { Category, Product } from '@/types/commerce';

const emptyVariant = (): VariantDraft => ({
  title: '',
  color: '',
  colorTr: '',
  swatchHex: '#bd9057',
  stock: 0,
  lowStockThreshold: 5,
  isActive: true,
});

function draftFrom(product: Product | null): ProductDraft {
  if (!product) {
    return {
      name: '', nameTr: '', categoryId: 0, description: '', descriptionTr: '',
      story: '', storyTr: '', material: '', materialTr: '', dimensions: '', dimensionsTr: '',
      price: 0, compareAtPrice: null, currency: 'TRY', isFeatured: false, isNew: true, isActive: true,
      seoTitle: '', metaDescription: '', variants: [emptyVariant()],
    };
  }

  return {
    name: product.name,
    nameTr: product.nameTr ?? '',
    slug: product.slug,
    categoryId: product.categoryId,
    description: product.description,
    descriptionTr: product.descriptionTr ?? '',
    story: product.story,
    storyTr: product.storyTr ?? '',
    material: product.material,
    materialTr: product.materialTr ?? '',
    dimensions: product.dimensions,
    dimensionsTr: product.dimensionsTr ?? '',
    price: product.price.amount,
    compareAtPrice: product.compareAt?.amount ?? null,
    currency: product.price.currency,
    sku: product.sku,
    isFeatured: product.isFeatured,
    isNew: product.isNew,
    isActive: product.isActive,
    seoTitle: product.seoTitle,
    metaDescription: product.metaDescription,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      title: variant.title,
      color: variant.color,
      colorTr: variant.colorTr ?? '',
      swatchHex: variant.swatchHex ?? '#bd9057',
      priceOverride: variant.priceOverride ?? null,
      stock: variant.stock,
      lowStockThreshold: variant.lowStockThreshold,
      isActive: variant.isActive,
    })),
  };
}

export function ProductEditor({
  product,
  categories,
  onClose,
}: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<ProductDraft>(() => draftFrom(product));
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const fileInput = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.show);
  const isEdit = Boolean(product);

  // Default to the first category so a new product never posts categoryId 0.
  useEffect(() => {
    if (!isEdit && draft.categoryId === 0 && categories.length) {
      setDraft((current) => ({ ...current, categoryId: categories[0].id }));
    }
  }, [categories, draft.categoryId, isEdit]);

  // Object URLs must be revoked or the blobs leak for the life of the page.
  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const existingMedia = product?.mediaItems ?? [];

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['products'] });
    void queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  const save = useMutation({
    mutationFn: () => (product ? updateProduct(product.id, draft, files) : createProduct(draft, files)),
    onSuccess: (saved) => {
      invalidate();
      showToast({ tone: 'success', title: isEdit ? 'Product updated' : 'Product published', message: saved.name });
      onClose();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.errors) {
        setErrors(error.errors);
        showToast({ tone: 'error', title: 'Check the highlighted fields', message: error.message });
      } else {
        showToast({ tone: 'error', title: 'Could not save', message: error instanceof Error ? error.message : 'Unknown error' });
      }
    },
  });

  const removeMedia = useMutation({
    mutationFn: (mediaId: number) => deleteProductMedia(product!.id, mediaId),
    onSuccess: () => { invalidate(); showToast({ tone: 'success', title: 'Image removed', message: 'The file was deleted from storage.' }); },
    onError: (error) => showToast({ tone: 'error', title: 'Could not remove image', message: error instanceof Error ? error.message : '' }),
  });

  const makePrimary = useMutation({
    mutationFn: (mediaId: number) => {
      const rest = existingMedia.filter((item) => item.id !== mediaId).map((item) => item.id);
      return reorderProductMedia(product!.id, [mediaId, ...rest]);
    },
    onSuccess: () => { invalidate(); showToast({ tone: 'success', title: 'Cover image updated', message: '' }); },
  });

  const acceptFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const images = Array.from(incoming).filter((file) => file.type.startsWith('image/'));
    if (images.length !== incoming.length) {
      showToast({ tone: 'error', title: 'Only images can be uploaded', message: 'JPEG, PNG or WebP up to 10 MB.' });
    }
    setFiles((current) => [...current, ...images]);
  };

  const field = (name: string) => errors[name]?.[0];

  const setVariant = (index: number, patch: Partial<VariantDraft>) =>
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)),
    }));

  const totalStock = useMemo(() => draft.variants.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0), [draft.variants]);

  return (
    <div className="panel-root">
      <button className="panel-scrim" onClick={onClose} aria-label="Close editor" />
      <aside className="editor-panel glass-overlay" role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <header>
          <div><span className="admin-kicker">{isEdit ? 'Edit catalog piece' : 'New catalog piece'}</span><h2 id="editor-title">{isEdit ? product!.name : 'Add product'}</h2></div>
          <button className="icon-button" onClick={onClose}><X /></button>
        </header>

        <div className="editor-body">
          <section className="editor-section">
            <h3>Story</h3>
            <label>Title<input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Galata Silk Pendant" />{field('name') && <small role="alert">{field('name')}</small>}</label>
            <label>Title (Türkçe)<input value={draft.nameTr} onChange={(e) => setDraft({ ...draft, nameTr: e.target.value })} placeholder="Türkçe başlık" /></label>
            <label>Category
              <select value={draft.categoryId} onChange={(e) => setDraft({ ...draft, categoryId: Number(e.target.value) })}>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              {field('categoryId') && <small role="alert">{field('categoryId')}</small>}
            </label>
            <label>Description<textarea rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="A short line for the catalog grid…" />{field('description') && <small role="alert">{field('description')}</small>}</label>
            <label>Description (Türkçe)<textarea rows={3} value={draft.descriptionTr} onChange={(e) => setDraft({ ...draft, descriptionTr: e.target.value })} /></label>
            <label>Story<textarea rows={4} value={draft.story} onChange={(e) => setDraft({ ...draft, story: e.target.value })} placeholder="Tell the story of this piece…" /></label>
            <label>Story (Türkçe)<textarea rows={4} value={draft.storyTr} onChange={(e) => setDraft({ ...draft, storyTr: e.target.value })} /></label>
            <div className="editor-grid">
              <label>Material<input value={draft.material} onChange={(e) => setDraft({ ...draft, material: e.target.value })} /></label>
              <label>Material (Türkçe)<input value={draft.materialTr} onChange={(e) => setDraft({ ...draft, materialTr: e.target.value })} /></label>
              <label>Dimensions<input value={draft.dimensions} onChange={(e) => setDraft({ ...draft, dimensions: e.target.value })} /></label>
              <label>Dimensions (Türkçe)<input value={draft.dimensionsTr} onChange={(e) => setDraft({ ...draft, dimensionsTr: e.target.value })} /></label>
            </div>
          </section>

          <section className="editor-section">
            <h3>Media</h3>

            {existingMedia.length > 0 && (
              <div className="media-strip">
                {existingMedia.map((item) => (
                  <figure key={item.id} className={item.isPrimary ? 'media-thumb media-thumb--primary' : 'media-thumb'}>
                    <img src={mediaUrl(item.imagePath)} alt={item.alt} />
                    <figcaption>
                      {!item.isPrimary && <button type="button" onClick={() => makePrimary.mutate(item.id)} title="Make cover image"><Star size={13} /></button>}
                      <button type="button" onClick={() => removeMedia.mutate(item.id)} title="Remove image"><Trash2 size={13} /></button>
                    </figcaption>
                    {item.isPrimary && <span className="media-thumb__badge">Cover</span>}
                  </figure>
                ))}
              </div>
            )}

            <button
              type="button"
              className={`upload-zone${dragging ? ' upload-zone--active' : ''}`}
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); acceptFiles(e.dataTransfer.files); }}
            >
              <ImagePlus />
              <strong>{dragging ? 'Drop to add' : 'Drop photography here'}</strong>
              <span>JPEG, PNG or WebP · up to 10 MB</span>
            </button>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { acceptFiles(e.target.files); e.target.value = ''; }} />

            {previews.length > 0 && (
              <div className="media-strip media-strip--pending">
                {previews.map((preview, index) => (
                  <figure key={preview} className="media-thumb">
                    <img src={preview} alt="" />
                    <figcaption><button type="button" onClick={() => setFiles((current) => current.filter((_, i) => i !== index))} title="Remove"><X size={13} /></button></figcaption>
                    <span className="media-thumb__badge media-thumb__badge--new">New</span>
                  </figure>
                ))}
              </div>
            )}

            {isEdit && files.length === 0 && (
              <p className="editor-hint">Saving without adding files keeps the current images exactly as they are.</p>
            )}
            {field('file') && <small role="alert" className="editor-error">{field('file')}</small>}
          </section>

          <section className="editor-section">
            <h3>Pricing</h3>
            <div className="editor-grid">
              <label>Price<input type="number" step="0.01" min="0" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} />{field('price') && <small role="alert">{field('price')}</small>}</label>
              <label>Compare-at price<input type="number" step="0.01" min="0" value={draft.compareAtPrice ?? ''} onChange={(e) => setDraft({ ...draft, compareAtPrice: e.target.value === '' ? null : Number(e.target.value) })} />{field('compareAtPrice') && <small role="alert">{field('compareAtPrice')}</small>}</label>
              <label>Currency<input value="TRY" readOnly aria-readonly="true" /></label>
              <label>SKU<input value={draft.sku ?? ''} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} placeholder="Generated if blank" /></label>
            </div>
          </section>

          <section className="editor-section">
            <h3>Finishes <span className="editor-count">{totalStock} in stock</span></h3>
            {draft.variants.map((variant, index) => (
              <div className="variant-editor" key={variant.id ?? `new-${index}`}>
                <div className="editor-grid">
                  <label>Colour<input value={variant.color} onChange={(e) => setVariant(index, { color: e.target.value, title: variant.title || e.target.value })} placeholder="Gold" /></label>
                  <label>Colour (Türkçe)<input value={variant.colorTr ?? ''} onChange={(e) => setVariant(index, { colorTr: e.target.value })} placeholder="Altın" /></label>
                  <label>Swatch<input type="color" value={variant.swatchHex || '#bd9057'} onChange={(e) => setVariant(index, { swatchHex: e.target.value })} /></label>
                  <label>Stock<input type="number" min="0" value={variant.stock} onChange={(e) => setVariant(index, { stock: Number(e.target.value) })} /></label>
                </div>
                <div className="variant-editor__actions">
                  <label className="toggle"><input type="checkbox" checked={variant.isActive} onChange={(e) => setVariant(index, { isActive: e.target.checked })} /> Active</label>
                  {draft.variants.length > 1 && (
                    <button type="button" onClick={() => setDraft({ ...draft, variants: draft.variants.filter((_, i) => i !== index) })}><Trash2 size={13} /> Remove</button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" className="add-option" onClick={() => setDraft({ ...draft, variants: [...draft.variants, emptyVariant()] })}><Plus size={14} /> Add finish</button>
            {field('variants') && <small role="alert" className="editor-error">{field('variants')}</small>}
          </section>

          <section className="editor-section">
            <h3>Visibility</h3>
            <div className="toggle-row">
              <label className="toggle"><input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} /> Published</label>
              <label className="toggle"><input type="checkbox" checked={draft.isFeatured} onChange={(e) => setDraft({ ...draft, isFeatured: e.target.checked })} /> Featured</label>
              <label className="toggle"><input type="checkbox" checked={draft.isNew} onChange={(e) => setDraft({ ...draft, isNew: e.target.checked })} /> New arrival</label>
            </div>
          </section>

          <section className="editor-section">
            <h3>Search preview</h3>
            <label>Page title<input value={draft.seoTitle} maxLength={70} onChange={(e) => setDraft({ ...draft, seoTitle: e.target.value })} placeholder="Product title · MERS Tassel" /></label>
            <label>Meta description<textarea rows={3} maxLength={170} value={draft.metaDescription} onChange={(e) => setDraft({ ...draft, metaDescription: e.target.value })} /></label>
          </section>
        </div>

        <footer>
          <button className="admin-button admin-button--secondary" onClick={onClose} disabled={save.isPending}>Cancel</button>
          <button className="admin-button admin-button--primary" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending && <Loader2 size={15} className="spin" />}
            {save.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Publish product'}
          </button>
        </footer>
      </aside>
    </div>
  );
}
