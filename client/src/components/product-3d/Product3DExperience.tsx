'use client';

import { Box, Camera, RefreshCcw, Smartphone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ProductModelAsset } from '@/types/commerce';
import { modelUrl } from './modelUrls';
import { detectDeviceCapabilities, type DeviceCapabilities } from './deviceCapabilities';
import { ArFallbackDialog } from './ArFallbackDialog';
import { ArQrDialog } from './ArQrDialog';
import { useI18n } from '@/i18n/I18nProvider';
import { SurfacePlacementPicker, type SurfacePlacement } from './SurfacePlacementPicker';

type ViewerElement = HTMLElement & {
  activateAR?: () => Promise<void>;
  resetTurntableRotation?: () => void;
  cameraOrbit?: string;
};

export function Product3DExperience({ asset, productName, productSlug, fallbackPoster, autoFocus = false, onViewPhotos }: {
  asset: ProductModelAsset;
  productName: string;
  productSlug: string;
  fallbackPoster?: string;
  autoFocus?: boolean;
  onViewPhotos?: () => void;
}) {
  const viewerRef = useRef<ViewerElement | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [arError, setArError] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>(() => detectDeviceCapabilities());
  const supportedPlacements = (asset.supportedPlacements?.length ? asset.supportedPlacements : [asset.placement]) as SurfacePlacement[];
  const [placement, setPlacement] = useState<SurfacePlacement>(asset.placement);
  const { t } = useI18n();

  useEffect(() => {
    let cancelled = false;
    void import('@google/model-viewer').then(() => { if (!cancelled) setViewerReady(true); }).catch(() => { if (!cancelled) setFailed(true); });
    setCapabilities(detectDeviceCapabilities());
    const requested = new URLSearchParams(window.location.search).get('placement');
    if ((requested === 'floor' || requested === 'wall') && supportedPlacements.includes(requested)) setPlacement(requested);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!viewerReady || !hostRef.current) return;
    const viewer = hostRef.current.querySelector('model-viewer') as ViewerElement | null;
    if (!viewer) return;
    viewerRef.current = viewer;
    const onProgress = (event: Event) => {
      const detail = (event as CustomEvent<{ totalProgress?: number }>).detail;
      if (typeof detail?.totalProgress === 'number') setProgress(Math.round(detail.totalProgress * 100));
    };
    const onLoad = () => { setLoaded(true); setFailed(false); setProgress(100); };
    const onError = () => { setFailed(true); setLoaded(false); };
    const onArStatus = (event: Event) => {
      const status = (event as CustomEvent<{ status?: string }>).detail?.status;
      if (status === 'failed') setArError(true);
    };
    viewer.addEventListener('progress', onProgress);
    viewer.addEventListener('load', onLoad);
    viewer.addEventListener('error', onError);
    viewer.addEventListener('ar-status', onArStatus);
    if (autoFocus) window.setTimeout(() => hostRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 40);
    return () => {
      viewer.removeEventListener('progress', onProgress);
      viewer.removeEventListener('load', onLoad);
      viewer.removeEventListener('error', onError);
      viewer.removeEventListener('ar-status', onArStatus);
    };
  }, [viewerReady, autoFocus]);

  const activateAr = async () => {
    setArError(false);
    if (!capabilities.isSecureContext || !viewerRef.current?.activateAR) { setArError(true); return; }
    try { await viewerRef.current.activateAR(); }
    catch { setArError(true); }
  };

  const reset = () => {
    if (viewerRef.current) {
      viewerRef.current.cameraOrbit = 'auto auto auto';
      viewerRef.current.resetTurntableRotation?.();
    }
  };

  const poster = modelUrl(asset.posterPath || fallbackPoster);
  const hasUsdz = Boolean(asset.usdzPath);

  return (
    <div className="product-3d" ref={hostRef} id="product-3d">
      <div className="product-3d__canvas">
        {poster && <img className="product-3d__poster" src={poster} alt="" aria-hidden="true" />}
        {!failed && viewerReady && <model-viewer
          ref={(node: HTMLElement | null) => { viewerRef.current = node as ViewerElement | null; }}
          src={modelUrl(asset.glbPath)}
          ios-src={hasUsdz ? modelUrl(asset.usdzPath) : undefined}
          poster={poster || undefined}
          alt={asset.alt || productName}
          camera-controls
          touch-action="pan-y"
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-scale="fixed"
          ar-placement={placement}
          shadow-intensity="0.8"
          shadow-softness="0.9"
          environment-image="neutral"
          tone-mapping="aces"
          loading="lazy"
          reveal="auto"
        />}
        {!viewerReady && !failed && <div className="product-3d__status" role="status"><Box size={24} /><span>{t('model.preparing')}</span></div>}
        {failed && <div className="product-3d__status product-3d__status--error" role="alert"><Box size={24} /><strong>{t('model.unavailable')}</strong><span>{t('model.unavailableCopy')}</span><div className="product-3d__status-actions"><button className="button button--ghost" onClick={() => { setFailed(false); setLoaded(false); setViewerReady(false); void import('@google/model-viewer').then(() => setViewerReady(true)); }}><RefreshCcw size={15} /> {t('model.retry')}</button>{onViewPhotos && <button className="button button--ghost" onClick={onViewPhotos}>{t('model.viewPhotos')}</button>}</div></div>}
        {!loaded && !failed && viewerReady && <div className="product-3d__progress" aria-live="polite"><span style={{ width: `${progress}%` }} /><small>{progress ? `${progress}%` : t('model.loading')}</small></div>}
      </div>
      <div className="product-3d__toolbar">
        <span>{asset.dimensionsMm.width} × {asset.dimensionsMm.height} × {asset.dimensionsMm.depth} mm · {t('model.trueScale')}</span>
        <button type="button" onClick={reset}><RefreshCcw size={14} /> {t('model.reset')}</button>
      </div>
      <div className="product-3d__actions">
        <SurfacePlacementPicker value={placement} options={supportedPlacements} onChange={setPlacement} />
        {capabilities.isMobile ? <button type="button" className="button button--primary" onClick={() => void activateAr()} disabled={!viewerReady || !loaded || failed}><Camera size={17} /> {t('model.viewAr')}</button> : <button type="button" className="button button--primary" onClick={() => setQrOpen(true)}><Smartphone size={17} /> {t('model.scanQr')}</button>}
        {capabilities.isMobile && !hasUsdz && capabilities.isIOS && <small className="product-3d__hint">{t('model.iosMissing')}</small>}
        {capabilities.isMobile && !capabilities.isSecureContext && <small className="product-3d__hint">{t('model.httpsRequired')}</small>}
      </div>
      {arError && <ArFallbackDialog capabilities={capabilities} onClose={() => setArError(false)} />}
      {qrOpen && <ArQrDialog slug={productSlug} productName={productName} placement={placement} onClose={() => setQrOpen(false)} />}
    </div>
  );
}
