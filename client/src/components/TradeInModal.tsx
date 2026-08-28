'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Camera, Check, Gift, LoaderCircle, MapPin, PackageCheck, Sparkles, Truck, X } from 'lucide-react';
import { ApiError } from '@/lib/apiClient';
import { estimateTradeIn } from '@/lib/commerce';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { useToastStore } from '@/stores/toast';
import { useTradeInModalStore } from '@/stores/tradeIn';
import type { TradeInCondition, TradeInEstimate, TradeInHandoffMethod } from '@/types/commerce';
import { formatMoney } from '@/lib/money';

const copy = {
  en: {
    eyebrow: 'MERS CIRCULAR', title: 'Turn yesterday into your next favorite.',
    intro: 'Tell us about the piece. We will reserve an instant estimate now and verify it after handoff.',
    stepItem: 'Your item', stepValue: 'Your estimate', stepHandoff: 'Handoff',
    category: 'Category', chooseCategory: 'Choose a category', jewelry: 'Jewelry', accessories: 'Cute accessories', leather: 'Leather goods', textiles: 'Textiles', other: 'Other',
    brand: 'Brand or model', brandPlaceholder: 'e.g. pearl necklace, handmade bracelet', condition: 'Condition',
    likeNew: 'Like new', likeNewSub: 'Barely worn, no visible marks', good: 'Good', goodSub: 'Loved, with light signs of use', fair: 'Fair', fairSub: 'Visible wear, still fully usable',
    photo: 'Add a clear item photo', photoSub: 'JPEG, PNG or WebP · up to 10 MB', replace: 'Replace photo',
    missing: 'Complete every item detail and add a photo to continue.', estimating: 'Calculating estimate…', next: 'See my estimate',
    estimateTitle: 'Your instant estimate', estimateCopy: 'This provisional credit is protected at checkout and confirmed after our team inspects your item.',
    target: 'New piece', credit: 'Estimated trade-in credit', after: 'Estimated price after trade-in', pending: 'Pending physical verification',
    back: 'Back', continue: 'Choose handoff', pickup: 'Atelier pickup', pickupSub: 'We arrange collection after your order', dropoff: 'PTT drop-off', dropoffSub: 'Receive instructions and a prepaid reference',
    confirmTitle: 'Ready for the exchange?', confirmCopy: 'The estimate will reduce your current bag. If the physical condition differs, our team will contact you before any adjustment.',
    accept: 'I accept the provisional estimate and verification process.', apply: 'Apply credit to my bag', applying: 'Applying credit…',
    signIn: 'Sign in to apply your credit.', emptyBag: 'Add the product you want to buy to your bag first.', failed: 'We could not apply this trade-in. Please review the details and try again.',
    success: 'Trade-in credit applied', successCopy: 'Your estimate is now reducing the bag total, pending verification.', close: 'Close trade-in',
  },
  tr: {
    eyebrow: 'MERS DÖNGÜSEL', title: 'Dünün parçasını yeni favorinize dönüştürün.',
    intro: 'Parçanızı anlatın. Anında ön değerleme ayıralım, teslimden sonra doğrulayalım.',
    stepItem: 'Ürününüz', stepValue: 'Değerleme', stepHandoff: 'Teslimat',
    category: 'Kategori', chooseCategory: 'Kategori seçin', jewelry: 'Takı', accessories: 'Sevimli aksesuar', leather: 'Deri ürün', textiles: 'Tekstil', other: 'Diğer',
    brand: 'Marka veya model', brandPlaceholder: 'örn. inci kolye, el yapımı bileklik', condition: 'Durum',
    likeNew: 'Yeni gibi', likeNewSub: 'Çok az kullanılmış, görünür iz yok', good: 'İyi', goodSub: 'Hafif kullanım izleri var', fair: 'Orta', fairSub: 'Belirgin izler var, tamamen kullanılabilir',
    photo: 'Ürünün net bir fotoğrafını ekleyin', photoSub: 'JPEG, PNG veya WebP · en fazla 10 MB', replace: 'Fotoğrafı değiştir',
    missing: 'Devam etmek için tüm bilgileri ve bir fotoğrafı ekleyin.', estimating: 'Değer hesaplanıyor…', next: 'Değerlememi gör',
    estimateTitle: 'Anlık değerlemeniz', estimateCopy: 'Bu geçici kredi ödeme sırasında korunur ve ekibimizin fiziksel incelemesinden sonra onaylanır.',
    target: 'Yeni ürün', credit: 'Tahmini takas kredisi', after: 'Takas sonrası tahmini fiyat', pending: 'Fiziksel doğrulama bekleniyor',
    back: 'Geri', continue: 'Teslimatı seç', pickup: 'Atölyeden teslim alma', pickupSub: 'Siparişinizden sonra teslim almayı planlarız', dropoff: 'PTT teslim noktası', dropoffSub: 'Talimatlar ve ön ödemeli referans gönderilir',
    confirmTitle: 'Takasa hazır mısınız?', confirmCopy: 'Tahmin mevcut sepetinizi düşürür. Fiziksel durum farklıysa herhangi bir değişiklikten önce sizinle iletişime geçeriz.',
    accept: 'Geçici değerlemeyi ve doğrulama sürecini kabul ediyorum.', apply: 'Krediyi sepetime uygula', applying: 'Kredi uygulanıyor…',
    signIn: 'Krediyi uygulamak için giriş yapın.', emptyBag: 'Önce satın almak istediğiniz ürünü sepete ekleyin.', failed: 'Takas uygulanamadı. Bilgileri kontrol edip tekrar deneyin.',
    success: 'Takas kredisi uygulandı', successCopy: 'Tahmini krediniz doğrulama beklerken sepet toplamını düşürüyor.', close: 'Takas penceresini kapat',
  },
} as const;

