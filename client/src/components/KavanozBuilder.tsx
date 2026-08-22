'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Check, Gift, Heart, PackageCheck, Plus, ShoppingBag, Sparkles, X } from 'lucide-react';
import { catalogKeys, fetchProducts } from '@/lib/catalog';
import { MediaImage } from '@/components/MediaImage';
import { productCopy } from '@/i18n/catalog';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { useToastStore } from '@/stores/toast';
import type { Product, ProductVariant } from '@/types/commerce';

const MIN_ITEMS = 2;
const MAX_ITEMS = 6;

type GroupKey = 'jewelry' | 'cute' | 'everyday';
type SelectedItem = { product: Product; color: string };

const groupCategories: Record<GroupKey, string[]> = {
  jewelry: [
    'rings', 'earrings', 'necklaces', 'bracelets', 'anklets',
    'hand-harness-bracelets', 'shahmaran-bracelets', 'arm-cuffs',
  ],
  cute: ['keychains', 'kids-mini-bags'],
  everyday: ['mens-wallets', 'card-holders', 'womens-handbags'],
};

const copy = {
  en: {
    eyebrow: 'A gift, composed by you',
    title: 'Build a Kavanoz.',
    lede: 'Choose meaningful pieces across the atelier and gather them into one personal gift box. We will arrange every detail by hand.',
    stepOne: '01 · Select the pieces',
    stepTwo: '02 · Make it personal',
    stepThree: '03 · Review your box',
    jewelry: 'Jewelry',
    jewelryCopy: 'Begin with a ring, earrings, necklace or bracelet.',
    cute: 'Cute accessories',
    cuteCopy: 'Add a playful keychain, mini plush charm or little bag.',
    everyday: 'Everyday goods',
    everydayCopy: 'Finish with a wallet, card holder or considered leather piece.',
    add: 'Add to box',
    remove: 'Remove',
    selected: 'Selected',
    soldOut: 'Unavailable',
    finish: 'Finish',
    message: 'Personal gift message',
    messagePlaceholder: 'Write the note you would like us to place inside…',
    packaging: 'Custom packaging notes',
    packagingPlaceholder: 'Ribbon colour, occasion, presentation details…',
    optional: 'Optional',
    boxSummary: 'Your Kavanoz',
    empty: 'Your box is waiting for its first piece.',
    requirement: 'Choose 2–6 pieces, including at least one jewelry item.',
    itemCount: '{{count}} of 6 pieces',
    total: 'Kavanoz total',
    addBox: 'Add box to cart',
    adding: 'Preparing your box…',
    signIn: 'Sign in to add your box',
    minError: 'Choose at least two pieces before adding your Kavanoz.',
    jewelryError: 'Your Kavanoz needs at least one jewelry piece.',
    maxError: 'A Kavanoz holds up to six pieces. Remove one before adding another.',
    unavailableError: 'One of your selected finishes is no longer available. Please choose another.',
    serverError: 'We could not add this Kavanoz. Review the selected pieces and try again.',
    successTitle: 'Your Kavanoz is in the bag',
    successCopy: 'All selected pieces and your personal notes were saved together.',
    loading: 'Opening the Kavanoz collection…',
    loadError: 'The Kavanoz collection could not be loaded. Please try again.',
    retry: 'Try again',
  },
  tr: {
    eyebrow: 'Sizin hazırladığınız bir hediye',
    title: 'Kavanozunuzu oluşturun.',
    lede: 'Atölyenin farklı köşelerinden anlamlı parçalar seçin ve onları kişisel bir hediye kutusunda buluşturun. Her ayrıntıyı el işçiliğiyle hazırlayalım.',
    stepOne: '01 · Parçaları seçin',
    stepTwo: '02 · Kişiselleştirin',
    stepThree: '03 · Kutunuzu gözden geçirin',
    jewelry: 'Takılar',
    jewelryCopy: 'Bir yüzük, küpe, kolye veya bileklikle başlayın.',
    cute: 'Sevimli aksesuarlar',
    cuteCopy: 'Eğlenceli bir anahtarlık, mini pelüş aksesuar veya küçük çanta ekleyin.',
    everyday: 'Günlük parçalar',
    everydayCopy: 'Cüzdan, kartlık veya özenli bir deri parçayla tamamlayın.',
    add: 'Kutuya ekle',
    remove: 'Çıkar',
    selected: 'Seçildi',
    soldOut: 'Stokta yok',
    finish: 'Renk',
    message: 'Kişisel hediye mesajı',
    messagePlaceholder: 'Kutunun içine eklememizi istediğiniz notu yazın…',
    packaging: 'Özel paketleme notları',
    packagingPlaceholder: 'Kurdele rengi, özel gün veya sunum ayrıntıları…',
    optional: 'İsteğe bağlı',
    boxSummary: 'Kavanozunuz',
    empty: 'Kutunuz ilk parçasını bekliyor.',
    requirement: 'En az biri takı olmak üzere 2–6 parça seçin.',
    itemCount: '6 parçadan {{count}} tanesi',
    total: 'Kavanoz toplamı',
    addBox: 'Kutuyu sepete ekle',
    adding: 'Kutunuz hazırlanıyor…',
    signIn: 'Kutunuzu eklemek için giriş yapın',
    minError: 'Kavanozu eklemeden önce en az iki parça seçin.',
    jewelryError: 'Kavanozunuzda en az bir takı bulunmalıdır.',
    maxError: 'Bir Kavanoza en fazla altı parça sığar. Yenisini eklemek için bir parçayı çıkarın.',
    unavailableError: 'Seçtiğiniz renklerden biri artık stokta değil. Lütfen başka bir seçenek belirleyin.',
    serverError: 'Bu Kavanoz sepete eklenemedi. Seçtiğiniz parçaları kontrol edip tekrar deneyin.',
    successTitle: 'Kavanozunuz sepette',
    successCopy: 'Seçtiğiniz tüm parçalar ve kişisel notlarınız birlikte kaydedildi.',
    loading: 'Kavanoz koleksiyonu açılıyor…',
    loadError: 'Kavanoz koleksiyonu yüklenemedi. Lütfen tekrar deneyin.',
    retry: 'Tekrar dene',
  },
} as const;

