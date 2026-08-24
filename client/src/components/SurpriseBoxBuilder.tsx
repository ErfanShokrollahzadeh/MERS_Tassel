'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Check,
  Clock3,
  Gift,
  Heart,
  PackageCheck,
  ShoppingBag,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { useToastStore } from '@/stores/toast';

type RecipientKey = 'girlfriend' | 'boyfriend' | 'partner' | 'friend' | 'sister' | 'brother' | 'mother' | 'father';
type VibeKey = 'cute' | 'elegant' | 'minimalist' | 'casual' | 'jewelry-heavy' | 'accessories';
type Budget = 30 | 50 | 100;

const recipients: RecipientKey[] = ['girlfriend', 'boyfriend', 'partner', 'friend', 'sister', 'brother', 'mother', 'father'];
const vibes: VibeKey[] = ['cute', 'elegant', 'minimalist', 'casual', 'jewelry-heavy', 'accessories'];
const budgets: Array<{ value: Budget; tier: 'thoughtful' | 'signature' | 'grand' }> = [
  { value: 30, tier: 'thoughtful' },
  { value: 50, tier: 'signature' },
  { value: 100, tier: 'grand' },
];

const copy = {
  en: {
    eyebrow: 'Curated by MERS, revealed by them',
    title: 'Leave room for wonder.',
    lede: 'Tell us who the gift is for, choose the feeling and set your budget. Our atelier will curate the rest—and keep every piece a secret until the box is opened.',
    visualLabel: 'The contents stay a mystery',
    visualTitle: 'You choose the feeling. We choose the surprise.',
    visualCopy: 'Every box is assembled individually from jewelry, playful keepsakes and useful little luxuries.',
    seal: 'Sealed with a little mystery',
    handpicked: 'Handpicked',
    personal: 'Personal',
    unrevealed: 'Unrevealed',
    recipientStep: '01 · Who is it for?',
    recipientHelp: 'Choose the person we should keep in mind while curating.',
    budgetStep: '02 · Choose the gift value',
    budgetHelp: 'The full selected value goes into the curated box.',
    popular: 'Most loved',
    thoughtful: 'Thoughtful',
    signature: 'Signature',
    grand: 'Grand gesture',
    vibeStep: '03 · Set the mood',
    vibeHelp: 'Choose up to four signals. The exact combination stays with our atelier.',
    noteStep: '04 · Add the details',
    giftMessage: 'Message for the recipient',
    giftPlaceholder: 'A note to place inside the box…',
    instructions: 'Private notes for our curator',
    instructionsPlaceholder: 'Favourite colours, allergies, dislikes or anything we should avoid…',
    optional: 'Optional',
    summary: 'Your surprise brief',
    recipient: 'Recipient',
    mood: 'Vibe',
    waiting: 'Not selected yet',
    curation: 'Atelier curation',
    curationTime: '1–2 business days',
    delivery: 'Estimated delivery',
    deliveryTime: '3–5 business days after dispatch',
    total: 'Surprise Box total',
    add: 'Add Surprise Box to cart',
    adding: 'Sealing your surprise…',
    signIn: 'Sign in to add your surprise',
    recipientError: 'Choose who the Surprise Box is for.',
    vibeError: 'Choose at least one vibe for our curator.',
    vibeMaxError: 'Choose up to four vibes so the direction stays focused.',
    serverError: 'We could not add this Surprise Box. Please review your choices and try again.',
    successTitle: 'Your surprise is in the bag',
    successCopy: 'The budget, preferences and private notes are saved for our curator.',
    recipients: {
      girlfriend: 'Girlfriend', boyfriend: 'Boyfriend', partner: 'Partner', friend: 'Friend',
      sister: 'Sister', brother: 'Brother', mother: 'Mother', father: 'Father',
    },
    vibes: {
      cute: 'Cute', elegant: 'Elegant', minimalist: 'Minimalist', casual: 'Casual',
      'jewelry-heavy': 'Jewelry-heavy', accessories: 'Accessories',
    },
  },
  tr: {
    eyebrow: 'MERS seçer, onlar keşfeder',
    title: 'Meraka yer açın.',
    lede: 'Hediyenin kimin için olduğunu, hissini ve bütçenizi söyleyin. Kalanını atölyemiz özenle seçsin; kutu açılana kadar her parça sürpriz kalsın.',
    visualLabel: 'İçindekiler sürpriz kalır',
    visualTitle: 'Siz hissi seçin. Sürprizi biz hazırlayalım.',
    visualCopy: 'Her kutu; takılar, sevimli hatıralar ve kullanışlı küçük lükslerden kişiye özel olarak hazırlanır.',
    seal: 'Biraz gizemle mühürlendi',
    handpicked: 'Özenle seçildi',
    personal: 'Kişiye özel',
    unrevealed: 'Gizli tutuldu',
    recipientStep: '01 · Kimin için?',
    recipientHelp: 'Seçim yaparken kimi düşünmemiz gerektiğini belirtin.',
    budgetStep: '02 · Hediye değerini seçin',
    budgetHelp: 'Seçtiğiniz değerin tamamı hazırlanan kutuya yansır.',
    popular: 'En sevilen',
    thoughtful: 'Düşünceli',
    signature: 'İmza',
    grand: 'Büyük jest',
    vibeStep: '03 · Tarzı belirleyin',
    vibeHelp: 'En fazla dört ipucu seçin. Tam birleşim atölyemizde gizli kalsın.',
    noteStep: '04 · Ayrıntıları ekleyin',
    giftMessage: 'Alıcı için mesaj',
    giftPlaceholder: 'Kutunun içine yerleştirmemizi istediğiniz not…',
    instructions: 'Küratörümüz için özel notlar',
    instructionsPlaceholder: 'Sevdiği renkler, alerjiler, hoşlanmadıkları veya kaçınmamız gerekenler…',
    optional: 'İsteğe bağlı',
    summary: 'Sürpriz özetiniz',
    recipient: 'Alıcı',
    mood: 'Tarz',
    waiting: 'Henüz seçilmedi',
    curation: 'Atölye hazırlığı',
    curationTime: '1–2 iş günü',
    delivery: 'Tahmini teslimat',
    deliveryTime: 'Kargoya verildikten sonra 3–5 iş günü',
    total: 'Sürpriz Kutu toplamı',
    add: 'Sürpriz Kutuyu sepete ekle',
    adding: 'Sürpriziniz mühürleniyor…',
    signIn: 'Sürprizi eklemek için giriş yapın',
    recipientError: 'Sürpriz Kutunun kimin için olduğunu seçin.',
    vibeError: 'Küratörümüz için en az bir tarz seçin.',
    vibeMaxError: 'Yönü belirgin tutmak için en fazla dört tarz seçin.',
    serverError: 'Bu Sürpriz Kutu sepete eklenemedi. Seçimlerinizi kontrol edip tekrar deneyin.',
    successTitle: 'Sürpriziniz sepette',
    successCopy: 'Bütçe, tercihler ve özel notlar küratörümüz için kaydedildi.',
    recipients: {
      girlfriend: 'Kız arkadaş', boyfriend: 'Erkek arkadaş', partner: 'Partner', friend: 'Arkadaş',
      sister: 'Kız kardeş', brother: 'Erkek kardeş', mother: 'Anne', father: 'Baba',
    },
    vibes: {
      cute: 'Sevimli', elegant: 'Zarif', minimalist: 'Minimalist', casual: 'Günlük',
      'jewelry-heavy': 'Takı ağırlıklı', accessories: 'Aksesuarlar',
    },
  },
} as const;

