'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Camera, Check, Clipboard, ExternalLink, Loader2, RefreshCcw, Smartphone, XCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveModelGenerationJob,
  cancelModelGenerationJob,
  createModelGenerationJob,
  fetchModelGenerationJobs,
  rejectModelGenerationJob,
  retryModelGenerationJob,
  type ModelGenerationJob,
} from '@/lib/admin';
import { useToastStore } from '@/stores/toast';

function CaptureQr({ url }: { url: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    void import('qrcode').then((QRCode) => {
      if (!cancelled && ref.current) return QRCode.toCanvas(ref.current, url, { width: 210, margin: 1, color: { dark: '#24151f', light: '#fffaf7' } });
    });
    return () => { cancelled = true; };
  }, [url]);
  return <canvas ref={ref} aria-label="Secure phone capture QR code" />;
}

function captureOrigin() {
  const configured = process.env.NEXT_PUBLIC_CAPTURE_BASE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try { return new URL(configured).origin; } catch { /* fall through to the active storefront */ }
  }
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
}

function isLoopbackUrl(value: string) {
  try {
    return ['localhost', '127.0.0.1', '::1'].includes(new URL(value).hostname);
  } catch {
    return false;
  }
}

function formatValidation(value: string) {
  try { return JSON.stringify(JSON.parse(value), null, 2); }
  catch { return value; }
}

