import type { Locale } from '@/i18n/I18nProvider';

export type InformationPageId = 'privacy' | 'invest' | 'shipping' | 'returns' | 'care';

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
      { title: 'Protected checkout', copy: 'Payments are completed on the encrypted page of our configured payment partner. MERS Tassel never sees or stores your full card number.' },
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
    ctaTitle: 'Begin with a considered note.', ctaCopy: 'Share your background, your interest in MERS, and the kind of partnership you imagine.', ctaLabel: 'Start a conversation', ctaHref: 'mailto:merstassel@gmail.com?subject=MERS%20partnership%20inquiry',
  },
  shipping: {
    eyebrow: 'Shipping · Delivery · PTT', title: 'From Eskişehir', accent: 'to your door.',
    lede: 'MERSTassel delivers physical jewellery, bags, wallets, keychains, prayer beads, and accessories throughout Türkiye with PTT. These terms explain preparation, delivery, cost, delay, loss, and damage procedures.',
    note: '1–2 business days preparation · 3–5 business days estimated delivery.',
    cards: [
      { title: 'Prepared with care', copy: 'Paid orders are normally checked, packed, and handed to PTT within 1–2 business days.' },
      { title: 'Clear delivery pricing', copy: 'Standard delivery is 30 TL. For Eskişehir addresses, delivery is free on orders of 500 TL and above.' },
      { title: 'Protected in transit', copy: 'MERSTassel remains responsible for loss or damage until the order reaches you or the person you designate.' },
    ],
    sectionLabel: 'Shipping and delivery terms',
    sections: [
      { number: '01', title: 'Order processing', copy: 'Orders whose payment has been successfully received are normally prepared within 1–2 business days. Weekends, public holidays, campaign periods, stock checks, and made-to-order or personalised production may extend this period. Any longer preparation period is shown on the relevant product page before purchase.' },
      { number: '02', title: 'Carrier and service area', copy: 'Domestic orders are dispatched with PTT to deliverable addresses throughout Türkiye. International shipping is not currently offered. Any future international service, destination, customs charge, and delivery estimate will be disclosed before the customer confirms the order.' },
      { number: '03', title: 'Estimated delivery', copy: 'Delivery normally takes 3–5 business days after dispatch. Remote districts, villages, mobile service areas, severe weather, public holidays, and operational congestion may require additional time. Tracking details are provided after the parcel is accepted by PTT.' },
      { number: '04', title: 'Shipping charges', copy: 'Standard shipping costs 30 TL. For delivery addresses in Eskişehir, standard shipping is free when the order total is 500 TL or more. The applicable charge is shown before payment. No undisclosed delivery cost is collected after the order is confirmed.' },
      { number: '05', title: 'Address and receipt', copy: 'Customers must provide a complete and accurate delivery address and reachable telephone number. If a parcel is returned because the address is incorrect, incomplete, or delivery is repeatedly refused, MERSTassel will contact the customer before arranging a new dispatch and will apply mandatory consumer-law protections.' },
      { number: '06', title: 'Delay or impossibility', copy: 'If delivery is delayed, contact merstassel@gmail.com with your order number and we will investigate with PTT. Except for goods prepared for personal requirements, products are supplied within the promised period and, where legally applicable, no later than 30 days. If performance becomes impossible, the customer is notified in writing or by durable medium within three days and all collected payments, including delivery charges, are refunded within 14 days.' },
      { number: '07', title: 'Lost parcels', copy: 'MERSTassel is responsible for loss until the order is delivered to the customer or a third person designated by the customer other than the carrier. If PTT confirms that a shipment is lost, the product will be resent where available or the order will be refunded in accordance with the customer’s statutory rights.' },
      { number: '08', title: 'Damaged parcels', copy: 'If a parcel appears torn, crushed, wet, opened, or damaged, photograph it and, where possible, ask the PTT officer for a damage report. Send the photographs, report, and order number to merstassel@gmail.com. Absence of a carrier report does not by itself remove the customer’s statutory rights concerning defective goods.' },
      { number: '09', title: 'Returns', copy: 'Delivery terms do not limit the statutory right of withdrawal or rights relating to defective goods. Eligible returns are handled through PTT under the separate Return and Right of Withdrawal Policy.' },
    ],
    ctaTitle: 'Need help with a journey?', ctaCopy: 'Send your order number and our care team will trace the details with you.', ctaLabel: 'Ask about an order', ctaHref: '/contact',
  },
  returns: {
    eyebrow: 'Returns · Withdrawal · Refunds', title: 'A clear return', accent: 'from beginning to end.',
    lede: 'This policy explains your statutory right of withdrawal, how to return an eligible product with PTT, when refunds are made, and which legally defined exceptions may apply.',
    note: '14-day right of withdrawal · free return through the designated PTT process.',
    cards: [
      { title: 'Fourteen days', copy: 'Subject to legal exceptions, consumers may withdraw within 14 days without giving a reason or paying a penalty.' },
      { title: 'PTT return support', copy: 'Start the return by email. We will provide the PTT return instructions and cover the designated return shipment.' },
      { title: 'Refund to your payment method', copy: 'Eligible refunds are made without a fee and in accordance with the payment method used for the purchase.' },
    ],
    sectionLabel: 'Return and right of withdrawal policy',
    sections: [
      { number: '01', title: 'Your right of withdrawal', copy: 'Under Turkish Consumer Protection Law No. 6502 and the Distance Sales Regulation, a consumer may withdraw from an eligible distance contract within 14 days without giving a reason or paying a penalty. For goods, the period begins when the customer or a third person designated by the customer, other than the carrier, receives the goods. Withdrawal may also be exercised between formation of the contract and delivery.' },
      { number: '02', title: 'How the period is calculated', copy: 'For products delivered separately under one order, the period begins on receipt of the last product. For a product made of multiple parts, it begins on receipt of the last part. For services, it begins when the contract is formed. If the required withdrawal information was not properly provided, the statutory extended period applies.' },
      { number: '03', title: 'How to start a return', copy: 'Before the 14-day period expires, send a clear withdrawal statement to merstassel@gmail.com. Include your full name, order number, delivery date, the product being returned, and a reachable phone number. You may use the statutory model withdrawal form, but it is not mandatory. A phone call alone should not be relied on as a withdrawal notice.' },
      { number: '04', title: 'Returning with PTT', copy: 'Unless MERSTassel offers to collect the product, hand it to PTT within 14 days after sending your withdrawal notice. We will provide the return instructions by email. The return address is MERSTassel, Yenibağlar Mahallesi, Beraberlik Sokak, Tepebaşı, Eskişehir, Türkiye. Do not send a cash-on-delivery parcel or use another carrier without contacting us first.' },
      { number: '05', title: 'Return shipping cost', copy: 'When the designated PTT return process is used, MERSTassel pays the return shipping cost. If the disclosed carrier has no branch in the customer’s location, collection will be arranged without an additional charge. Return shipping for defective, incorrect, incomplete, or transit-damaged products is always covered by MERSTassel.' },
      { number: '06', title: 'Condition of returned goods', copy: 'Where reasonably possible, return the product with its original packaging, accessories, certificates, instructions, promotional gifts, and order information. You may inspect a product as reasonably necessary to establish its nature, characteristics, and operation. Opening ordinary packaging does not automatically remove the right of withdrawal unless a statutory exception applies. Responsibility for value loss caused by handling beyond normal inspection is assessed under mandatory law.' },
      { number: '07', title: 'Statutory exceptions', copy: 'Unless otherwise agreed, withdrawal does not apply to goods made or personalised to the customer’s specifications; goods liable to deteriorate rapidly; sealed goods unsuitable for return for health or hygiene reasons once opened, including hygiene-sealed earrings and similar body-contact products; goods inseparably mixed after delivery; immediately supplied digital content or online services; services begun during the withdrawal period with the customer’s prior express consent; and other contracts excluded by law. Jewellery whose price depends on financial-market fluctuations outside the seller’s control may also fall within an exception. Any applicable exception is disclosed before purchase.' },
      { number: '08', title: 'Refund timing and method', copy: 'For delivered goods returned with the designated carrier, the statutory refund period begins when the product is handed to that carrier; if another carrier is used, it begins when the product reaches MERSTassel. Eligible payments, including the applicable standard outbound delivery charge, are refunded within 14 days, through the original payment method, in one transaction, and without a fee. Banks and payment providers may need additional time to display the credit.' },
      { number: '09', title: 'Defective or incorrect products', copy: 'Claims concerning damaged, defective, incomplete, incorrect, or non-conforming products are separate from the right of withdrawal. Where the legal conditions are met, the consumer may request repair, replacement, a price reduction, or termination with a refund under Law No. 6502. These return costs are not charged to the customer.' },
      { number: '10', title: 'Cancellation and disputes', copy: 'For an order not yet dispatched, email merstassel@gmail.com as soon as possible. Personalised production already begun and digital content supplied with express consent may be subject to statutory exceptions. Unresolved consumer disputes may be submitted to the competent Consumer Arbitration Committee or, following mandatory mediation where required, the Consumer Court under current jurisdictional rules.' },
    ],
    ctaTitle: 'Ready to begin a return?', ctaCopy: 'Email your order number and the item you wish to return. We will reply with the PTT instructions.', ctaLabel: 'Email the return team', ctaHref: 'mailto:merstassel@gmail.com?subject=MERSTassel%20return%20request',
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
      { title: 'Korumalı ödeme', copy: 'Ödemeler, yapılandırılan ödeme ortağımızın şifreli sayfasında tamamlanır. MERS Tassel kart numaranızın tamamını görmez veya saklamaz.' },
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
    ctaTitle: 'Özenli bir notla başlayın.', ctaCopy: 'Geçmişinizi, MERS’e ilginizi ve hayal ettiğiniz ortaklığı bizimle paylaşın.', ctaLabel: 'Görüşme başlatın', ctaHref: 'mailto:merstassel@gmail.com?subject=MERS%20ortaklık%20görüşmesi',
  },
  shipping: {
    eyebrow: 'Kargo · Teslimat · PTT', title: 'Eskişehir’den', accent: 'kapınıza.',
    lede: 'MERSTassel; takı, çanta, cüzdan, anahtarlık, tesbih ve aksesuar siparişlerini PTT ile Türkiye genelindeki müşterilerine ulaştırır. Bu koşullar hazırlık, teslimat, ücret, gecikme, kayıp ve hasar süreçlerini açıklar.',
    note: '1–2 iş günü hazırlık · Tahmini 3–5 iş günü teslimat.',
    cards: [
      { title: 'Özenle hazırlanır', copy: 'Ödemesi alınan siparişler normal şartlarda 1–2 iş gününde kontrol edilir, paketlenir ve PTT’ye teslim edilir.' },
      { title: 'Açık kargo ücreti', copy: 'Standart kargo 30 TL’dir. Eskişehir adresli 500 TL ve üzeri siparişlerde kargo ücretsizdir.' },
      { title: 'Taşımada koruma', copy: 'Sipariş size veya belirlediğiniz kişiye ulaşıncaya kadar kayıp ve hasar sorumluluğu MERSTassel’e aittir.' },
    ],
    sectionLabel: 'Teslimat ve kargo koşulları',
    sections: [
      { number: '01', title: 'Siparişin hazırlanması', copy: 'Ödemesi başarıyla alınan siparişler normal şartlarda 1–2 iş günü içinde hazırlanır. Hafta sonu, resmî tatil, kampanya yoğunluğu, stok kontrolü ile sipariş üzerine veya kişiye özel üretim bu süreyi uzatabilir. Daha uzun hazırlık süresi gereken ürünlerde bu bilgi satın alma öncesinde ürün sayfasında gösterilir.' },
      { number: '02', title: 'Taşıyıcı ve teslimat alanı', copy: 'Yurt içi siparişler PTT ile Türkiye genelindeki teslimata açık adreslere gönderilir. Şu anda yurt dışına teslimat yapılmamaktadır. Gelecekte uluslararası teslimat başlatılırsa ülkeler, süreler, kargo ve gümrük ücretleri sipariş onayından önce açıkça gösterilecektir.' },
      { number: '03', title: 'Tahmini teslimat süresi', copy: 'Kargoya verildikten sonra teslimat normal şartlarda 3–5 iş günüdür. Uzak ilçe, köy, mobil dağıtım alanı, olumsuz hava, resmî tatil veya PTT operasyon yoğunluğu ek süre gerektirebilir. Gönderi PTT tarafından kabul edildiğinde takip bilgisi müşteriye iletilir.' },
      { number: '04', title: 'Kargo ücreti', copy: 'Standart kargo ücreti 30 TL’dir. Teslimat adresi Eskişehir olan 500 TL ve üzerindeki siparişlerde standart kargo ücretsizdir. Geçerli ücret ödeme öncesinde gösterilir; sipariş onayından sonra önceden bildirilmeyen bir teslimat bedeli talep edilmez.' },
      { number: '05', title: 'Adres ve teslim alma', copy: 'Müşteri eksiksiz ve doğru teslimat adresi ile ulaşılabilir bir telefon numarası sağlamalıdır. Yanlış veya eksik adres ya da teslimatın tekrar tekrar reddedilmesi nedeniyle gönderi geri dönerse, yeniden gönderim öncesinde müşteriyle iletişim kurulur ve emredici tüketici hukuku hükümleri uygulanır.' },
      { number: '06', title: 'Gecikme veya imkânsızlık', copy: 'Teslimat gecikirse sipariş numaranızla merstassel@gmail.com adresine yazabilirsiniz; PTT nezdinde araştırma başlatılır. Kişisel ihtiyaca göre hazırlanan mallar dışında siparişler taahhüt edilen sürede ve mevzuatın uygulandığı hâllerde en geç 30 gün içinde yerine getirilir. İfa imkânsızlaşırsa müşteri üç gün içinde yazılı olarak veya kalıcı veri saklayıcısıyla bilgilendirilir ve teslimat masrafları dâhil tahsil edilen tüm ödemeler 14 gün içinde iade edilir.' },
      { number: '07', title: 'Kayıp gönderi', copy: 'Sipariş müşteriye veya taşıyıcı dışında müşterinin belirlediği üçüncü kişiye teslim edilene kadar kayıptan MERSTassel sorumludur. PTT gönderinin kaybolduğunu doğrularsa stok durumuna göre ürün yeniden gönderilir veya müşterinin kanuni haklarına uygun şekilde sipariş bedeli iade edilir.' },
      { number: '08', title: 'Hasarlı gönderi', copy: 'Paket yırtılmış, ezilmiş, ıslanmış, açılmış veya hasarlı görünüyorsa fotoğraf çekmeniz ve mümkünse PTT görevlisine hasar tutanağı düzenletmeniz önerilir. Fotoğrafları, tutanağı ve sipariş numaranızı merstassel@gmail.com adresine gönderin. Tutanak bulunmaması, ayıplı mala ilişkin kanuni haklarınızı tek başına ortadan kaldırmaz.' },
      { number: '09', title: 'İade işlemleri', copy: 'Teslimat koşulları, kanuni cayma hakkını veya ayıplı mala ilişkin hakları sınırlamaz. Uygun iadeler, ayrı İade ve Cayma Hakkı Politikası uyarınca PTT üzerinden yürütülür.' },
    ],
    ctaTitle: 'Yolculukla ilgili yardım mı gerekiyor?', ctaCopy: 'Sipariş numaranızı gönderin; destek ekibimiz ayrıntıları sizinle birlikte takip etsin.', ctaLabel: 'Sipariş hakkında sorun', ctaHref: '/contact',
  },
  returns: {
    eyebrow: 'İade · Cayma · Geri Ödeme', title: 'Baştan sona', accent: 'açık bir iade.',
    lede: 'Bu politika kanuni cayma hakkınızı, uygun bir ürünü PTT ile nasıl iade edeceğinizi, geri ödemenin ne zaman yapılacağını ve hangi yasal istisnaların uygulanabileceğini açıklar.',
    note: '14 günlük cayma hakkı · Belirlenen PTT süreciyle ücretsiz iade.',
    cards: [
      { title: 'On dört gün', copy: 'Kanuni istisnalar saklı kalmak üzere tüketici, gerekçe göstermeden ve cezai şart ödemeden 14 gün içinde cayabilir.' },
      { title: 'PTT iade desteği', copy: 'İade sürecini e-postayla başlatın; PTT talimatlarını paylaşalım ve belirlenen iade gönderisini biz karşılayalım.' },
      { title: 'Ödeme aracına iade', copy: 'Uygun geri ödemeler masrafsız ve satın alırken kullanılan ödeme aracına uygun şekilde yapılır.' },
    ],
    sectionLabel: 'İade ve cayma hakkı şartları',
    sections: [
      { number: '01', title: 'Cayma hakkınız', copy: '6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca tüketici, yasal istisnalar saklı kalmak üzere, uygun bir mesafeli sözleşmeden 14 gün içinde gerekçe göstermeden ve cezai şart ödemeden cayabilir. Mal satışında süre, tüketicinin veya taşıyıcı dışında tüketicinin belirlediği üçüncü kişinin ürünü teslim aldığı gün başlar. Teslimattan önce de cayma hakkı kullanılabilir.' },
      { number: '02', title: 'Sürenin hesaplanması', copy: 'Tek siparişte ayrı ayrı teslim edilen ürünlerde süre son ürünün; birden çok parçadan oluşan üründe son parçanın teslimiyle başlar. Hizmetlerde süre sözleşmenin kurulduğu gün başlar. Gerekli cayma bilgilendirmesinin usulüne uygun yapılmaması hâlinde mevzuattaki uzatılmış süre uygulanır.' },
      { number: '03', title: 'İade talebi nasıl başlatılır?', copy: '14 günlük süre dolmadan merstassel@gmail.com adresine açık bir cayma beyanı gönderin. Ad soyad, sipariş numarası, teslim tarihi, iade edilecek ürün ve ulaşılabilir telefon numarasını ekleyin. Örnek cayma formunu kullanabilirsiniz ancak bu zorunlu değildir. Yalnızca telefonla yapılan bildirime güvenilmemelidir.' },
      { number: '04', title: 'Ürünün PTT ile gönderilmesi', copy: 'MERSTassel ürünü kendisinin alacağını teklif etmedikçe, cayma bildiriminizi gönderdikten sonra ürünü en geç 14 gün içinde PTT’ye teslim edin. İade talimatı e-postayla paylaşılır. İade adresi: MERSTassel, Yenibağlar Mahallesi, Beraberlik Sokak, Tepebaşı, Eskişehir, Türkiye. Bizimle görüşmeden karşı ödemeli gönderi yapmayın veya farklı taşıyıcı kullanmayın.' },
      { number: '05', title: 'İade kargo ücreti', copy: 'Belirlenen PTT iade yöntemi kullanıldığında kargo masrafını MERSTassel karşılar. Bildirilen taşıyıcının müşterinin bulunduğu yerde şubesi yoksa ürün ek bedel istenmeden müşteriden alınır. Ayıplı, yanlış, eksik veya taşımada hasar görmüş ürünlerin iade masrafı her durumda MERSTassel tarafından karşılanır.' },
      { number: '06', title: 'İade edilen ürünün durumu', copy: 'Mümkünse ürünü özgün ambalajı, aksesuarları, sertifikaları, talimatları, promosyon hediyeleri ve sipariş bilgileriyle gönderin. Ürünü niteliğini, özelliklerini ve işleyişini anlamak için makul ölçüde inceleyebilirsiniz. Sıradan ambalajın açılması, kanuni istisna yoksa cayma hakkını kendiliğinden kaldırmaz. Normal incelemeyi aşan kullanım nedeniyle oluşan değer kaybı emredici mevzuat uyarınca değerlendirilir.' },
      { number: '07', title: 'Kanuni istisnalar', copy: 'Taraflarca aksi kararlaştırılmadıkça; tüketicinin isteğine göre üretilen veya kişiselleştirilen ürünler, çabuk bozulabilen mallar, koruyucu ambalajı açıldıktan sonra sağlık veya hijyen nedeniyle iadesi uygun olmayan ürünler, hijyen mührü açılmış küpe ve benzeri vücutla temas eden ürünler, teslimden sonra ayrıştırılamayacak biçimde karışan mallar, anında sunulan dijital içerik veya çevrim içi hizmetler, tüketicinin önceden açık onayıyla cayma süresinde ifasına başlanan hizmetler ve mevzuattaki diğer sözleşmeler cayma hakkı dışında kalabilir. Fiyatı satıcının kontrolü dışındaki finansal piyasa dalgalanmalarına bağlı mücevherat da istisna olabilir. Uygulanacak istisna satın alma öncesinde açıkça belirtilir.' },
      { number: '08', title: 'Geri ödeme süresi ve yöntemi', copy: 'Teslim edilmiş ürün belirlenen taşıyıcıyla iade edildiğinde kanuni geri ödeme süresi ürünün taşıyıcıya teslimiyle; farklı taşıyıcı kullanılırsa ürünün MERSTassel’e ulaşmasıyla başlar. Uygun ürün bedeli ve geçerli standart ilk teslimat masrafı en geç 14 gün içinde, satın alırken kullanılan ödeme aracına uygun, tek seferde ve müşteriye masraf yüklemeden iade edilir. Banka veya ödeme kuruluşunun yansıtma süresi ayrıca değişebilir.' },
      { number: '09', title: 'Ayıplı veya yanlış ürün', copy: 'Hasarlı, kusurlu, eksik, yanlış gönderilmiş veya açıklamasına uygun olmayan ürün talepleri cayma hakkından ayrıdır. Kanuni şartlar oluştuğunda tüketici 6502 sayılı Kanun uyarınca ücretsiz onarım, ayıpsız misliyle değişim, bedel indirimi veya sözleşmeden dönerek bedel iadesi haklarından yararlanabilir. Bu iadelerin kargo masrafı müşteriden alınmaz.' },
      { number: '10', title: 'İptal ve uyuşmazlık', copy: 'Henüz kargoya verilmemiş sipariş için en kısa sürede merstassel@gmail.com adresine yazın. Üretimine başlanmış kişiselleştirilmiş ürünler ile açık onayla sunulan dijital içeriklerde kanuni istisnalar uygulanabilir. Çözülemeyen tüketici uyuşmazlıklarında güncel görev ve parasal sınırlara göre Tüketici Hakem Heyetine veya gerekli hâllerde dava şartı arabuluculuk sonrasında Tüketici Mahkemesine başvurulabilir.' },
    ],
    ctaTitle: 'İade başlatmak ister misiniz?', ctaCopy: 'Sipariş numaranızı ve iade etmek istediğiniz ürünü e-postayla gönderin; PTT talimatlarını paylaşalım.', ctaLabel: 'İade ekibine yazın', ctaHref: 'mailto:merstassel@gmail.com?subject=MERSTassel%20iade%20talebi',
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