export function SurpriseBoxBuilder() {
  const { locale } = useI18n();
  const text = copy[locale];
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const addSurpriseBox = useCartStore((state) => state.addSurpriseBox);
  const showToast = useToastStore((state) => state.show);
  const [recipient, setRecipient] = useState<RecipientKey | ''>('');
  const [budget, setBudget] = useState<Budget>(50);
  const [selectedVibes, setSelectedVibes] = useState<VibeKey[]>([]);
  const [giftMessage, setGiftMessage] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const money = useMemo(() => new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }), [locale]);

  const toggleVibe = (vibe: VibeKey) => {
    if (selectedVibes.includes(vibe)) {
      setSelectedVibes((current) => current.filter((entry) => entry !== vibe));
      setError(null);
      return;
    }
    if (selectedVibes.length >= 4) {
      setError(text.vibeMaxError);
      return;
    }
    setSelectedVibes((current) => [...current, vibe]);
    setError(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!recipient) {
      setError(text.recipientError);
      return;
    }
    if (selectedVibes.length === 0) {
      setError(text.vibeError);
      return;
    }
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`${pathname}#surprise-box`)}`);
      return;
    }

    setError(null);
    setIsAdding(true);
    const added = await addSurpriseBox({
      recipient,
      budget,
      vibes: selectedVibes,
      giftMessage: giftMessage.trim() || undefined,
      specialInstructions: specialInstructions.trim() || undefined,
    });
    setIsAdding(false);

    if (!added) {
      setError(text.serverError);
      return;
    }

    showToast({ tone: 'success', title: text.successTitle, message: text.successCopy });
    setRecipient('');
    setBudget(50);
    setSelectedVibes([]);
    setGiftMessage('');
    setSpecialInstructions('');
  };

  return (
    <section className="section surprise-section" id="surprise-box" aria-labelledby="surprise-box-title">
      <div className="surprise-orb surprise-orb--one" aria-hidden="true" />
      <div className="surprise-orb surprise-orb--two" aria-hidden="true" />
      <div className="container-wide">
        <header className="surprise-heading">
          <span className="eyebrow"><WandSparkles /> {text.eyebrow}</span>
          <h2 id="surprise-box-title">{text.title}</h2>
          <p>{text.lede}</p>
        </header>

        <div className="surprise-layout">
          <aside className="surprise-story" aria-label={text.visualLabel}>
            <div className="surprise-story__copy">
              <span className="surprise-kicker"><Sparkles /> {text.visualLabel}</span>
              <h3>{text.visualTitle}</h3>
              <p>{text.visualCopy}</p>
            </div>

            <div className="surprise-stage" aria-hidden="true">
              <span className="surprise-question surprise-question--one">?</span>
              <span className="surprise-question surprise-question--two">?</span>
              <span className="surprise-question surprise-question--three">?</span>
              <div className="surprise-box-art">
                <div className="surprise-box-art__lid"><span /></div>
                <div className="surprise-box-art__body">
                  <span className="surprise-box-art__ribbon" />
                  <div className="surprise-box-art__seal"><Gift /><small>MERS</small><strong>Surprise</strong></div>
                </div>
              </div>
              <div className="surprise-price-seal"><span>{text.seal}</span><strong>{money.format(budget)}</strong></div>
            </div>

            <div className="surprise-promises">
              <span><Heart /> {text.handpicked}</span>
              <span><PackageCheck /> {text.personal}</span>
              <span><Sparkles /> {text.unrevealed}</span>
            </div>
          </aside>

          <form className="surprise-form" onSubmit={submit} noValidate>
            <fieldset className="surprise-fieldset">
              <legend><span>{text.recipientStep}</span><small>{text.recipientHelp}</small></legend>
              <div className="surprise-recipient-grid">
                {recipients.map((value) => (
                  <button key={value} type="button" className={recipient === value ? 'surprise-choice surprise-choice--selected' : 'surprise-choice'} onClick={() => { setRecipient(value); setError(null); }} aria-pressed={recipient === value}>
                    <span>{text.recipients[value].slice(0, 1)}</span>{text.recipients[value]}
                    {recipient === value && <Check />}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="surprise-fieldset">
              <legend><span>{text.budgetStep}</span><small>{text.budgetHelp}</small></legend>
              <div className="surprise-budget-grid">
                {budgets.map((option) => (
                  <button key={option.value} type="button" className={budget === option.value ? 'surprise-budget surprise-budget--selected' : 'surprise-budget'} onClick={() => { setBudget(option.value); setError(null); }} aria-pressed={budget === option.value}>
                    {option.value === 50 && <small>{text.popular}</small>}
                    <span>{text[option.tier]}</span>
                    <strong>{money.format(option.value)}</strong>
                    <i>{budget === option.value ? <Check /> : null}</i>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="surprise-fieldset">
              <legend><span>{text.vibeStep}</span><small>{text.vibeHelp}</small></legend>
              <div className="surprise-vibes">
                {vibes.map((value) => {
                  const selected = selectedVibes.includes(value);
                  return <button key={value} type="button" className={selected ? 'surprise-vibe surprise-vibe--selected' : 'surprise-vibe'} onClick={() => toggleVibe(value)} aria-pressed={selected}>{selected ? <Check /> : <Sparkles />}{text.vibes[value]}</button>;
                })}
              </div>
            </fieldset>

            <fieldset className="surprise-fieldset">
              <legend><span>{text.noteStep}</span></legend>
              <div className="surprise-notes">
                <label htmlFor="surprise-gift-message">
                  <span>{text.giftMessage} <small>{text.optional}</small></span>
                  <textarea id="surprise-gift-message" value={giftMessage} onChange={(event) => setGiftMessage(event.target.value)} maxLength={500} rows={3} placeholder={text.giftPlaceholder} />
                  <small className="field-count">{giftMessage.length}/500</small>
                </label>
                <label htmlFor="surprise-instructions">
                  <span>{text.instructions} <small>{text.optional}</small></span>
                  <textarea id="surprise-instructions" value={specialInstructions} onChange={(event) => setSpecialInstructions(event.target.value)} maxLength={350} rows={3} placeholder={text.instructionsPlaceholder} />
                  <small className="field-count">{specialInstructions.length}/350</small>
                </label>
              </div>
            </fieldset>

            <aside className="surprise-summary" aria-live="polite">
              <div className="surprise-summary__head"><div><span>{text.summary}</span><strong>{money.format(budget)}</strong></div><Gift /></div>
              <dl>
                <div><dt>{text.recipient}</dt><dd>{recipient ? text.recipients[recipient] : text.waiting}</dd></div>
                <div><dt>{text.mood}</dt><dd>{selectedVibes.length ? selectedVibes.map((value) => text.vibes[value]).join(' · ') : text.waiting}</dd></div>
                <div><dt><Clock3 /> {text.curation}</dt><dd>{text.curationTime}</dd></div>
                <div><dt><PackageCheck /> {text.delivery}</dt><dd>{text.deliveryTime}</dd></div>
              </dl>
              <div className="surprise-total"><span>{text.total}</span><strong>{money.format(budget)}</strong></div>
              {error && <p className="kavanoz-error" role="alert">{error}</p>}
              <button type="submit" className="button button--primary button--block surprise-submit" disabled={isAdding}>
                {isAdding ? text.adding : user ? text.add : text.signIn} <ShoppingBag />
              </button>
            </aside>
          </form>
        </div>
      </div>
    </section>
  );
}
