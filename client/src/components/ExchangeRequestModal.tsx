'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, MessageCircle, X } from 'lucide-react';
import { fetchProducts } from '@/lib/catalog';
import { commerceKeys, createExchange } from '@/lib/commerce';
import { ApiError } from '@/lib/apiClient';
import { useI18n } from '@/i18n/I18nProvider';
import type { OrderItem, Product } from '@/types/commerce';

type Props = {
  item: OrderItem | null;
  currency: string;
  onClose: () => void;
};

function money(amount: number, currency: string, locale: 'en' | 'tr') {
  return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', { style: 'currency', currency }).format(amount);
}

export function ExchangeRequestModal({ item, currency, onClose }: Props) {
  const { locale } = useI18n();
  const queryClient = useQueryClient();
  const [variantId, setVariantId] = useState(0);
  const [invoiceIntact, setInvoiceIntact] = useState(false);
  const [packagingIntact, setPackagingIntact] = useState(false);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const products = useQuery({
    queryKey: ['exchange-products'],
    queryFn: () => fetchProducts({ pageSize: 100, sort: 'featured' }),
    enabled: Boolean(item),
  });

  const variants = useMemo(() => (products.data?.items || []).flatMap((product: Product) =>
    product.variants.filter((variant) => variant.isActive && variant.stock > 0).map((variant) => ({
      id: variant.id,
      label: `${locale === 'tr' && product.nameTr ? product.nameTr : product.name} — ${locale === 'tr' && variant.colorTr ? variant.colorTr : variant.color}`,
      price: variant.priceOverride ?? product.price.amount,
    }))), [locale, products.data]);
  const selected = variants.find((variant) => variant.id === variantId);
  const difference = item && selected ? item.unitPrice - selected.price : 0;

  const mutation = useMutation({
    mutationFn: () => createExchange({
      orderItemId: item!.id,
      newProductVariantId: variantId,
      invoiceIntact,
      packagingIntact,
      customerNote: note.trim() || undefined,
    }),
    onSuccess: async () => {
      setSubmitted(true);
      await queryClient.invalidateQueries({ queryKey: commerceKeys.exchanges() });
    },
  });

  if (!item) return null;
  const tr = locale === 'tr';
  const error = mutation.error instanceof ApiError ? mutation.error.message : tr ? 'Talep gönderilemedi. Bilgileri kontrol edip tekrar deneyin.' : 'The request could not be submitted. Check the details and try again.';
  const whatsappMessage = encodeURIComponent(tr
    ? `Merhaba MERS Tassel, ${item.productName} için oluşturduğum değişim talebini tamamlamak istiyorum.`
    : `Hello MERS Tassel, I would like to complete my exchange request for ${item.productName}.`);

  return (
    <div className="exchange-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="exchange-modal__panel" role="dialog" aria-modal="true" aria-labelledby="exchange-modal-title">
        <button type="button" className="icon-button exchange-modal__close" onClick={onClose} aria-label={tr ? 'Kapat' : 'Close'}><X /></button>
        {submitted ? (
          <div className="exchange-modal__success">
            <CheckCircle2 />
            <span className="eyebrow">{tr ? 'TALEP ALINDI' : 'REQUEST RECEIVED'}</span>
            <h2 id="exchange-modal-title">{tr ? 'Şimdi WhatsApp’tan bize ulaşın.' : 'Now contact us on WhatsApp.'}</h2>
            <p>{tr ? 'Talebiniz fiyatlarıyla birlikte kaydedildi ve fiziksel kontrol bekliyor. Ürün ve sipariş fotoğraflarını WhatsApp üzerinden paylaşın.' : 'Your request and price calculation are saved pending physical verification. Share product and order photos with us on WhatsApp.'}</p>
            <a className="button button--primary" href={`https://wa.me/905528482640?text=${whatsappMessage}`} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp <ArrowRight /></a>
            <button className="text-button" type="button" onClick={onClose}>{tr ? 'Hesabıma dön' : 'Return to account'}</button>
          </div>
        ) : (
          <>
            <span className="eyebrow">{tr ? 'ÜRÜN DEĞİŞİMİ' : 'PRODUCT EXCHANGE'}</span>
            <h2 id="exchange-modal-title">{tr ? `${item.productName} için yeni bir parça seçin.` : `Choose a new piece for ${item.productName}.`}</h2>
            <p className="exchange-modal__lede">{tr ? 'Sunulan tutar, atölye ekibinin ürün, satış belgesi ve ambalaj kontrolünden sonra kesinleşir.' : 'The values become final after the atelier verifies the item, sales document and packaging.'}</p>

            <label className="field"><span>{tr ? 'Yeni ürün ve seçenek' : 'Replacement product and option'}</span>
              <select value={variantId || ''} onChange={(event) => setVariantId(Number(event.target.value))} disabled={products.isPending}>
                <option value="">{products.isPending ? (tr ? 'Ürünler yükleniyor…' : 'Loading products…') : (tr ? 'Bir ürün seçin' : 'Choose a product')}</option>
                {variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.label} · {money(variant.price, currency, locale)}</option>)}
              </select>
            </label>

            {selected && <div className="exchange-math" aria-live="polite">
              <p><span>{tr ? 'Eski ürün değeri' : 'Original item value'}</span><b>{money(item.unitPrice, currency, locale)}</b></p>
              <p><span>{tr ? 'Yeni ürün değeri' : 'New item value'}</span><b>− {money(selected.price, currency, locale)}</b></p>
              <div><span>{difference >= 0 ? (tr ? 'Cüzdana aktarılacak' : 'Credit to wallet') : (tr ? 'Ödenecek fark' : 'Amount due')}</span><strong>{money(Math.abs(difference), currency, locale)}</strong></div>
            </div>}

            <div className="exchange-confirmations">
              <label><input type="checkbox" checked={invoiceIntact} onChange={(event) => setInvoiceIntact(event.target.checked)} /><span>{tr ? 'Orijinal satış belgesi/fatura bende ve eksiksiz.' : 'I have the original sales document/invoice intact.'}</span></label>
              <label><input type="checkbox" checked={packagingIntact} onChange={(event) => setPackagingIntact(event.target.checked)} /><span>{tr ? 'Ürün kutusu ve ambalajı eksiksiz ve hasarsız.' : 'The product box and packaging are complete and undamaged.'}</span></label>
            </div>
            <label className="field"><span>{tr ? 'Notunuz (isteğe bağlı)' : 'Your note (optional)'}</span><textarea maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} placeholder={tr ? 'Değişim hakkında ayrıntı paylaşın…' : 'Share any exchange details…'} /></label>
            {mutation.isError && <p className="exchange-modal__error" role="alert">{error}</p>}
            <button className="button button--primary button--block" type="button" disabled={!variantId || !invoiceIntact || !packagingIntact || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? (tr ? 'Talep gönderiliyor…' : 'Submitting request…') : (tr ? 'Değişim talebini gönder' : 'Submit exchange request')} <ArrowRight /></button>
            <small className="exchange-modal__fineprint">{tr ? '3 iş günlük değişim süresi teslimat tarihinden itibaren hesaplanır. Kanuni 14 günlük cayma hakkınız ayrıdır.' : 'The 3-business-day exchange period runs from delivery. Your separate 14-day statutory withdrawal right remains available.'}</small>
          </>
        )}
      </section>
    </div>
  );
}