function availableVariants(product: Product) {
  return product.variants.filter((variant) => variant.isActive && variant.stock > 0);
}

function variantFor(item: SelectedItem): ProductVariant | undefined {
  return availableVariants(item.product).find((variant) => variant.color === item.color);
}

function priceFor(item: SelectedItem) {
  const variant = variantFor(item);
  return variant?.priceOverride ?? item.product.price.amount;
}

export function KavanozBuilder() {
  const { locale } = useI18n();
  const text = copy[locale];
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const addGiftBox = useCartStore((state) => state.addGiftBox);
  const showToast = useToastStore((state) => state.show);
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [giftMessage, setGiftMessage] = useState('');
  const [packagingNotes, setPackagingNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const products = useQuery({
    queryKey: catalogKeys.products({ pageSize: 100, sort: 'featured' }),
    queryFn: () => fetchProducts({ pageSize: 100, sort: 'featured' }),
  });

  const grouped = useMemo(() => {
    const all = (products.data?.items ?? []).filter((product) => product.isActive && availableVariants(product).length > 0);
    return (Object.keys(groupCategories) as GroupKey[]).reduce<Record<GroupKey, Product[]>>((result, group) => {
      result[group] = all.filter((product) => groupCategories[group].includes(product.categorySlug));
      return result;
    }, { jewelry: [], cute: [], everyday: [] });
  }, [products.data]);

  const selectedSlugs = useMemo(() => new Set(selected.map((item) => item.product.slug)), [selected]);
  const hasJewelry = selected.some((item) => groupCategories.jewelry.includes(item.product.categorySlug));
  const total = selected.reduce((sum, item) => sum + priceFor(item), 0);
  const currency = selected[0]?.product.price.currency || 'USD';
  const money = useMemo(() => new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }), [currency, locale]);

  const addProduct = (product: Product) => {
    if (selectedSlugs.has(product.slug)) {
      setSelected((current) => current.filter((item) => item.product.slug !== product.slug));
      setError(null);
      return;
    }
    if (selected.length >= MAX_ITEMS) {
      setError(text.maxError);
      return;
    }
    const variant = availableVariants(product)[0];
    if (!variant) {
      setError(text.unavailableError);
      return;
    }
    setSelected((current) => [...current, { product, color: variant.color }]);
    setError(null);
  };

  const removeProduct = (slug: string) => {
    setSelected((current) => current.filter((item) => item.product.slug !== slug));
    setError(null);
  };

  const changeFinish = (slug: string, color: string) => {
    setSelected((current) => current.map((item) => item.product.slug === slug ? { ...item, color } : item));
    setError(null);
  };

  const submit = async () => {
    if (selected.length < MIN_ITEMS) {
      setError(text.minError);
      return;
    }
    if (!hasJewelry) {
      setError(text.jewelryError);
      return;
    }
    if (selected.some((item) => !variantFor(item))) {
      setError(text.unavailableError);
      return;
    }
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`${pathname}#kavanoz`)}`);
      return;
    }

    setIsAdding(true);
    setError(null);
    const added = await addGiftBox({
      items: selected.map((item) => ({ productSlug: item.product.slug, color: item.color })),
      giftMessage: giftMessage.trim() || undefined,
      packagingNotes: packagingNotes.trim() || undefined,
    });
    setIsAdding(false);

    if (!added) {
      setError(text.serverError);
      return;
    }

    showToast({ tone: 'success', title: text.successTitle, message: text.successCopy });
    setSelected([]);
    setGiftMessage('');
    setPackagingNotes('');
  };

  return (
    <section className="section kavanoz-section" id="kavanoz" aria-labelledby="kavanoz-title">
      <div className="kavanoz-orbit kavanoz-orbit--one" aria-hidden="true" />
      <div className="kavanoz-orbit kavanoz-orbit--two" aria-hidden="true" />
      <div className="container-wide kavanoz-shell">
        <header className="kavanoz-heading">
          <div>
            <span className="eyebrow"><Sparkles /> {text.eyebrow}</span>
            <h2 id="kavanoz-title">{text.title}</h2>
          </div>
          <p>{text.lede}</p>
        </header>

        <div className="kavanoz-layout">
          <div className="kavanoz-catalog" aria-busy={products.isPending}>
            <span className="kavanoz-step">{text.stepOne}</span>
            {products.isPending && <div className="kavanoz-status"><span className="spinner" />{text.loading}</div>}
            {products.isError && (
              <div className="kavanoz-status kavanoz-status--error">
                <p>{text.loadError}</p>
                <button type="button" className="button button--ghost" onClick={() => products.refetch()}>{text.retry}</button>
              </div>
            )}
            {products.isSuccess && (Object.keys(grouped) as GroupKey[]).map((group) => (
              <section className="kavanoz-group" key={group} aria-labelledby={`kavanoz-${group}`}>
                <div className="kavanoz-group__heading">
                  <span>{group === 'jewelry' ? <Heart /> : group === 'cute' ? <Sparkles /> : <PackageCheck />}</span>
                  <div><h3 id={`kavanoz-${group}`}>{text[group]}</h3><p>{text[`${group}Copy`]}</p></div>
                </div>
                <div className="kavanoz-products">
                  {grouped[group].map((product) => {
                    const display = productCopy(product, locale);
                    const isSelected = selectedSlugs.has(product.slug);
                    const firstVariant = availableVariants(product)[0];
                    const itemPrice = firstVariant?.priceOverride ?? product.price.amount;
                    return (
                      <article className={isSelected ? 'kavanoz-product kavanoz-product--selected' : 'kavanoz-product'} key={product.id}>
                        <div className="kavanoz-product__media">
                          <MediaImage src={product.image} alt={display.name} sizes="(max-width: 720px) 42vw, 180px" />
                          {isSelected && <span className="kavanoz-selected-mark"><Check /></span>}
                        </div>
                        <div className="kavanoz-product__copy">
                          <span>{display.category}</span>
                          <h4>{display.name}</h4>
                          <strong>{money.format(itemPrice)}</strong>
                          <button type="button" className="kavanoz-add" onClick={() => addProduct(product)} aria-pressed={isSelected}>
                            {isSelected ? <><X /> {text.remove}</> : <><Plus /> {text.add}</>}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <aside className="kavanoz-builder" aria-label={text.boxSummary}>
            <div className="kavanoz-builder__top">
              <span className="kavanoz-step">{text.stepTwo}</span>
              <label>
                <span>{text.message} <small>{text.optional}</small></span>
                <textarea value={giftMessage} onChange={(event) => setGiftMessage(event.target.value)} maxLength={500} placeholder={text.messagePlaceholder} rows={3} />
                <small className="field-count">{giftMessage.length}/500</small>
              </label>
              <label>
                <span>{text.packaging} <small>{text.optional}</small></span>
                <textarea value={packagingNotes} onChange={(event) => setPackagingNotes(event.target.value)} maxLength={500} placeholder={text.packagingPlaceholder} rows={3} />
                <small className="field-count">{packagingNotes.length}/500</small>
              </label>
            </div>

            <div className="kavanoz-summary">
              <div className="kavanoz-summary__heading">
                <div><span className="kavanoz-step">{text.stepThree}</span><h3><Gift /> {text.boxSummary}</h3></div>
                <span>{text.itemCount.replace('{{count}}', String(selected.length))}</span>
              </div>

              {selected.length === 0 ? (
                <div className="kavanoz-empty"><Gift /><p>{text.empty}</p><small>{text.requirement}</small></div>
              ) : (
                <div className="kavanoz-lines">
                  {selected.map((item) => {
                    const display = productCopy(item.product, locale);
                    return (
                      <div className="kavanoz-line" key={item.product.slug}>
                        <MediaImage src={item.product.image} alt="" sizes="58px" />
                        <div><strong>{display.name}</strong><label><span>{text.finish}</span><select value={item.color} onChange={(event) => changeFinish(item.product.slug, event.target.value)}>{availableVariants(item.product).map((variant) => <option value={variant.color} key={variant.id}>{locale === 'tr' && variant.colorTr ? variant.colorTr : variant.color}</option>)}</select></label></div>
                        <span>{money.format(priceFor(item))}</span>
                        <button type="button" onClick={() => removeProduct(item.product.slug)} aria-label={`${text.remove}: ${display.name}`}><X /></button>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className={error ? 'kavanoz-requirement kavanoz-requirement--error' : 'kavanoz-requirement'} role={error ? 'alert' : undefined}>
                {error || text.requirement}
              </p>
              <div className="kavanoz-total"><span>{text.total}</span><strong>{money.format(total)}</strong></div>
              <button type="button" className="button button--primary button--block kavanoz-submit" onClick={submit} disabled={isAdding || products.isPending}>
                {isAdding ? <>{text.adding}</> : user ? <><ShoppingBag /> {text.addBox}</> : <><ShoppingBag /> {text.signIn}</>}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