export function ModelGenerationPanel({ productId, variantId }: { productId: number; variantId?: number | null }) {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.show);
  const [captureUrl, setCaptureUrl] = useState('');
  const [verified, setVerified] = useState<Record<number, boolean>>({});
  const [rejectReason, setRejectReason] = useState<Record<number, string>>({});
  const queryKey = ['admin', 'model-generation', productId];
  const jobs = useQuery({
    queryKey,
    queryFn: () => fetchModelGenerationJobs(productId),
    refetchInterval: (query) => query.state.data?.some((job) => ['queued', 'reconstructing', 'optimizing'].includes(job.status)) ? 8000 : false,
  });
  const refresh = () => void queryClient.invalidateQueries({ queryKey });
  const create = useMutation({
    mutationFn: () => createModelGenerationJob(productId, variantId),
    onSuccess: (result) => {
      const url = `${captureOrigin()}/model-capture/${result.job.id}?token=${encodeURIComponent(result.captureToken)}`;
      // When the administrator is already using a phone, take them straight to the camera
      // capture flow. Desktop admins keep the QR/link hand-off so another device can do the
      // photography without losing the product-editor context.
      if (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) {
        if (isLoopbackUrl(url)) {
          setCaptureUrl(url);
          showToast({ tone: 'error', title: 'Use a LAN address for phone capture', message: 'Open the storefront from your Wi-Fi address or set NEXT_PUBLIC_CAPTURE_BASE_URL before scanning.' });
          return;
        }
        window.location.assign(url);
        return;
      }
      setCaptureUrl(url);
      refresh();
    },
    onError: (error) => showToast({ tone: 'error', title: 'Could not create phone capture', message: error instanceof Error ? error.message : '' }),
  });
  const action = useMutation({
    mutationFn: async ({ type, job }: { type: 'retry' | 'cancel' | 'approve' | 'reject'; job: ModelGenerationJob }) => {
      if (type === 'retry') return retryModelGenerationJob(job.id);
      if (type === 'cancel') return cancelModelGenerationJob(job.id);
      if (type === 'approve') return approveModelGenerationJob(job.id);
      return rejectModelGenerationJob(job.id, rejectReason[job.id] ?? 'Draft did not match the physical product.');
    },
    onSuccess: (_, variables) => {
      refresh();
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast({ tone: 'success', title: variables.type === 'approve' ? '3D model published' : 'Generation job updated', message: '' });
    },
    onError: (error) => showToast({ tone: 'error', title: 'Could not update generation job', message: error instanceof Error ? error.message : '' }),
  });

  return (
    <div className="generation-panel">
      <div className="generation-panel__intro">
        <div><strong>Create an accurate 3D draft from phone photos</strong><small>Captures stay private. AI output requires human scale approval before publication.</small></div>
        <button type="button" className="admin-button admin-button--secondary" onClick={() => create.mutate()} disabled={create.isPending}>
          {create.isPending ? <Loader2 className="spin" size={14} /> : <Smartphone size={14} />} Create from phone
        </button>
      </div>

      {captureUrl && <div className="generation-capture-link">
        <CaptureQr url={captureUrl} />
        <div><strong>Scan with the product photographer’s phone</strong><small>This single-use link expires in 20 minutes.</small>{isLoopbackUrl(captureUrl) && <small role="alert" className="generation-capture-link__warning">This link uses localhost and is only reachable on this computer. Set <code>NEXT_PUBLIC_CAPTURE_BASE_URL</code> to your LAN URL, restart Next.js, then create a new link.</small>}<code>{captureUrl}</code>
          <div className="generation-capture-link__actions"><button type="button" className="admin-button admin-button--secondary" onClick={() => window.open(captureUrl, '_blank', 'noopener,noreferrer')}><ExternalLink size={13} /> Open here</button><button type="button" className="admin-button admin-button--secondary" onClick={() => void navigator.clipboard.writeText(captureUrl)}><Clipboard size={13} /> Copy link</button></div>
        </div>
      </div>}

      {jobs.isLoading && <p className="editor-hint"><Loader2 className="spin" size={13} /> Loading generation jobs…</p>}
      {(jobs.data ?? []).map((job) => <article className={`generation-job generation-job--${job.status}`} key={job.id}>
        <header><div><strong>Draft #{job.id}</strong><small>{job.provider} · {job.status.replaceAll('_', ' ')}</small></div><span>{job.progressPercent}%</span></header>
        <div className="generation-job__progress"><i style={{ width: `${job.progressPercent}%` }} /></div>
        <p>{job.stage}</p>
        {(job.captureCount > 0 || job.widthMm > 0) && <small>{job.captureCount > 0 ? `${job.captureCount} capture photos uploaded · ` : ''}{job.widthMm > 0 ? `${job.widthMm} × ${job.heightMm} × ${job.depthMm} mm · ${job.supportedPlacements.join(' + ')}` : 'Waiting for phone measurements'}</small>}
        {job.validationReportJson && <details><summary>Automated validation</summary><pre>{formatValidation(job.validationReportJson)}</pre></details>}
        {job.failureMessage && <p className="generation-job__error"><XCircle size={14} /> {job.failureMessage}</p>}
        {job.canApprove && <div className="generation-review">
          <label><input type="checkbox" checked={verified[job.id] ?? false} onChange={(event) => setVerified({ ...verified, [job.id]: event.target.checked })} /> I compared this draft with the real product and verified its physical scale.</label>
          <input value={rejectReason[job.id] ?? ''} onChange={(event) => setRejectReason({ ...rejectReason, [job.id]: event.target.value })} placeholder="Rejection reason (if needed)" />
          <div><button type="button" className="admin-button admin-button--primary" disabled={!verified[job.id] || action.isPending} onClick={() => action.mutate({ type: 'approve', job })}><Check size={14} /> Approve &amp; publish</button><button type="button" className="admin-button admin-button--secondary" disabled={action.isPending} onClick={() => action.mutate({ type: 'reject', job })}>Reject</button></div>
        </div>}
        <footer>
          {job.canRetry && <button type="button" onClick={() => action.mutate({ type: 'retry', job })}><RefreshCcw size={13} /> Retry</button>}
          {!['approved', 'cancelled', 'failed'].includes(job.status) && <button type="button" onClick={() => action.mutate({ type: 'cancel', job })}>Cancel</button>}
        </footer>
      </article>)}
      {!jobs.isLoading && !(jobs.data?.length) && <div className="generation-empty"><Camera size={22} /><span>No AI-assisted captures yet.</span></div>}
    </div>
  );
}
