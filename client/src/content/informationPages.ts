import type { Locale } from '@/i18n/I18nProvider';

export type InformationPageId = 'privacy' | 'invest' | 'shipping' | 'care';

export type InformationPageContent = {
  eyebrow: string;
  title: string;
  accent: string;
  lede: string;
  note: string;
  cards: Array<{ title: string; copy: string }>;
  sectionLabel: string;
  sections: Array<{ number: string; title: string; copy: string }>;
  ctaTitle: string;
  ctaCopy: string;
  ctaLabel: string;
  ctaHref: string;
};

const en: Record<InformationPageId, InformationPageContent> = {
  privacy: {
    eyebrow: 'Privacy · Security · Trust', title: 'Your trust,', accent: 'kept carefully.',
    lede: 'Thoughtful objects deserve a thoughtful digital experience. We collect only what helps us serve you, protect it with modern safeguards, and never sell your personal information.',
    note: 'Plain language, minimal collection, meaningful control.',
    cards: [
      { title: 'Only what we need', copy: 'Account, delivery, and order details are used only to provide the experience you request.' },
      { title: 'Protected checkout', copy: 'Payments are completed through Stripe. MERS Tassel never sees or stores your full card number.' },
      { title: 'Your choices', copy: 'You may request access, correction, or deletion of eligible personal information at any time.' },
    ],
    sectionLabel: 'How we care for your information',
    sections: [
      { number: '01', title: 'What we collect', copy: 'We may receive your name, email, delivery details, order history, saved bag, and essential technical data used to keep the storefront reliable and secure.' },
      { number: '02', title: 'How it is used', copy: 'Information supports account access, order fulfilment, customer care, fraud prevention, and optional atelier notes. We do not rent or sell customer profiles.' },
      { number: '03', title: 'Your privacy rights', copy: 'Contact the atelier to ask what we hold, update inaccurate details, unsubscribe from notes, or request deletion where retention is not legally required.' },
    ],
    ctaTitle: 'A question about your data?', ctaCopy: 'Our care team will answer privacy and account questions in clear, human language.', ctaLabel: 'Contact the care team', ctaHref: '/contact',
  },
  invest: {
    eyebrow: 'Partnership · Purpose · Patience', title: 'Grow slowly.', accent: 'Build something lasting.',
    lede: 'MERS Tassel is an atelier-led business. Our opportunity is not unlimited volume—it is thoughtful growth that protects the handwork, materials, and emotional character people come to us for.',
    note: 'This page is an invitation to a conversation, not a public investment offering.',
    cards: [
      { title: 'Small-batch by design', copy: 'Production follows skilled maker hours and material availability. Scarcity is a quality boundary, not a marketing trick.' },
      { title: 'Craft before volume', copy: 'We invest in repeatable systems around the makers while keeping the finishing, inspection, and story distinctly human.' },
      { title: 'Long-term alignment', copy: 'We value patient partners who understand brand, responsible retail, and the strength of growing without erasing character.' },
    ],
    sectionLabel: 'The shape of the opportunity',
    sections: [
      { number: '01', title: 'Our working limit', copy: 'We will not chase mass-production economics. Capacity expands only when training, sourcing, and quality control can expand with it. That limit protects trust and creates durable value.' },
      { number: '02', title: 'What we are building', copy: 'A stronger direct-to-customer experience, selective international reach, deeper atelier services, and a catalog designed around repeat affection rather than disposable trends.' },
      { number: '03', title: 'Who we want to meet', copy: 'Patient capital, retail collaborators, material innovators, and cultural partners who can help MERS travel further while keeping Istanbul and the workbench at its center.' },
    ],
    ctaTitle: 'Begin with a considered note.', ctaCopy: 'Share your background, your interest in MERS, and the kind of partnership you imagine.', ctaLabel: 'Start a conversation', ctaHref: 'mailto:atelier@merstassel.com?subject=MERS%20partnership%20inquiry',
  },
  shipping: {
    eyebrow: 'Preparation · Delivery · Returns', title: 'From our hands', accent: 'to yours.',
    lede: 'Every order leaves the atelier carefully inspected, wrapped, and ready to become part of your everyday. Here is what happens between your order and the moment it arrives.',
    note: 'Tracked delivery, considered packaging, and 30-day returns.',
    cards: [
      { title: 'Atelier preparation', copy: 'Ready pieces usually leave within 2–4 business days. Made-to-order pieces show their longer timing before checkout.' },
      { title: 'A tracked journey', copy: 'When your parcel leaves, we send a dispatch note with its carrier and tracking link.' },
      { title: 'Thoughtful returns', copy: 'Eligible unworn pieces may be returned within 30 days of delivery in their original condition and packaging.' },
    ],
    sectionLabel: 'Your order journey',
    sections: [
      { number: '01', title: 'Prepared in the atelier', copy: 'We confirm stock, complete a final quality check, and wrap each item securely. Personalized and made-to-order pieces may need additional time.' },
      { number: '02', title: 'Dispatch and delivery', copy: 'Delivery estimates begin after dispatch and may vary by destination, customs, or carrier conditions. Duties and import taxes may apply outside Türkiye.' },
      { number: '03', title: 'Returns and exchanges', copy: 'Contact us before returning a piece so we can provide instructions. Worn, altered, engraved, hygiene-sensitive, and custom-made items may not be eligible unless faulty.' },
    ],
    ctaTitle: 'Need help with a journey?', ctaCopy: 'Send your order number and our care team will trace the details with you.', ctaLabel: 'Ask about an order', ctaHref: '/contact',
  },
  care: {
    eyebrow: 'Wear · Rest · Restore', title: 'Made to live', accent: 'beautifully.',
    lede: 'A little care lets metal, silk, leather, and stones age with character. These quiet rituals protect the finish and keep each piece ready for the next story.',
    note: 'Gentle care at home. Skilled help when a piece needs more.',
    cards: [
      { title: 'Keep it dry', copy: 'Remove pieces before bathing, swimming, exercising, or using perfume, creams, and household cleaners.' },
      { title: 'Store it softly', copy: 'Give each piece its own pouch, close clasps, and keep chains flat to prevent rubbing, tarnish, and tangling.' },
      { title: 'Repair, do not replace', copy: 'Loose knots, tired clasps, and worn finishes are often repairable. Ask the atelier before giving up on a favorite.' },
    ],
    sectionLabel: 'A simple care ritual',
    sections: [
      { number: '01', title: 'After every wear', copy: 'Wipe surfaces with a clean, dry, soft cloth. Let leather and textile pieces air naturally before returning them to their pouch.' },
      { number: '02', title: 'Gentle cleaning', copy: 'Avoid abrasive cloths, dips, ultrasonic machines, alcohol, and chemical jewelry cleaners. Pearls, plated finishes, silk, and leather need especially light handling.' },
      { number: '03', title: 'Atelier care', copy: 'If a stone moves, a thread loosens, or a closure changes, stop wearing the piece and send photographs. We will advise whether it can be refreshed or repaired.' },
    ],
    ctaTitle: 'Let the atelier take a look.', ctaCopy: 'Tell us what changed and include photographs when possible. We will suggest the gentlest next step.', ctaLabel: 'Ask about a repair', ctaHref: '/contact',
  },
};

