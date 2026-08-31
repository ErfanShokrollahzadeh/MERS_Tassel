'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  CalendarRange,
  Clock,
  Eye,
  Globe,
  ImagePlus,
  Layers,
  Monitor,
  MousePointerClick,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Search,
  Smartphone,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminKeys,
  createPopup,
  deletePopup,
  fetchAdminPopups,
  togglePopupStatus,
  updatePopup,
} from '@/lib/admin';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/DataStates';
import { useToastStore } from '@/stores/toast';
import type {
  AdminPopup,
  PopupDraft,
  PopupPlacement,
  PopupTargetAudience,
  PopupTriggerType,
  PopupType,
} from '@/types/commerce';
import { mediaUrl } from '@/lib/apiClient';

type EditorDraft = Omit<PopupDraft, 'startsAt' | 'expiresAt'> & {
  startsAt: string;
  expiresAt: string;
};

const blankDraft: EditorDraft = {
  name: '',
  type: 'promotional',
  placement: 'center_modal',
  triggerType: 'delay',
  triggerValue: 5,
  targetAudience: 'all',
  targetPages: '',
  deviceTarget: 'all',
  cooldownDays: 7,
  priority: 0,
  isActive: true,
  startsAt: '',
  expiresAt: '',
  badge: 'Limited Offer',
  badgeTr: 'Özel Fırsat',
  title: 'Welcome to MERS Tassel',
  titleTr: 'MERS Tassel Dünyasına Hoş Geldiniz',
  description: 'Enjoy 15% off your first handcrafted jewelry piece with code WELCOME15.',
  descriptionTr: 'WELCOME15 koduyla ilk el yapımı mücevher siparişinizde %15 indirimden yararlanın.',
  primaryCtaText: 'Claim 15% Off',
  primaryCtaTextTr: '%15 İndirimi Kullan',
  primaryCtaUrl: '/products',
  secondaryCtaText: 'Maybe later',
  secondaryCtaTextTr: 'Daha sonra',
  couponCode: 'WELCOME15',
};

const localDate = (value?: string | null) =>
  value ? new Date(value).toISOString().slice(0, 16) : '';