type Category = 'jewelry' | 'accessories' | 'leather' | 'textiles' | 'other' | '';

export function TradeInModal() {
  const { locale } = useI18n();
  const text = copy[locale];
  const router = useRouter();
  const pathname = usePathname();
  const isOpen = useTradeInModalStore((state) => state.isOpen);
  const target = useTradeInModalStore((state) => state.target);
  const close = useTradeInModalStore((state) => state.close);
  const user = useAuthStore((state) => state.user);
  const cartItems = useCartStore((state) => state.items);
  const applyTradeIn = useCartStore((state) => state.applyTradeIn);
  const showToast = useToastStore((state) => state.show);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<Category>('');
  const [brandModel, setBrandModel] = useState('');
  const [condition, setCondition] = useState<TradeInCondition>('good');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [estimate, setEstimate] = useState<TradeInEstimate | null>(null);
  const [handoffMethod, setHandoffMethod] = useState<TradeInHandoffMethod>('drop_off');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!image) { setImagePreview(''); return; }
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  useEffect(() => {
    if (!isOpen) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', onKey); };
  }, [close, isOpen]);

  const money = (amount: number) => formatMoney(amount, locale);

  const calculate = async () => {
    if (!category || !brandModel.trim() || !image) { setError(text.missing); return; }
    setLoading(true);
    setError('');
    try {
      const result = await estimateTradeIn({
        category,
        condition,
        targetProductSlug: target?.slug,
        targetProductPrice: target?.price,
      });
      setEstimate(result);
      setStep(2);
    } catch {
      setError(text.failed);
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    if (!user) {
      close();
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!cartItems.length) { setError(text.emptyBag); return; }
    if (!accepted || !category || !image) return;

    setLoading(true);
    setError('');
    try {
      await applyTradeIn({
        category,
        brandModel: brandModel.trim(),
        condition,
        handoffMethod,
        image,
        targetProductSlug: target?.slug,
        targetProductPrice: target?.price,
      });
      showToast({ tone: 'success', title: text.success, message: text.successCopy });
      close();
      setStep(1); setCategory(''); setBrandModel(''); setCondition('good'); setImage(null); setEstimate(null); setAccepted(false);
    } catch (caught) {
      setError(locale === 'en' && caught instanceof ApiError ? caught.message : text.failed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="tradein-modal-root" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button className="tradein-modal-scrim" type="button" onClick={close} aria-label={text.close} />
          <motion.section className="tradein-modal" role="dialog" aria-modal="true" aria-labelledby="tradein-title" initial={{ opacity: 0, y: 28, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: .985 }} transition={{ duration: .28 }}>
            <header className="tradein-modal__header">
              <div><span className="eyebrow"><Sparkles size={14} /> {text.eyebrow}</span><h2 id="tradein-title">{text.title}</h2><p>{text.intro}</p></div>
              <button ref={closeRef} className="tradein-modal__close" type="button" onClick={close} aria-label={text.close}><X /></button>
            </header>

            <nav className="tradein-steps" aria-label="Trade-in progress">
              {[text.stepItem, text.stepValue, text.stepHandoff].map((label, index) => <div className={step >= index + 1 ? 'active' : ''} key={label}><span>{step > index + 1 ? <Check size={13} /> : index + 1}</span><strong>{label}</strong></div>)}
            </nav>

            <div className="tradein-modal__body">
              {step === 1 && <div className="tradein-form-step">
                <div className="tradein-field-grid">
                  <label className="tradein-field"><span>{text.category}</span><select value={category} onChange={(event) => setCategory(event.target.value as Category)}><option value="">{text.chooseCategory}</option><option value="jewelry">{text.jewelry}</option><option value="accessories">{text.accessories}</option><option value="leather">{text.leather}</option><option value="textiles">{text.textiles}</option><option value="other">{text.other}</option></select></label>
                  <label className="tradein-field"><span>{text.brand}</span><input value={brandModel} onChange={(event) => setBrandModel(event.target.value)} maxLength={160} placeholder={text.brandPlaceholder} /></label>
                </div>
                <fieldset className="tradein-condition"><legend>{text.condition}</legend>
                  {([['like_new', text.likeNew, text.likeNewSub], ['good', text.good, text.goodSub], ['fair', text.fair, text.fairSub]] as const).map(([value, label, detail]) => <label className={condition === value ? 'active' : ''} key={value}><input type="radio" name="tradein-condition" value={value} checked={condition === value} onChange={() => setCondition(value)} /><span><strong>{label}</strong><small>{detail}</small></span><i><Check size={12} /></i></label>)}
                </fieldset>
                <label className={imagePreview ? 'tradein-upload tradein-upload--ready' : 'tradein-upload'}>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] ?? null)} />
                  {imagePreview ? <img src={imagePreview} alt="" /> : <span><Camera /></span>}
                  <div><strong>{imagePreview ? text.replace : text.photo}</strong><small>{image?.name || text.photoSub}</small></div><ArrowRight />
                </label>
                {error && <p className="tradein-error" role="alert">{error}</p>}
                <button className="button button--primary tradein-primary" type="button" onClick={calculate} disabled={loading}>{loading ? <><LoaderCircle className="tradein-spinner" /> {text.estimating}</> : <>{text.next} <ArrowRight /></>}</button>
              </div>}

              {step === 2 && estimate && <div className="tradein-estimate-step">
                <div className="tradein-estimate-orbit"><Gift /><span>{money(estimate.estimatedCredit)}</span></div>
                <span className="eyebrow">{text.estimateTitle}</span><h3>{money(estimate.estimatedCredit)}</h3><p>{text.estimateCopy}</p>
                <dl>
                  {target && <><div><dt>{text.target}</dt><dd>{target.name}</dd></div><div><dt>{text.after}</dt><dd>{money(Math.max(0, target.price - estimate.estimatedCredit))}</dd></div></>}
                  <div><dt>{text.credit}</dt><dd>−{money(estimate.estimatedCredit)}</dd></div><div><dt>{text.pending}</dt><dd><span className="tradein-pending-dot" /> {text.pending}</dd></div>
                </dl>
                <div className="tradein-modal-actions"><button className="button button--ghost" type="button" onClick={() => { setStep(1); setError(''); }}><ArrowLeft /> {text.back}</button><button className="button button--primary" type="button" onClick={() => setStep(3)}>{text.continue} <ArrowRight /></button></div>
              </div>}

              {step === 3 && estimate && <div className="tradein-handoff-step">
                <div className="tradein-confirm-head"><span><PackageCheck /></span><div><h3>{text.confirmTitle}</h3><p>{text.confirmCopy}</p></div></div>
                <div className="tradein-handoff-options">
                  <label className={handoffMethod === 'pickup' ? 'active' : ''}><input type="radio" checked={handoffMethod === 'pickup'} onChange={() => setHandoffMethod('pickup')} /><Truck /><span><strong>{text.pickup}</strong><small>{text.pickupSub}</small></span></label>
                  <label className={handoffMethod === 'drop_off' ? 'active' : ''}><input type="radio" checked={handoffMethod === 'drop_off'} onChange={() => setHandoffMethod('drop_off')} /><MapPin /><span><strong>{text.dropoff}</strong><small>{text.dropoffSub}</small></span></label>
                </div>
                <div className="tradein-final-credit"><span>{text.credit}</span><strong>−{money(estimate.estimatedCredit)}</strong></div>
                <label className="tradein-accept"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span>{text.accept}</span></label>
                {error && <p className="tradein-error" role="alert">{error}</p>}
                <div className="tradein-modal-actions"><button className="button button--ghost" type="button" onClick={() => { setStep(2); setError(''); }}><ArrowLeft /> {text.back}</button><button className="button button--primary" type="button" disabled={!accepted || loading} onClick={apply}>{loading ? <><LoaderCircle className="tradein-spinner" /> {text.applying}</> : <>{user ? text.apply : text.signIn} <ArrowRight /></>}</button></div>
              </div>}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
