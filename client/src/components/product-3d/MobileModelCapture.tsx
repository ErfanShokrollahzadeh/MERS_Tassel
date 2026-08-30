'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Check, ImagePlus, Loader2, LockKeyhole, RefreshCcw, Ruler, ShieldCheck, X } from 'lucide-react';
import { ApiError, mediaUrl } from '@/lib/apiClient';
import { fetchModelCaptureSession, uploadModelCapture, type ModelCaptureSession } from '@/lib/modelCapture';
import { useI18n } from '@/i18n/I18nProvider';

const angles = ['Front', 'Right side', 'Back', 'Left side'];

export function MobileModelCapture({ jobId, token }: { jobId: number; token: string }) {
  const { locale } = useI18n();
  const tr = locale === 'tr';
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [session, setSession] = useState<ModelCaptureSession | null>(null);
  const [images, setImages] = useState<Array<File | null>>([null, null, null, null]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [activeAngle, setActiveAngle] = useState(0);
  const [dimensions, setDimensions] = useState({ widthMm: 0, heightMm: 0, depthMm: 0, calibrationReferenceMm: 85.6 });
  const [placements, setPlacements] = useState<Array<'floor' | 'wall'>>(['floor']);
  const [defaultPlacement, setDefaultPlacement] = useState<'floor' | 'wall'>('floor');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetchModelCaptureSession(jobId, token).then((value) => { if (alive) setSession(value); }).catch((reason) => { if (alive) setError(reason instanceof Error ? reason.message : 'Capture link unavailable.'); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; streamRef.current?.getTracks().forEach((track) => track.stop()); };
  }, [jobId, token]);

  useEffect(() => {
    const urls = images.map((image) => image ? URL.createObjectURL(image) : '');
    setPreviews(urls);
    return () => urls.forEach((url) => { if (url) URL.revokeObjectURL(url); });
  }, [images]);

  const openCamera = async (index: number) => {
    setError('');
    setActiveAngle(index);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } } });
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => { if (videoRef.current) { videoRef.current.srcObject = stream; void videoRef.current.play(); } });
    } catch {
      setError(tr ? 'Kamera açılamadı. Her açı için dosya seçme düğmesini kullanın.' : 'Camera could not open. Use the file picker for each angle instead.');
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1920 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `capture-${angles[activeAngle].toLowerCase().replaceAll(' ', '-')}.jpg`, { type: 'image/jpeg' });
      setImages((current) => current.map((item, index) => index === activeAngle ? file : item));
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setCameraOpen(false);
    }, 'image/jpeg', .9);
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const choose = (index: number, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError(tr ? 'JPEG, PNG veya WebP görsel seçin.' : 'Choose a JPEG, PNG or WebP image.'); return; }
    setImages((current) => current.map((item, itemIndex) => itemIndex === index ? file : item));
  };

  const submit = async () => {
    setError('');
    const selected = images.filter((image): image is File => Boolean(image));
    if (selected.length < 4) { setError(tr ? 'Dört gerekli açının tümünü çekin.' : 'Capture all four required angles.'); return; }
    if (Object.values(dimensions).some((value) => value <= 0)) { setError(tr ? 'Tüm gerçek ölçüleri milimetre olarak girin.' : 'Enter every real measurement in millimetres.'); return; }
    setSubmitting(true);
    try {
      await uploadModelCapture(jobId, { token, ...dimensions, supportedPlacements: placements, defaultPlacement, images: selected });
      setComplete(true);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : tr ? 'Yükleme tamamlanamadı.' : 'Upload could not be completed.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <main className="capture-page capture-page--center"><Loader2 className="spin" size={28} /><p>{tr ? 'Güvenli çekim açılıyor…' : 'Opening secure capture…'}</p></main>;
  if (!session) return <main className="capture-page capture-page--center"><LockKeyhole size={32} /><h1>{tr ? 'Çekim bağlantısı kullanılamıyor' : 'Capture link unavailable'}</h1><p>{error}</p></main>;
  if (complete) return <main className="capture-page capture-page--center"><span className="capture-success"><Check size={36} /></span><h1>{tr ? 'Çekim güvenle yüklendi' : 'Capture uploaded securely'}</h1><p>{tr ? 'Bu sekmeyi kapatabilirsiniz. Taslak, yönetici incelemesinden önce mağazada yayınlanmaz.' : 'You may close this tab. The draft cannot appear in the shop before administrator review.'}</p></main>;

  return <main className="capture-page">
    <header className="capture-header"><div className="wordmark"><span className="wordmark__seal">M</span><span>MERS <i>Tassel</i></span></div><span><ShieldCheck size={15} /> {tr ? 'Özel yönetici çekimi' : 'Private admin capture'}</span></header>
    <section className="capture-hero">{session.productImage && <img src={mediaUrl(session.productImage)} alt="" />}<div><span className="eyebrow">AI-ASSISTED 3D</span><h1>{session.productName}</h1><p>{tr ? 'Dört temiz açı, doğru ölçüler ve ölçek referansı çekin. Müşteri oda görüntüleri bu akışta asla kullanılmaz.' : 'Capture four clean angles with measured dimensions and a scale reference. Customer room imagery is never part of this flow.'}</p></div></section>

    <section className="capture-card"><h2><Camera size={20} /> {tr ? '1. Ürünü dört açıdan çekin' : '1. Capture four product angles'}</h2><p>{tr ? 'Mat, sade bir arka plan ve yumuşak ışık kullanın. Ürünün tamamı kadrajda kalsın.' : 'Use a plain matte background and diffuse light. Keep the entire product in frame.'}</p>
      <div className="capture-angle-grid">{angles.map((angle, index) => <article className={images[index] ? 'complete' : ''} key={angle}>{previews[index] ? <img src={previews[index]} alt={`${angle} capture`} /> : <Camera size={24} />}<strong>{tr ? ['Ön', 'Sağ', 'Arka', 'Sol'][index] : angle}</strong><div><button type="button" onClick={() => void openCamera(index)}><Camera size={14} /> {tr ? 'Kamera' : 'Camera'}</button><label><ImagePlus size={14} /> {tr ? 'Dosya' : 'File'}<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden onChange={(event) => choose(index, event.target.files?.[0])} /></label></div></article>)}</div>
    </section>

    <section className="capture-card"><h2><Ruler size={20} /> {tr ? '2. Gerçek ölçüyü doğrulayın' : '2. Verify real dimensions'}</h2><p>{tr ? 'Ölçüler yayın ölçeğinin kaynağıdır; AI tahmini olarak kullanılmaz.' : 'These measurements are the publication scale authority; they are not inferred by AI.'}</p><div className="capture-measurements"><label>{tr ? 'Genişlik (mm)' : 'Width (mm)'}<input type="number" min="1" value={dimensions.widthMm || ''} onChange={(event) => setDimensions({ ...dimensions, widthMm: Number(event.target.value) })} /></label><label>{tr ? 'Yükseklik (mm)' : 'Height (mm)'}<input type="number" min="1" value={dimensions.heightMm || ''} onChange={(event) => setDimensions({ ...dimensions, heightMm: Number(event.target.value) })} /></label><label>{tr ? 'Derinlik (mm)' : 'Depth (mm)'}<input type="number" min="1" value={dimensions.depthMm || ''} onChange={(event) => setDimensions({ ...dimensions, depthMm: Number(event.target.value) })} /></label><label>{tr ? 'Referans (mm)' : 'Scale reference (mm)'}<input type="number" min="1" value={dimensions.calibrationReferenceMm || ''} onChange={(event) => setDimensions({ ...dimensions, calibrationReferenceMm: Number(event.target.value) })} /></label></div></section>

    <section className="capture-card"><h2>{tr ? '3. Yerleştirme yüzeyi' : '3. Placement surface'}</h2><div className="capture-surfaces"><label><input type="checkbox" checked={placements.includes('floor')} onChange={(event) => setPlacements(event.target.checked ? (placements.includes('floor') ? placements : [...placements, 'floor']) : placements.filter((value) => value !== 'floor'))} /> {tr ? 'Masa / raf / zemin' : 'Desk / shelf / floor'}</label><label><input type="checkbox" checked={placements.includes('wall')} onChange={(event) => setPlacements(event.target.checked ? (placements.includes('wall') ? placements : [...placements, 'wall']) : placements.filter((value) => value !== 'wall'))} /> {tr ? 'Duvar' : 'Wall'}</label><label>{tr ? 'Varsayılan' : 'Default'}<select value={defaultPlacement} onChange={(event) => { const value = event.target.value as 'floor' | 'wall'; setDefaultPlacement(value); if (!placements.includes(value)) setPlacements([...placements, value]); }}><option value="floor">{tr ? 'Yüzey' : 'Surface'}</option><option value="wall">{tr ? 'Duvar' : 'Wall'}</option></select></label></div></section>

    {error && <p className="capture-error" role="alert">{error}</p>}
    <button className="button button--primary capture-submit" type="button" onClick={() => void submit()} disabled={submitting}>{submitting ? <><Loader2 className="spin" size={18} /> {tr ? 'Güvenle yükleniyor…' : 'Uploading securely…'}</> : <><RefreshCcw size={18} /> {tr ? '3D taslak oluştur' : 'Create private 3D draft'}</>}</button>
    <p className="capture-privacy"><LockKeyhole size={14} /> {tr ? 'Çekimler özel model depolamasında tutulur ve ürün yöneticisi onaylayana kadar müşterilere sunulmaz.' : 'Captures stay in private model storage and are never customer-visible until a product administrator approves the result.'}</p>

    {cameraOpen && <div className="capture-camera" role="dialog" aria-modal="true"><video ref={videoRef} playsInline muted /><button className="capture-camera__close" type="button" onClick={closeCamera} aria-label={tr ? 'Kamerayı kapat' : 'Close camera'}><X size={22} /></button><div className="capture-camera__guide"><span>{tr ? ['Ön', 'Sağ', 'Arka', 'Sol'][activeAngle] : angles[activeAngle]}</span></div><button type="button" onClick={capture} aria-label={tr ? 'Fotoğraf çek' : 'Take photo'}><Camera size={26} /></button></div>}
  </main>;
}
