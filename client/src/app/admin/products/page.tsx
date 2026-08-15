'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminKeys,
  deleteProduct,
  fetchAdminCategories,
  fetchAdminProducts,
} from '@/lib/admin';
import { mediaUrl } from '@/lib/apiClient';
import { ProductEditor } from '@/components/admin/ProductEditor';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/DataStates';
import { useToastStore } from '@/stores/toast';
import type { Product } from '@/types/commerce';

const PAGE_SIZE = 10;
const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function ProductsAdminPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Product | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.show);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => setPage(1), [debounced, category]);

  const query = { search: debounced || undefined, category: category || undefined, page, pageSize: PAGE_SIZE };

  const products = useQuery({
    queryKey: adminKeys.products(query),
    queryFn: () => fetchAdminProducts(query),
    placeholderData: keepPreviousData,
  });

  const categories = useQuery({ queryKey: adminKeys.categories(), queryFn: fetchAdminCategories });

  const remove = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      const name = pendingDelete?.name ?? `#${id}`;
      setPendingDelete(null);
      showToast({ tone: 'success', title: 'Product removed', message: `${name} is no longer on the storefront.` });
    },
    onError: (error) => showToast({ tone: 'error', title: 'Could not remove', message: error instanceof Error ? error.message : '' }),
  });

  const openNew = () => { setEditing(null); setEditorOpen(true); };
  const openEdit = (product: Product) => { setEditing(product); setEditorOpen(true); };

  const result = products.data;
  const lowStock = result?.items.filter((p) => p.stock > 0 && p.stock < 8).length ?? 0;
  const outOfStock = result?.items.filter((p) => p.stock === 0).length ?? 0;

  return (
    <>
      <div className="admin-page-heading">
        <div><span className="admin-kicker">Catalog</span><h1>Products</h1><p>Shape the collection, its finishes, media and inventory.</p></div>
        <div><button onClick={openNew} className="admin-button admin-button--primary"><Plus size={15} /> Add product</button></div>
      </div>

      <section className="inventory-stats">
        <div className="admin-card"><span>Products</span><strong>{result?.total ?? '—'}</strong><small>Including unpublished</small></div>
        <div className="admin-card"><span>Low stock (this page)</span><strong className={lowStock ? 'warning-text' : ''}>{lowStock}</strong><small>Fewer than 8 units</small></div>
        <div className="admin-card"><span>Out of stock (this page)</span><strong className={outOfStock ? 'danger-text' : ''}>{outOfStock}</strong><small>Needs replenishing</small></div>
        <div className="admin-card"><span>Categories</span><strong>{categories.data?.length ?? '—'}</strong><small>Used for navigation</small></div>
      </section>

      <div className="admin-card table-card">
        <div className="table-toolbar">
          <label className="table-search">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" />
            {search && <button onClick={() => setSearch('')}><X size={14} /></button>}
          </label>
          <label className="filter-pill filter-pill--select">
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All collections</option>
              {categories.data?.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
            </select>
            <ChevronDown size={14} />
          </label>
        </div>

        {products.isPending && <TableSkeleton rows={PAGE_SIZE} columns={6} />}
        {products.isError && <ErrorState error={products.error} onRetry={() => products.refetch()} />}

        {result && (result.items.length ? (
          <>
            <div className="admin-table admin-table--large">
              <table>
                <thead><tr><th>Product</th><th>Status</th><th>Inventory</th><th>Category</th><th>Price</th><th>Updated</th><th /></tr></thead>
                <tbody>
                  {result.items.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="product-cell">
                          {product.image ? <img src={mediaUrl(product.image)} alt="" /> : <span className="skeleton-block product-cell__placeholder" />}
                          <section><strong>{product.name}</strong><small>{product.sku} · {product.variants.length} finish{product.variants.length === 1 ? '' : 'es'}</small></section>
                        </div>
                      </td>
                      <td><span className={`status ${product.isActive ? (product.stock ? 'status--active' : 'status--cancelled') : 'status--pending'}`}>{!product.isActive ? 'Draft' : product.stock ? 'Active' : 'Sold out'}</span></td>
                      <td><div className="stock-cell"><strong className={product.stock < 8 ? 'warning-text' : ''}>{product.stock}</strong><span><i style={{ width: `${Math.min(product.stock * 3, 100)}%` }} /></span></div></td>
                      <td>{product.category}</td>
                      <td>{money(product.price.amount)}</td>
                      <td>{new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(product.updatedAt))}</td>
                      <td>
                        <div className="row-actions">
                          <button onClick={() => openEdit(product)} title={`Edit ${product.name}`}><Pencil size={15} /></button>
                          <button onClick={() => setPendingDelete(product)} title={`Delete ${product.name}`}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>Showing {result.items.length} of {result.total} products</span>
              <div>
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                {Array.from({ length: result.totalPages }).map((_, index) => (
                  <button key={index} className={page === index + 1 ? 'active' : ''} onClick={() => setPage(index + 1)}>{index + 1}</button>
                ))}
                <button disabled={page >= result.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            title={debounced || category ? 'No products match those filters' : 'No products yet'}
            message={debounced || category ? 'Try a different search or collection.' : 'Add your first piece to open the storefront.'}
            action={<button className="admin-button admin-button--primary" onClick={openNew}><Plus size={15} /> Add product</button>}
          />
        ))}
      </div>

      {editorOpen && categories.data && (
        <ProductEditor product={editing} categories={categories.data} onClose={() => { setEditorOpen(false); setEditing(null); }} />
      )}

      {pendingDelete && (
        <div className="modal-root">
          <button className="modal-scrim" onClick={() => setPendingDelete(null)} aria-label="Close" />
          <div className="invite-modal glass-overlay" role="dialog" aria-modal="true">
            <header><div><span className="admin-kicker">Remove from catalog</span><h2>{pendingDelete.name}</h2></div><button className="icon-button" onClick={() => setPendingDelete(null)}><X /></button></header>
            <p>This hides the piece from the storefront. Order history keeps its record, and the images stay on disk.</p>
            <div>
              <button className="admin-button admin-button--secondary" onClick={() => setPendingDelete(null)}>Cancel</button>
              <button className="admin-button admin-button--danger" onClick={() => remove.mutate(pendingDelete.id)} disabled={remove.isPending}>
                {remove.isPending ? 'Removing…' : 'Remove product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
