'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminKeys, fetchAdminSettings, updateSettings } from '@/lib/admin';
import { ApiError, mediaUrl } from '@/lib/apiClient';
import { ErrorState, PanelSkeleton } from '@/components/DataStates';
import { useToastStore } from '@/stores/toast';
import type { SiteSettings } from '@/types/commerce';

/** Image picker that previews a newly chosen file, falling back to the stored one. */
function ImageField({
  label,
  hint,
  current,
  file,
  onPick,
}: {
  label: string;
  hint: string;
  current?: string | null;
  file: File | null;
  onPick: (file: File | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shown = preview || (current ? mediaUrl(current) : null);

  return (
    <div className="settings-image">
      <span className="settings-image__label">{label}</span>
      <button type="button" className="settings-image__frame" onClick={() => input.current?.click()}>
        {shown ? <img src={shown} alt="" /> : <span className="settings-image__empty"><ImagePlus /> Choose an image</span>}
      </button>
      <div className="settings-image__actions">
        <button type="button" className="admin-button admin-button--secondary" onClick={() => input.current?.click()}>Replace</button>
        {file && <button type="button" className="text-button" onClick={() => onPick(null)}>Undo</button>}
      </div>
      <small>{file ? 'Will replace the stored file when you save.' : hint}</small>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => { onPick(event.target.files?.[0] ?? null); event.target.value = ''; }} />
    </div>
  );
}

export default function SettingsPage() {
  const [draft, setDraft] = useState<SiteSettings | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [hero, setHero] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.show);

  const settings = useQuery({ queryKey: adminKeys.settings(), queryFn: fetchAdminSettings });

  useEffect(() => {
    if (settings.data && !draft) setDraft(settings.data);
  }, [draft, settings.data]);

  const save = useMutation({
    mutationFn: () => updateSettings(draft!, logo, hero),
    onSuccess: (saved) => {
      setDraft(saved);
      setLogo(null);
      setHero(null);
      setErrors({});
      void queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      // The storefront reads the same record for its header, footer and hero.
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
      showToast({ tone: 'success', title: 'Settings saved', message: 'The storefront now reflects your changes.' });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.errors) setErrors(error.errors);
      showToast({ tone: 'error', title: 'Could not save settings', message: error instanceof Error ? error.message : '' });
    },
  });

  if (settings.isPending || !draft) {
    return (
      <>
        <div className="admin-page-heading"><div><span className="admin-kicker">Storefront</span><h1>Site settings</h1></div></div>
        {settings.isError ? <ErrorState error={settings.error} onRetry={() => settings.refetch()} /> : <PanelSkeleton lines={6} />}
      </>
    );
  }

  const set = (patch: Partial<SiteSettings>) => setDraft({ ...draft, ...patch });
  const field = (name: string) => errors[name]?.[0];

  return (
    <>
      <div className="admin-page-heading">
        <div><span className="admin-kicker">Storefront</span><h1>Site settings</h1><p>Branding, hero banner and contact details shown across the shop.</p></div>
        <div>
          <button className="admin-button admin-button--primary" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending && <Loader2 size={15} className="spin" />}{save.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <section className="settings-grid">
        <article className="admin-card">
          <header className="card-heading"><div><span>Identity</span><h2>Brand</h2></div></header>
          <label>Site name<input value={draft.siteName} onChange={(e) => set({ siteName: e.target.value })} />{field('siteName') && <small role="alert">{field('siteName')}</small>}</label>
          <ImageField label="Logo" hint="Shown in the storefront header." current={draft.logoPath} file={logo} onPick={setLogo} />
        </article>

        <article className="admin-card">
          <header className="card-heading"><div><span>Home page</span><h2>Hero banner</h2></div></header>
          <ImageField label="Hero image" hint="The large image on the home page." current={draft.heroImagePath} file={hero} onPick={setHero} />
          <div className="editor-grid">
            <label>Eyebrow<input value={draft.heroEyebrow} onChange={(e) => set({ heroEyebrow: e.target.value })} /></label>
            <label>Eyebrow (Türkçe)<input value={draft.heroEyebrowTr ?? ''} onChange={(e) => set({ heroEyebrowTr: e.target.value })} /></label>
          </div>
          <label>Headline<input value={draft.heroHeadline} onChange={(e) => set({ heroHeadline: e.target.value })} />{field('heroHeadline') && <small role="alert">{field('heroHeadline')}</small>}</label>
          <label>Headline (Türkçe)<input value={draft.heroHeadlineTr ?? ''} onChange={(e) => set({ heroHeadlineTr: e.target.value })} /></label>
          <label>Subheadline<textarea rows={3} value={draft.heroSubheadline} onChange={(e) => set({ heroSubheadline: e.target.value })} /></label>
          <label>Subheadline (Türkçe)<textarea rows={3} value={draft.heroSubheadlineTr ?? ''} onChange={(e) => set({ heroSubheadlineTr: e.target.value })} /></label>
        </article>

        <article className="admin-card">
          <header className="card-heading"><div><span>Reachable</span><h2>Contact</h2></div></header>
          <label>Email<input type="email" value={draft.contactEmail} onChange={(e) => set({ contactEmail: e.target.value })} />{field('contactEmail') && <small role="alert">{field('contactEmail')}</small>}</label>
          <label>Phone<input value={draft.contactPhone} onChange={(e) => set({ contactPhone: e.target.value })} /></label>
          <label>Address<input value={draft.contactAddress} onChange={(e) => set({ contactAddress: e.target.value })} /></label>
          <div className="editor-grid">
            <label>Instagram URL<input value={draft.instagramUrl ?? ''} onChange={(e) => set({ instagramUrl: e.target.value })} placeholder="https://instagram.com/…" />{field('instagramUrl') && <small role="alert">{field('instagramUrl')}</small>}</label>
            <label>Pinterest URL<input value={draft.pinterestUrl ?? ''} onChange={(e) => set({ pinterestUrl: e.target.value })} placeholder="https://pinterest.com/…" />{field('pinterestUrl') && <small role="alert">{field('pinterestUrl')}</small>}</label>
          </div>
        </article>

        <article className="admin-card">
          <header className="card-heading"><div><span>Our story</span><h2>About page</h2></div></header>
          <label>Headline<input value={draft.aboutHeadline} onChange={(e) => set({ aboutHeadline: e.target.value })} /></label>
          <label>Headline (Türkçe)<input value={draft.aboutHeadlineTr ?? ''} onChange={(e) => set({ aboutHeadlineTr: e.target.value })} /></label>
          <label>Body<textarea rows={5} value={draft.aboutBody} onChange={(e) => set({ aboutBody: e.target.value })} /></label>
          <label>Body (Türkçe)<textarea rows={5} value={draft.aboutBodyTr ?? ''} onChange={(e) => set({ aboutBodyTr: e.target.value })} /></label>
        </article>
      </section>
    </>
  );
}