const tr: Record<InformationPageId, InformationPageContent> = {
  privacy: {
    eyebrow: 'Gizlilik · Güvenlik · Güven', title: 'Güveniniz,', accent: 'özenle korunur.',
    lede: 'Özenli nesneler, özenli bir dijital deneyimi hak eder. Yalnızca size hizmet etmek için gereken bilgileri toplar, modern önlemlerle korur ve kişisel bilgilerinizi asla satmayız.',
    note: 'Sade dil, en az veri, gerçek kontrol.',
    cards: [
      { title: 'Yalnızca gerekenler', copy: 'Hesap, teslimat ve sipariş bilgileri yalnızca talep ettiğiniz deneyimi sunmak için kullanılır.' },
      { title: 'Korumalı ödeme', copy: 'Ödemeler Stripe üzerinden tamamlanır. MERS Tassel kart numaranızın tamamını görmez veya saklamaz.' },
      { title: 'Seçimleriniz', copy: 'Uygun kişisel bilgilerinize erişmeyi, bunları düzeltmeyi veya silmeyi istediğiniz zaman talep edebilirsiniz.' },
    ],
    sectionLabel: 'Bilgilerinize nasıl özen gösteriyoruz',
    sections: [
      { number: '01', title: 'Neleri topluyoruz', copy: 'Adınız, e-postanız, teslimat bilgileriniz, sipariş geçmişiniz, kayıtlı çantanız ve mağazayı güvenli tutmaya yarayan temel teknik veriler alınabilir.' },
      { number: '02', title: 'Nasıl kullanılıyor', copy: 'Bilgiler hesap erişimi, sipariş hazırlığı, müşteri desteği, dolandırıcılığın önlenmesi ve isteğe bağlı atölye notları için kullanılır. Müşteri profillerini kiralamaz veya satmayız.' },
      { number: '03', title: 'Gizlilik haklarınız', copy: 'Hakkınızda tuttuğumuz bilgileri öğrenmek, yanlış verileri düzeltmek, notlardan çıkmak veya yasal olarak saklanması gerekmeyen verileri sildirmek için bize ulaşabilirsiniz.' },
    ],
    ctaTitle: 'Verileriniz hakkında bir sorunuz mu var?', ctaCopy: 'Destek ekibimiz gizlilik ve hesap sorularını açık, insani bir dille yanıtlar.', ctaLabel: 'Destek ekibine ulaşın', ctaHref: '/contact',
  },
  invest: {
    eyebrow: 'Ortaklık · Amaç · Sabır', title: 'Yavaş büyüyün.', accent: 'Kalıcı bir şey kurun.',
    lede: 'MERS Tassel atölye odaklı bir işletmedir. Fırsatımız sınırsız hacim değil; insanların sevdiği el işçiliğini, malzemeyi ve duygusal karakteri koruyan düşünceli bir büyümedir.',
    note: 'Bu sayfa bir görüşme davetidir; halka açık bir yatırım teklifi değildir.',
    cards: [
      { title: 'Küçük seri, bilinçli seçim', copy: 'Üretim, usta çalışma saatlerini ve malzeme bulunabilirliğini izler. Sınırlılık bir pazarlama oyunu değil, kalite sınırıdır.' },
      { title: 'Hacimden önce zanaat', copy: 'Ustaların çevresindeki sistemleri güçlendirirken bitirme, kontrol ve hikâyeyi belirgin biçimde insani tutarız.' },
      { title: 'Uzun vadeli uyum', copy: 'Markayı, sorumlu perakendeyi ve karakteri silmeden büyümenin gücünü anlayan sabırlı ortaklara değer veririz.' },
    ],
    sectionLabel: 'Fırsatın biçimi',
    sections: [
      { number: '01', title: 'Çalışma sınırımız', copy: 'Seri üretim ekonomisinin peşinden gitmeyeceğiz. Kapasite yalnızca eğitim, tedarik ve kalite kontrol de birlikte büyüyebildiğinde artar. Bu sınır güveni korur ve kalıcı değer yaratır.' },
      { number: '02', title: 'Ne inşa ediyoruz', copy: 'Daha güçlü bir doğrudan müşteri deneyimi, seçici uluslararası erişim, daha derin atölye hizmetleri ve geçici trendlere değil tekrar sevgiye dayanan bir katalog.' },
      { number: '03', title: 'Kimlerle tanışmak istiyoruz', copy: 'MERS’in daha uzağa ulaşmasına yardım ederken İstanbul’u ve çalışma tezgâhını merkezde tutacak sabırlı sermaye, perakende ortakları, malzeme yenilikçileri ve kültür iş birlikleri.' },
    ],
    ctaTitle: 'Özenli bir notla başlayın.', ctaCopy: 'Geçmişinizi, MERS’e ilginizi ve hayal ettiğiniz ortaklığı bizimle paylaşın.', ctaLabel: 'Görüşme başlatın', ctaHref: 'mailto:atelier@merstassel.com?subject=MERS%20ortaklık%20görüşmesi',
  },
  shipping: {
    eyebrow: 'Hazırlık · Teslimat · İade', title: 'Ellerimizden', accent: 'size.',
    lede: 'Her sipariş atölyeden dikkatle kontrol edilmiş, paketlenmiş ve gündelik hayatınızın parçası olmaya hazır biçimde ayrılır. Siparişinizle size ulaştığı an arasında olanlar burada.',
    note: 'Takipli teslimat, özenli paketleme ve 30 gün içinde iade.',
    cards: [
      { title: 'Atölye hazırlığı', copy: 'Hazır parçalar genellikle 2–4 iş gününde yola çıkar. Sipariş üzerine parçaların daha uzun süresi ödeme öncesinde gösterilir.' },
      { title: 'Takip edilen yolculuk', copy: 'Paketiniz ayrıldığında kargo firması ve takip bağlantısını içeren bir gönderim notu yollarız.' },
      { title: 'Özenli iadeler', copy: 'Uygun ve kullanılmamış parçalar, teslimattan sonraki 30 gün içinde özgün durumunda ve ambalajında iade edilebilir.' },
    ],
    sectionLabel: 'Siparişinizin yolculuğu',
    sections: [
      { number: '01', title: 'Atölyede hazırlanır', copy: 'Stok doğrulanır, son kalite kontrolü yapılır ve her ürün güvenle paketlenir. Kişiselleştirilmiş ve sipariş üzerine parçalar ek süre gerektirebilir.' },
      { number: '02', title: 'Gönderim ve teslimat', copy: 'Teslimat tahminleri gönderimden sonra başlar; varış noktasına, gümrüğe veya taşıyıcı koşullarına göre değişebilir. Türkiye dışındaki siparişlerde vergi ve gümrük ücreti uygulanabilir.' },
      { number: '03', title: 'İade ve değişim', copy: 'Talimatları paylaşabilmemiz için ürünü göndermeden önce bize ulaşın. Kullanılmış, değiştirilmiş, kazınmış, hijyen hassasiyetli ve özel üretim ürünler kusurlu olmadıkça uygun olmayabilir.' },
    ],
    ctaTitle: 'Yolculukla ilgili yardım mı gerekiyor?', ctaCopy: 'Sipariş numaranızı gönderin; destek ekibimiz ayrıntıları sizinle birlikte takip etsin.', ctaLabel: 'Sipariş hakkında sorun', ctaHref: '/contact',
  },
  care: {
    eyebrow: 'Kullanın · Dinlendirin · Yenileyin', title: 'Güzel yaşamak', accent: 'için üretildi.',
    lede: 'Biraz özen; metalin, ipeğin, derinin ve taşların karakterle yaşlanmasını sağlar. Bu küçük ritüeller yüzeyi korur ve her parçayı sıradaki hikâyeye hazır tutar.',
    note: 'Evde nazik bakım. Daha fazlası gerektiğinde usta desteği.',
    cards: [
      { title: 'Kuru tutun', copy: 'Banyo, yüzme, spor sırasında ve parfüm, krem ya da ev temizleyicileri kullanırken parçalarınızı çıkarın.' },
      { title: 'Yumuşakça saklayın', copy: 'Sürtünmeyi, kararmayı ve dolaşmayı önlemek için her parçayı ayrı kesede, tokaları kapalı ve zincirleri düz biçimde saklayın.' },
      { title: 'Değiştirmeyin, onarın', copy: 'Gevşek düğümler, yorulan tokalar ve aşınan yüzeyler çoğu zaman onarılabilir. Sevdiğinizden vazgeçmeden önce atölyeye sorun.' },
    ],
    sectionLabel: 'Basit bir bakım ritüeli',
    sections: [
      { number: '01', title: 'Her kullanımdan sonra', copy: 'Yüzeyi temiz, kuru ve yumuşak bir bezle silin. Deri ve tekstil parçaları kesesine koymadan önce doğal biçimde havalandırın.' },
      { number: '02', title: 'Nazik temizlik', copy: 'Aşındırıcı bez, daldırma solüsyonu, ultrasonik makine, alkol ve kimyasal takı temizleyicilerinden kaçının. İnci, kaplama, ipek ve deri özellikle hafif bakım ister.' },
      { number: '03', title: 'Atölye bakımı', copy: 'Bir taş oynarsa, iplik gevşerse veya kapama değişirse parçayı kullanmayı bırakıp fotoğraf gönderin. Yenilenip yenilenemeyeceğini veya onarımı size öneririz.' },
    ],
    ctaTitle: 'Atölye bir göz atsın.', ctaCopy: 'Neyin değiştiğini anlatın ve mümkünse fotoğraf ekleyin. En nazik sonraki adımı önerelim.', ctaLabel: 'Onarım hakkında sorun', ctaHref: '/contact',
  },
};

export function informationPage(locale: Locale, id: InformationPageId) {
  return (locale === 'tr' ? tr : en)[id];
}