export default function PopupsPage() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPopup | null>(null);
  const [draft, setDraft] = useState<EditorDraft>(blankDraft);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminPopup | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'rules' | 'preview'>('content');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewLang, setPreviewLang] = useState<'en' | 'tr'>('en');

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'expired' | 'paused'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.show);

  const popups = useQuery({
    queryKey: adminKeys.popups(),
    queryFn: fetchAdminPopups,
  });

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const saveMutation = useMutation({
    mutationFn: ({ id, payload, file }: { id?: number; payload: PopupDraft; file?: File | null }) =>
      id ? updatePopup(id, payload, file) : createPopup(payload, file),
    onSuccess: (popup) => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.popups() });
      void queryClient.invalidateQueries({ queryKey: ['popups'] });
      setEditorOpen(false);
      setEditing(null);
      setImageFile(null);
      showToast({
        tone: 'success',
        title: editing ? 'Campaign updated' : 'Campaign created',
        message: `${popup.name} is ready.`,
      });
    },
    onError: (error) =>
      showToast({
        tone: 'error',
        title: 'Could not save popup campaign',
        message: error instanceof Error ? error.message : '',
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      togglePopupStatus(id, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.popups() });
      void queryClient.invalidateQueries({ queryKey: ['popups'] });
      showToast({ tone: 'success', title: 'Status updated' });
    },
    onError: (error) =>
      showToast({
        tone: 'error',
        title: 'Could not change status',
        message: error instanceof Error ? error.message : '',
      }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => deletePopup(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.popups() });
      void queryClient.invalidateQueries({ queryKey: ['popups'] });
      setPendingDelete(null);
      showToast({
        tone: 'success',
        title: 'Campaign removed',
        message: 'The campaign has been archived.',
      });
    },
    onError: (error) =>
      showToast({
        tone: 'error',
        title: 'Could not delete campaign',
        message: error instanceof Error ? error.message : '',
      }),
  });

  const openNew = () => {
    setEditing(null);
    setDraft(blankDraft);
    setImageFile(null);
    setImagePreview(null);
    setActiveTab('content');
    setEditorOpen(true);
  };

  const openEdit = (popup: AdminPopup) => {
    setEditing(popup);
    setDraft({
      name: popup.name,
      type: popup.type,
      placement: popup.placement,
      triggerType: popup.triggerType,
      triggerValue: popup.triggerValue,
      targetAudience: popup.targetAudience,
      targetPages: popup.targetPages ?? '',
      deviceTarget: popup.deviceTarget,
      cooldownDays: popup.cooldownDays,
      priority: popup.priority,
      isActive: popup.isActive,
      startsAt: localDate(popup.startsAt),
      expiresAt: localDate(popup.expiresAt),
      badge: popup.badge ?? '',
      badgeTr: popup.badgeTr ?? '',
      title: popup.title,
      titleTr: popup.titleTr ?? '',
      description: popup.description ?? '',
      descriptionTr: popup.descriptionTr ?? '',
      primaryCtaText: popup.primaryCtaText ?? '',
      primaryCtaTextTr: popup.primaryCtaTextTr ?? '',
      primaryCtaUrl: popup.primaryCtaUrl ?? '',
      secondaryCtaText: popup.secondaryCtaText ?? '',
      secondaryCtaTextTr: popup.secondaryCtaTextTr ?? '',
      couponCode: popup.couponCode ?? '',
    });
    setImageFile(null);
    setImagePreview(popup.imagePath ? mediaUrl(popup.imagePath) : null);
    setActiveTab('content');
    setEditorOpen(true);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const payload: PopupDraft = {
      ...draft,
      name: draft.name.trim(),
      title: draft.title.trim(),
      startsAt: draft.startsAt ? new Date(draft.startsAt).toISOString() : null,
      expiresAt: draft.expiresAt ? new Date(draft.expiresAt).toISOString() : null,
      couponCode: draft.couponCode ? draft.couponCode.trim().toUpperCase() : null,
      targetPages: draft.targetPages ? draft.targetPages.trim() : null,
    };
    saveMutation.mutate({ id: editing?.id, payload, file: imageFile });
  };

  const entries = popups.data ?? [];
  const now = Date.now();

  const totalImpressions = entries.reduce((sum, p) => sum + p.impressionCount, 0);
  const totalClicks = entries.reduce((sum, p) => sum + p.clickCount, 0);
  const totalConversions = entries.reduce((sum, p) => sum + p.conversionCount, 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0';

  const activeCount = entries.filter(
    (p) =>
      p.isActive &&
      (!p.startsAt || new Date(p.startsAt).getTime() <= now) &&
      (!p.expiresAt || new Date(p.expiresAt).getTime() > now)
  ).length;

  const filteredEntries = entries.filter((p) => {
    const isExpired = Boolean(p.expiresAt && new Date(p.expiresAt).getTime() <= now);
    const isFuture = Boolean(p.startsAt && new Date(p.startsAt).getTime() > now);

    if (statusFilter === 'active' && (!p.isActive || isExpired || isFuture)) return false;
    if (statusFilter === 'scheduled' && (!p.isActive || !isFuture)) return false;
    if (statusFilter === 'expired' && !isExpired) return false;
    if (statusFilter === 'paused' && p.isActive) return false;

    if (typeFilter !== 'all' && p.type !== typeFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        p.name.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        (p.couponCode && p.couponCode.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="admin-kicker">Marketing &amp; Engagement</span>
          <h1>Popups &amp; Modals</h1>
          <p>Design high-converting announcement banners, discount modals, and support triggers.</p>
        </div>
        <div>
          <button className="admin-button admin-button--primary" onClick={openNew}>
            <Plus size={15} /> New popup
          </button>
        </div>
      </div>

      <section className="inventory-stats">
        <div className="admin-card">
          <span>Active campaigns</span>
          <strong>{popups.isPending ? '—' : activeCount}</strong>
          <small>Showing on storefront</small>
        </div>
        <div className="admin-card">
          <span>Total views</span>
          <strong>{popups.isPending ? '—' : totalImpressions.toLocaleString()}</strong>
          <small>Storefront impressions</small>
        </div>
        <div className="admin-card">
          <span>Engagement clicks</span>
          <strong>{popups.isPending ? '—' : totalClicks.toLocaleString()}</strong>
          <small>CTA button interactions</small>
        </div>
        <div className="admin-card">
          <span>Conversions</span>
          <strong>{popups.isPending ? '—' : `${totalConversions} (${avgCtr}% CTR)`}</strong>
          <small>Coupons copied &amp; subscriptions</small>
        </div>
      </section>

      <div className="admin-card table-card">
        <div className="table-filters" style={{ display: 'flex', gap: '10px', padding: '16px 20px', flexWrap: 'wrap', borderBottom: '1px solid var(--admin-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--admin-input-bg, rgba(255,255,255,0.05))', borderRadius: '8px', padding: '6px 12px', flex: '1 1 200px' }}>
            <Search size={15} style={{ opacity: 0.6 }} />
            <input
              type="text"
              placeholder="Search campaigns, titles, codes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'inherit', width: '100%', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)' }}
            >
              <option value="all">All statuses</option>
              <option value="active">Active now</option>
              <option value="scheduled">Scheduled</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)' }}
            >
              <option value="all">All types</option>
              <option value="promotional">Promotional</option>
              <option value="newsletter">Newsletter</option>
              <option value="announcement">Announcement</option>
              <option value="support_care">Support Care</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {popups.isPending && <TableSkeleton rows={6} columns={7} />}
        {popups.isError && <ErrorState error={popups.error} onRetry={() => popups.refetch()} />}

        {popups.data &&
          (filteredEntries.length ? (
            <div className="admin-table admin-table--large">
              <table>
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Type &amp; Placement</th>
                    <th>Trigger &amp; Target</th>
                    <th>Window</th>
                    <th>Performance</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((p) => {
                    const expired = Boolean(p.expiresAt && new Date(p.expiresAt).getTime() <= now);
                    const future = Boolean(p.startsAt && new Date(p.startsAt).getTime() > now);
                    const statusText = !p.isActive
                      ? 'Paused'
                      : expired
                      ? 'Expired'
                      : future
                      ? 'Scheduled'
                      : 'Active';

                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="promotion-code-cell">
                            <Sparkles size={16} />
                            <section>
                              <strong>{p.name}</strong>
                              <small>{p.title}</small>
                            </section>
                          </div>
                        </td>
                        <td>
                          <strong>{p.type.replace('_', ' ').toUpperCase()}</strong>
                          <small>{p.placement.replaceAll('_', ' ')}</small>
                        </td>
                        <td>
                          <div>
                            <strong>
                              {p.triggerType === 'delay'
                                ? `${p.triggerValue}s delay`
                                : p.triggerType === 'scroll_depth'
                                ? `${p.triggerValue}% scroll`
                                : p.triggerType === 'exit_intent'
                                ? 'Exit intent'
                                : 'Immediate'}
                            </strong>
                          </div>
                          <small>{p.targetPages || 'All pages'} ({p.deviceTarget})</small>
                        </td>
                        <td>
                          <small>
                            {p.startsAt ? new Date(p.startsAt).toLocaleDateString('en-GB') : 'Immediate'} →{' '}
                            {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString('en-GB') : 'No expiry'}
                          </small>
                        </td>
                        <td>
                          <div>
                            <strong>{p.impressionCount.toLocaleString()}</strong> views ·{' '}
                            <strong>{p.clickCount.toLocaleString()}</strong> clicks
                          </div>
                          <small>{p.clickThroughRate}% CTR · {p.conversionCount} conv.</small>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`status ${
                              statusText === 'Active'
                                ? 'status--active'
                                : statusText === 'Scheduled'
                                ? 'status--scheduled'
                                : 'status--draft'
                            }`}
                            onClick={() => toggleMutation.mutate({ id: p.id, isActive: !p.isActive })}
                            title="Click to toggle status"
                            style={{ cursor: 'pointer', border: 'none', background: 'transparent' }}
                          >
                            {statusText}
                          </button>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button onClick={() => openEdit(p)} title={`Edit ${p.name}`}>
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => setPendingDelete(p)} title={`Delete ${p.name}`}>
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No popup campaigns found"
              message="Create a promotional modal or announcement for your storefront."
              action={
                <button className="admin-button admin-button--primary" onClick={openNew}>
                  <Plus size={15} /> New popup
                </button>
              }
            />
          ))}
      </div>

      {/* Editor Drawer / Modal */}
      {editorOpen && (
        <div className="modal-root">
          <button className="panel-scrim" onClick={() => setEditorOpen(false)} aria-label="Close editor" />
          <form className="editor-panel glass-overlay" onSubmit={submit} style={{ maxWidth: '780px' }}>
            <header>
              <div>
                <span className="admin-kicker">{editing ? 'Edit popup' : 'New popup campaign'}</span>
                <h2>{draft.name || 'Untitled Campaign'}</h2>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', padding: '3px' }}>
                  <button
                    type="button"
                    className={`admin-button ${activeTab === 'content' ? 'admin-button--secondary' : ''}`}
                    onClick={() => setActiveTab('content')}
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    Content
                  </button>
                  <button
                    type="button"
                    className={`admin-button ${activeTab === 'rules' ? 'admin-button--secondary' : ''}`}
                    onClick={() => setActiveTab('rules')}
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    Rules
                  </button>
                  <button
                    type="button"
                    className={`admin-button ${activeTab === 'preview' ? 'admin-button--secondary' : ''}`}
                    onClick={() => setActiveTab('preview')}
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    Preview
                  </button>
                </div>
                <button type="button" className="icon-button" onClick={() => setEditorOpen(false)}>
                  <X />
                </button>
              </div>
            </header>

            <div className="editor-body">
              {activeTab === 'content' && (
                <>
                  <section className="editor-section">
                    <h3>Identity &amp; Type</h3>
                    <div className="editor-grid">
                      <label>
                        Campaign internal name
                        <input
                          required
                          maxLength={120}
                          value={draft.name}
                          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                          placeholder="Summer 2026 Welcome Offer"
                        />
                      </label>
                      <label>
                        Campaign type
                        <select
                          value={draft.type}
                          onChange={(e) => setDraft({ ...draft, type: e.target.value as PopupType })}
                        >
                          <option value="promotional">Promotional (Discount code)</option>
                          <option value="newsletter">Newsletter (Email capture)</option>
                          <option value="announcement">Announcement (Notice banner)</option>
                          <option value="support_care">Support Care (Assistance prompt)</option>
                          <option value="custom">Custom (CTA link)</option>
                        </select>
                      </label>
                    </div>

                    <div className="editor-grid">
                      <label>
                        Placement format
                        <select
                          value={draft.placement}
                          onChange={(e) => setDraft({ ...draft, placement: e.target.value as PopupPlacement })}
                        >
                          <option value="center_modal">Center Modal Dialog</option>
                          <option value="bottom_bar">Floating Bottom Bar</option>
                          <option value="slide_in_bottom_right">Slide-in Bottom Right</option>
                          <option value="slide_in_bottom_left">Slide-in Bottom Left</option>
                        </select>
                      </label>
                      <label>
                        Priority (0-100)
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={draft.priority}
                          onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) })}
                        />
                      </label>
                    </div>
                  </section>

                  <section className="editor-section">
                    <h3>Banner Image</h3>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '120px',
                          height: '90px',
                          borderRadius: '8px',
                          border: '1px dashed var(--admin-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          background: 'rgba(0,0,0,0.1)',
                          cursor: 'pointer',
                        }}
                        onClick={() => imageInputRef.current?.click()}
                      >
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <ImagePlus size={24} style={{ opacity: 0.5 }} />
                        )}
                      </div>
                      <div>
                        <button
                          type="button"
                          className="admin-button admin-button--secondary"
                          onClick={() => imageInputRef.current?.click()}
                        >
                          {imagePreview ? 'Change image' : 'Choose banner image'}
                        </button>
                        {imagePreview && (
                          <button
                            type="button"
                            className="text-button"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(null);
                            }}
                            style={{ marginLeft: '10px' }}
                          >
                            Remove
                          </button>
                        )}
                        <small style={{ display: 'block', marginTop: '4px', opacity: 0.7 }}>
                          JPEG, PNG or WebP up to 10MB.
                        </small>
                      </div>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        hidden
                        onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                      />
                    </div>
                  </section>

                  <section className="editor-section">
                    <h3>Copy &amp; Localization</h3>
                    <div className="editor-grid">
                      <label>
                        Badge / Eyebrow (EN)
                        <input
                          maxLength={80}
                          value={draft.badge ?? ''}
                          onChange={(e) => setDraft({ ...draft, badge: e.target.value })}
                          placeholder="Special Offer"
                        />
                      </label>
                      <label>
                        Badge / Eyebrow (TR)
                        <input
                          maxLength={80}
                          value={draft.badgeTr ?? ''}
                          onChange={(e) => setDraft({ ...draft, badgeTr: e.target.value })}
                          placeholder="Özel Fırsat"
                        />
                      </label>
                    </div>

                    <div className="editor-grid">
                      <label>
                        Title (EN)*
                        <input
                          required
                          maxLength={200}
                          value={draft.title}
                          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                        />
                      </label>
                      <label>
                        Title (TR)
                        <input
                          maxLength={200}
                          value={draft.titleTr ?? ''}
                          onChange={(e) => setDraft({ ...draft, titleTr: e.target.value })}
                        />
                      </label>
                    </div>

                    <div className="editor-grid">
                      <label>
                        Description (EN)
                        <textarea
                          rows={2}
                          value={draft.description ?? ''}
                          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                        />
                      </label>
                      <label>
                        Description (TR)
                        <textarea
                          rows={2}
                          value={draft.descriptionTr ?? ''}
                          onChange={(e) => setDraft({ ...draft, descriptionTr: e.target.value })}
                        />
                      </label>
                    </div>
                  </section>

                  <section className="editor-section">
                    <h3>Actions &amp; Coupon</h3>
                    <div className="editor-grid">
                      <label>
                        Primary CTA Button (EN)
                        <input
                          value={draft.primaryCtaText ?? ''}
                          onChange={(e) => setDraft({ ...draft, primaryCtaText: e.target.value })}
                          placeholder="Shop Now"
                        />
                      </label>
                      <label>
                        Primary CTA Button (TR)
                        <input
                          value={draft.primaryCtaTextTr ?? ''}
                          onChange={(e) => setDraft({ ...draft, primaryCtaTextTr: e.target.value })}
                          placeholder="Alışverişe Başla"
                        />
                      </label>
                    </div>

                    <div className="editor-grid">
                      <label>
                        Primary Destination URL
                        <input
                          value={draft.primaryCtaUrl ?? ''}
                          onChange={(e) => setDraft({ ...draft, primaryCtaUrl: e.target.value })}
                          placeholder="/products or https://..."
                        />
                      </label>
                      <label>
                        Coupon Code (Optional)
                        <input
                          maxLength={40}
                          value={draft.couponCode ?? ''}
                          onChange={(e) => setDraft({ ...draft, couponCode: e.target.value.toUpperCase() })}
                          placeholder="WELCOME15"
                        />
                      </label>
                    </div>
                  </section>
                </>
              )}

              {activeTab === 'rules' && (
                <>
                  <section className="editor-section">
                    <h3>Trigger &amp; Frequency</h3>
                    <div className="editor-grid">
                      <label>
                        Trigger type
                        <select
                          value={draft.triggerType}
                          onChange={(e) => setDraft({ ...draft, triggerType: e.target.value as PopupTriggerType })}
                        >
                          <option value="delay">Time delay on page</option>
                          <option value="scroll_depth">Scroll percentage</option>
                          <option value="exit_intent">Exit intent (Mouse leaving top)</option>
                          <option value="immediate">Immediate on load</option>
                        </select>
                      </label>
                      <label>
                        {draft.triggerType === 'delay'
                          ? 'Delay (seconds)'
                          : draft.triggerType === 'scroll_depth'
                          ? 'Scroll Depth (%)'
                          : 'Trigger Value'}
                        <input
                          type="number"
                          min={0}
                          max={draft.triggerType === 'scroll_depth' ? 100 : 3600}
                          value={draft.triggerValue}
                          onChange={(e) => setDraft({ ...draft, triggerValue: Number(e.target.value) })}
                          disabled={draft.triggerType === 'exit_intent' || draft.triggerType === 'immediate'}
                        />
                      </label>
                    </div>

                    <div className="editor-grid">
                      <label>
                        Cooldown after dismiss (Days)
                        <input
                          type="number"
                          min={0}
                          max={365}
                          value={draft.cooldownDays}
                          onChange={(e) => setDraft({ ...draft, cooldownDays: Number(e.target.value) })}
                        />
                        <small>0 shows on every page session.</small>
                      </label>
                      <label className="promotion-active" style={{ marginTop: '24px' }}>
                        <input
                          type="checkbox"
                          checked={draft.isActive}
                          onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                        />
                        <span>
                          <strong>Campaign Active</strong>
                          <small>Enable on live storefront</small>
                        </span>
                      </label>
                    </div>
                  </section>

                  <section className="editor-section">
                    <h3>Targeting &amp; Audience</h3>
                    <div className="editor-grid">
                      <label>
                        Target audience
                        <select
                          value={draft.targetAudience}
                          onChange={(e) => setDraft({ ...draft, targetAudience: e.target.value as PopupTargetAudience })}
                        >
                          <option value="all">All Visitors</option>
                          <option value="guests_only">Guests only (Unregistered)</option>
                          <option value="registered_only">Registered customers only</option>
                        </select>
                      </label>
                      <label>
                        Device targeting
                        <select
                          value={draft.deviceTarget}
                          onChange={(e) => setDraft({ ...draft, deviceTarget: e.target.value as any })}
                        >
                          <option value="all">All Devices</option>
                          <option value="desktop">Desktop only</option>
                          <option value="mobile">Mobile only</option>
                        </select>
                      </label>
                    </div>

                    <label>
                      Target pages (comma-separated, leave blank for all pages)
                      <input
                        value={draft.targetPages ?? ''}
                        onChange={(e) => setDraft({ ...draft, targetPages: e.target.value })}
                        placeholder="/, /products/*, /kavanoz"
                      />
                    </label>
                  </section>

                  <section className="editor-section">
                    <h3>Scheduling Window</h3>
                    <div className="editor-grid">
                      <label>
                        <CalendarRange size={13} /> Starts at
                        <input
                          type="datetime-local"
                          value={draft.startsAt}
                          onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })}
                        />
                      </label>
                      <label>
                        <CalendarRange size={13} /> Expires at
                        <input
                          type="datetime-local"
                          value={draft.expiresAt}
                          onChange={(e) => setDraft({ ...draft, expiresAt: e.target.value })}
                        />
                      </label>
                    </div>
                  </section>
                </>
              )}

              {activeTab === 'preview' && (
                <section className="editor-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3>Interactive Preview</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className={`admin-button ${previewDevice === 'desktop' ? 'admin-button--secondary' : ''}`}
                        onClick={() => setPreviewDevice('desktop')}
                      >
                        <Monitor size={14} /> Desktop
                      </button>
                      <button
                        type="button"
                        className={`admin-button ${previewDevice === 'mobile' ? 'admin-button--secondary' : ''}`}
                        onClick={() => setPreviewDevice('mobile')}
                      >
                        <Smartphone size={14} /> Mobile
                      </button>
                      <button
                        type="button"
                        className="admin-button admin-button--secondary"
                        onClick={() => setPreviewLang(previewLang === 'en' ? 'tr' : 'en')}
                      >
                        <Globe size={14} /> {previewLang.toUpperCase()}
                      </button>
                    </div>
                  </div>

                  {/* Preview Container Frame */}
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.4)',
                      borderRadius: '12px',
                      padding: '24px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: '380px',
                    }}
                  >
                    <div
                      style={{
                        width: previewDevice === 'mobile' ? '320px' : '480px',
                        background: 'var(--panel-bg, #1a1a1f)',
                        color: '#fff',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        textAlign: 'center',
                        position: 'relative',
                      }}
                    >
                      {imagePreview && (
                        <div style={{ height: '140px', overflow: 'hidden' }}>
                          <img src={imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div style={{ padding: '24px' }}>
                        {(previewLang === 'tr' ? draft.badgeTr || draft.badge : draft.badge) && (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                              background: 'rgba(212,175,55,0.2)',
                              color: '#d4af37',
                              marginBottom: '10px',
                              fontWeight: 600,
                            }}
                          >
                            {previewLang === 'tr' ? draft.badgeTr || draft.badge : draft.badge}
                          </span>
                        )}
                        <h4 style={{ fontSize: '19px', margin: '0 0 8px 0', fontWeight: 600 }}>
                          {previewLang === 'tr' ? draft.titleTr || draft.title : draft.title}
                        </h4>
                        <p style={{ fontSize: '13px', opacity: 0.8, margin: '0 0 18px 0', lineHeight: 1.5 }}>
                          {previewLang === 'tr' ? draft.descriptionTr || draft.description : draft.description}
                        </p>

                        {draft.couponCode && (
                          <div
                            style={{
                              background: 'rgba(255,255,255,0.06)',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              border: '1px dashed rgba(255,255,255,0.25)',
                              margin: '0 0 16px 0',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span style={{ fontWeight: 700, letterSpacing: '0.05em', fontSize: '15px' }}>
                              {draft.couponCode}
                            </span>
                            <span style={{ fontSize: '12px', opacity: 0.7 }}>
                              {previewLang === 'tr' ? 'Kodu Kopyala' : 'Copy Code'}
                            </span>
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button
                            type="button"
                            className="admin-button admin-button--primary"
                            style={{ width: '100%', padding: '10px', justifyContent: 'center' }}
                          >
                            {previewLang === 'tr'
                              ? draft.primaryCtaTextTr || draft.primaryCtaText || 'Alışverişe Başla'
                              : draft.primaryCtaText || 'Shop Now'}
                          </button>
                          {(draft.secondaryCtaText || draft.secondaryCtaTextTr) && (
                            <button
                              type="button"
                              className="text-button"
                              style={{ width: '100%', padding: '6px', fontSize: '12px' }}
                            >
                              {previewLang === 'tr'
                                ? draft.secondaryCtaTextTr || draft.secondaryCtaText || 'Daha Sonra'
                                : draft.secondaryCtaText || 'Maybe later'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>

            <footer>
              <button
                type="button"
                className="admin-button admin-button--secondary"
                onClick={() => setEditorOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-button admin-button--primary"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create campaign'}
              </button>
            </footer>
          </form>
        </div>
      )}

      {/* Delete Modal */}
      {pendingDelete && (
        <div className="modal-root">
          <button className="modal-scrim" onClick={() => setPendingDelete(null)} aria-label="Close" />
          <div className="invite-modal glass-overlay" role="dialog" aria-modal="true">
            <header>
              <div>
                <span className="admin-kicker">Delete Campaign</span>
                <h2>{pendingDelete.name}</h2>
              </div>
              <button className="icon-button" onClick={() => setPendingDelete(null)}>
                <X />
              </button>
            </header>
            <p>
              This will permanently archive the popup campaign. Historical impressions and CTR statistics
              will be preserved in reporting.
            </p>
            <div>
              <button
                className="admin-button admin-button--secondary"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                className="admin-button admin-button--danger"
                onClick={() => removeMutation.mutate(pendingDelete.id)}
                disabled={removeMutation.isPending}
              >
                {removeMutation.isPending ? 'Removing…' : 'Remove campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

