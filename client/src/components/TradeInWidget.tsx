'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, LoaderCircle, RefreshCcw, Recycle, ShieldCheck, X } from 'lucide-react';
import { estimateTradeIn } from '@/lib/commerce';
import { MediaImage } from '@/components/MediaImage';
import { useI18n } from '@/i18n/I18nProvider';
import { useCartStore } from '@/stores/cart';
import { useTradeInModalStore, type TradeInSource, type TradeInTarget } from '@/stores/tradeIn';

const copy = {
  en: {
    eyebrow: 'TRADE-IN', title: 'Trade in your old item for an instant discount on this product.',
    genericTitle: 'Have a piece ready for its next chapter?', genericCopy: 'Get an instant estimate and reduce today’s bag total.',
    after: 'Estimated from', cta: 'Get my estimate', applied: 'Trade-in credit applied', pending: 'Pending verification', remove: 'Remove credit', removing: 'Removing',
    credit: 'Credit', final: 'Bag after trade-in', protected: 'Estimate protected through checkout',
  },
  tr: {
    eyebrow: 'TAKAS', title: 'Eski ürününüzü takas edin, bu üründe anında indirim kazanın.',
    genericTitle: 'Yeni hikâyesine hazır bir parçanız mı var?', genericCopy: 'Anında değerleme alın ve bugünkü sepet toplamınızı düşürün.',
    after: 'Tahmini başlangıç', cta: 'Değerleme al', applied: 'Takas kredisi uygulandı', pending: 'Doğrulama bekleniyor', remove: 'Krediyi kaldır', removing: 'Kaldırılıyor',
    credit: 'Kredi', final: 'Takas sonrası sepet', protected: 'Değerleme ödeme boyunca korunur',
  },
} as const;

export function TradeInWidget({ source, target, compact = false }: { source: TradeInSource; target?: TradeInTarget; compact?: boolean }) {
  const { locale } = useI18n();
  const text = copy[locale];
  const open = useTradeInModalStore((state) => state.open);
  const tradeIn = useCartStore((state) => state.tradeIn);
  const tradeInCredit = useCartStore((state) => state.tradeInCredit);
  const totalAfterDiscount = useCartStore((state) => state.totalAfterDiscount);
  const removeTradeIn = useCartStore((state) => state.removeTradeIn);
  const [baseline, setBaseline] = useState<number | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (!target) { setBaseline(null); return; }
    let active = true;
    void estimateTradeIn({ category: 'jewelry', condition: 'good', targetProductSlug: target.slug, targetProductPrice: target.price })
      .then((result) => { if (active) setBaseline(Math.max(0, target.price - result.estimatedCredit)); })
      .catch(() => { if (active) setBaseline(null); });
    return () => { active = false; };
  }, [target]);

  const money = (amount: number) => new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', { style: 'currency', currency: tradeIn?.currency || 'USD', maximumFractionDigits: 2 }).format(amount);

  const remove = async () => {
    setRemoving(true);
    try { await removeTradeIn(); } finally { setRemoving(false); }
  };

  if (tradeIn && source !== 'pdp') {
    return (
      <section className={`tradein-widget tradein-widget--applied${compact ? ' tradein-widget--compact' : ''}`}>
        <div className="tradein-widget__applied-head">
          <span className="tradein-widget__thumb"><MediaImage src={tradeIn.imagePath} alt="" sizes="54px" /></span>
          <div><small><CheckCircle2 /> {text.applied}</small><strong>{tradeIn.brandModel}</strong><em><i /> {text.pending}</em></div>
          <b>−{money(tradeInCredit)}</b>
        </div>
        <div className="tradein-widget__math"><span>{text.credit}<b>−{money(tradeInCredit)}</b></span><span>{text.final}<b>{money(totalAfterDiscount)}</b></span></div>
        <button type="button" className="tradein-widget__remove" onClick={remove} disabled={removing}>{removing ? <LoaderCircle className="tradein-spinner" /> : <X />}{removing ? text.removing : text.remove}</button>
      </section>
    );
  }

  return (
    <section className={`tradein-widget${source === 'pdp' ? ' tradein-widget--pdp' : ''}${compact ? ' tradein-widget--compact' : ''}`}>
      <span className="tradein-widget__icon"><Recycle /></span>
      <div className="tradein-widget__copy"><small>{text.eyebrow}</small><strong>{target ? text.title : text.genericTitle}</strong><p>{target && baseline !== null ? <>{text.after} <b>{money(baseline)}</b> <span>({target.price > 0 ? `−${Math.round((1 - baseline / target.price) * 100)}%` : ''})</span></> : text.genericCopy}</p><em><ShieldCheck /> {text.protected}</em></div>
      <button type="button" onClick={() => open(source, target)}>{text.cta} <ArrowRight /></button>
    </section>
  );
}
