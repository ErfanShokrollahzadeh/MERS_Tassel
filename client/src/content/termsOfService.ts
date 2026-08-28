import type { Locale } from '@/i18n/I18nProvider';

export type TermsSection = { number: string; title: string; paragraphs: string[] };

export type TermsOfServiceContent = {
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  summaryTitle: string;
  summary: string[];
  sections: TermsSection[];
  contactTitle: string;
  contactCopy: string;
  back: string;
  close: string;
  accept: string;
};

const content: Record<Locale, TermsOfServiceContent> = {
  en: {
    eyebrow: 'ACCOUNT · SHOPPING · TRUST',
    title: 'Terms of Service',
    intro: 'These Terms govern your MERSTassel account and your use of our online store. Please read them before creating an account or placing an order.',
    updated: 'Last updated: 28 August 2026',
    summaryTitle: 'In a few words',
    summary: [
      'Use accurate account details and keep your password private.',
      'Contact us on WhatsApp within 3 business days for a voluntary exchange request.',
      'Eligible distance-sale purchases have a 14-day statutory withdrawal period.',
      'Eligible exchange differences may be saved securely in your Store Wallet.',
    ],
    sections: [
      { number: '01', title: 'Acceptance and seller information', paragraphs: [
        'By creating an account, using authenticated areas, or placing an order, you agree to these Terms together with the policies linked from the store. If you do not agree, do not create an account or submit an order.',
        'The store is operated under the trade name MERSTassel as an individual / sole-proprietor seller in Tepebaşı, Eskişehir, Türkiye. Contact us at merstassel@gmail.com or by telephone and WhatsApp at +90 552 848 2640.',
      ] },
      { number: '02', title: 'Account creation and eligibility', paragraphs: [
        'You must have legal capacity to enter into a purchase contract, or use the store with the authorization and supervision required by applicable law. Accounts are intended for genuine customers and may not be created using another person’s identity.',
        'You are responsible for providing a current, accurate email address and truthful details, keeping your password confidential, and notifying us promptly if you believe your account has been accessed without permission. Accounts may not be used for fraud, abuse, or promotion misuse.',
      ] },
      { number: '03', title: 'Products, prices and orders', paragraphs: [
        'Descriptions, availability, prices in Turkish lira, delivery charges, and promotions are displayed before checkout. Handmade products may have small variations that form part of their character and do not affect mandatory rights concerning defective or non-conforming goods.',
        'Orders remain subject to server-side price, stock, address, and payment verification. We may reject or cancel an order where payment is not authorized, stock is unavailable, information is materially incorrect, or fraud or unlawful use is reasonably suspected. Collected amounts are returned under applicable payment and consumer rules.',
      ] },
      { number: '04', title: 'Product exchanges and returns', paragraphs: [
        'For a voluntary size, colour, or product exchange, send a request through WhatsApp within 3 business days after delivery. The original tax invoice or sales document and the product box and packaging must be kept complete, intact, and undamaged for this voluntary exchange service.',
        'For eligible distance sales, consumers have a 14-calendar-day statutory right of withdrawal, subject to lawful exceptions. Send a clear notice to merstassel@gmail.com before the period ends. Packaging and invoice integrity are inspected, while mandatory consumer rights and lawful product-inspection rights remain unaffected.',
        'Personalised goods and certain sealed hygiene-sensitive products may be excluded where the law permits. Return steps, PTT instructions, refund timing, and exceptions are stated in our Return and Right of Withdrawal Policy.',
      ] },
      { number: '05', title: 'Store Credit and Wallet policy', paragraphs: [
        'When an approved exchange replaces a previously purchased item with a lower-priced item, the verified positive difference may be credited automatically to the customer’s Store Wallet. For example, a 50 TL approved exchange value applied to a 30 TL replacement creates a 20 TL wallet credit. If the replacement costs more, the remaining amount is payable before dispatch.',
        'Wallet credit is linked to the customer account, appears in the profile and checkout where available, and may be used for eligible future purchases. It is not cash, does not earn interest, cannot be transferred, and is not refundable as money unless mandatory law or the original transaction requires otherwise. Trade-in and exchange credits may remain pending until physical verification.',
      ] },
      { number: '06', title: 'User privacy and security', paragraphs: [
        'We process account, order, support, and essential technical information to provide the store, protect accounts, fulfil orders, and meet legal obligations. We do not sell customer profiles. Purposes, retention, rights, cookies, and service providers are described in our Privacy and Cookie Policies.',
        'Payments use the configured provider’s protected environment; MERSTassel does not store full card numbers. No service can promise absolute security, but we use proportionate safeguards and ask customers to use a unique password and trusted device.',
      ] },
      { number: '07', title: 'Acceptable use and account action', paragraphs: [
        'You may not interfere with the store, attempt unauthorized access, upload malicious material, scrape protected content at scale, impersonate another person, misuse discounts or wallet credits, or use an account unlawfully. We may restrict access when reasonably necessary for customer protection, abuse investigation, legal compliance, or service security.',
        'Where appropriate, we will explain the action and provide a way to contact us. Suspension does not remove obligations attached to completed orders or mandatory customer rights.',
      ] },
      { number: '08', title: 'Changes, governing rules and contact', paragraphs: [
        'We may update these Terms when the store, features, contact details, or legal requirements change. The current version and date appear here. Material changes do not remove rights already acquired under a confirmed order.',
        'Mandatory Turkish consumer-protection rules apply where relevant. Consumers retain access to the competent Consumer Arbitration Committee, mandatory mediation where applicable, and Consumer Courts under current rules.',
      ] },
    ],
    contactTitle: 'Questions before you register?',
    contactCopy: 'Write to merstassel@gmail.com or message +90 552 848 2640 on WhatsApp. We are available 7 days a week.',
    back: 'Return to registration', close: 'Close terms', accept: 'Close & accept',
  },
  tr: {
    eyebrow: 'HESAP · ALIŞVERİŞ · GÜVEN',
    title: 'Kullanım Koşulları',
    intro: 'Bu Koşullar, MERSTassel hesabınızı ve çevrim içi mağazamızı kullanımınızı düzenler. Hesap oluşturmadan veya sipariş vermeden önce lütfen okuyun.',
    updated: 'Son güncelleme: 28 Ağustos 2026',
    summaryTitle: 'Kısaca',
    summary: [
      'Doğru hesap bilgileri kullanın ve şifrenizi gizli tutun.',
      'Gönüllü değişim talebi için 3 iş günü içinde WhatsApp’tan bize ulaşın.',
      'Uygun mesafeli satışlarda 14 günlük kanuni cayma süresi bulunur.',
      'Uygun değişim farkları güvenli biçimde Mağaza Cüzdanınıza aktarılabilir.',
    ],
    sections: [
      { number: '01', title: 'Kabul ve satıcı bilgileri', paragraphs: [
        'Hesap oluşturarak, üyelik gerektiren alanları kullanarak veya sipariş vererek bu Koşulları ve mağazada bağlantısı verilen politikaları kabul etmiş olursunuz. Kabul etmiyorsanız hesap oluşturmayın veya sipariş göndermeyin.',
        'Mağaza, Tepebaşı, Eskişehir, Türkiye’de bireysel / şahıs satıcı olarak MERSTassel ticari adıyla işletilmektedir. Bize merstassel@gmail.com adresinden veya +90 552 848 2640 telefon ve WhatsApp hattından ulaşabilirsiniz.',
      ] },
      { number: '02', title: 'Hesap oluşturma ve uygunluk', paragraphs: [
        'Satın alma sözleşmesi kurmak için hukuki işlem ehliyetine sahip olmalı veya mağazayı yürürlükteki hukukun gerektirdiği izin ve gözetimle kullanmalısınız. Hesaplar gerçek müşteriler içindir; başka bir kişinin kimliğiyle hesap oluşturulamaz.',
        'Güncel ve doğru e-posta ile gerçeğe uygun kayıt bilgileri vermek, şifrenizi gizli tutmak ve izinsiz erişim şüphesini gecikmeden bildirmek sizin sorumluluğunuzdadır. Hesaplar dolandırıcılık, kötüye kullanım veya promosyon suistimali için kullanılamaz.',
      ] },
      { number: '03', title: 'Ürünler, fiyatlar ve siparişler', paragraphs: [
        'Ürün açıklamaları, stok durumu, Türk lirası cinsinden fiyatlar, teslimat ücretleri ve kampanyalar ödeme öncesinde gösterilir. El yapımı ürünlerde küçük farklılıklar bulunabilir; bu durum ayıplı veya sözleşmeye aykırı mallara ilişkin emredici hakları etkilemez.',
        'Siparişler fiyat, stok, adres ve ödemenin sunucu tarafında doğrulanmasına tabidir. Ödemenin onaylanmaması, stok bulunmaması, önemli ölçüde yanlış bilgi veya makul dolandırıcılık şüphesinde sipariş reddedilebilir ya da iptal edilebilir. Tahsil edilen tutarlar yürürlükteki ödeme ve tüketici kurallarına göre iade edilir.',
      ] },
      { number: '04', title: 'Ürün değişimi ve iadeler', paragraphs: [
        'Gönüllü beden, renk veya ürün değişimi için teslimattan sonraki 3 iş günü içinde WhatsApp üzerinden talep gönderin. Bu hizmette orijinal vergi faturası veya satış belgesi ile ürün kutusu ve ambalajı eksiksiz, bozulmamış ve tamamen hasarsız saklanmalıdır.',
        'Uygun mesafeli satışlarda tüketiciler, kanuni istisnalar saklı kalmak üzere 14 takvim günlük cayma hakkına sahiptir. Süre dolmadan merstassel@gmail.com adresine açık bildirim gönderin. Ambalaj ve belge bütünlüğü incelenir; emredici tüketici hakları ile ürünü hukuka uygun inceleme hakkı etkilenmez.',
        'Kişiye özel ürünler ve kanunun izin verdiği bazı mühürlü hijyen ürünleri istisna kapsamında olabilir. Süreç, PTT talimatları, geri ödeme süresi ve istisnalar İade ve Cayma Hakkı Politikamızda yer alır.',
      ] },
      { number: '05', title: 'Mağaza Kredisi ve Cüzdan politikası', paragraphs: [
        'Onaylanan değişimde önceki ürün daha düşük fiyatlı bir ürünle değiştirilirse, doğrulanan pozitif fark Mağaza Cüzdanına otomatik aktarılabilir. Örneğin 50 TL onaylı değişim değeri 30 TL değerindeki yeni ürüne uygulandığında 20 TL kredi oluşur. Yeni ürün daha pahalıysa kalan tutar gönderimden önce ödenir.',
        'Cüzdan kredisi müşteri hesabına bağlıdır; uygun olduğunda profil ve ödeme sayfasında görünür ve sonraki uygun alışverişlerde kullanılabilir. Nakit değildir, faiz kazandırmaz, devredilemez ve emredici hukuk veya ilk işlem aksini gerektirmedikçe para olarak iade edilmez. Takas veya değişim kredisi fiziksel doğrulamaya kadar beklemede kalabilir.',
      ] },
      { number: '06', title: 'Kullanıcı gizliliği ve güvenliği', paragraphs: [
        'Hesap, sipariş, destek ve gerekli teknik bilgileri mağazayı sunmak, hesapları korumak, siparişleri yerine getirmek ve yasal yükümlülükleri karşılamak için işleriz. Müşteri profillerini satmayız. Amaçlar, saklama, haklar, çerezler ve hizmet sağlayıcılar Gizlilik ve Çerez Politikalarında açıklanır.',
        'Ödemeler yapılandırılan sağlayıcının korumalı ortamında tamamlanır; MERSTassel kart numaranızın tamamını saklamaz. Hiçbir hizmet mutlak güvenlik sözü veremez; ölçülü önlemler uygular, benzersiz şifre ve güvenilir cihaz kullanmanızı isteriz.',
      ] },
      { number: '07', title: 'Kabul edilebilir kullanım ve hesap işlemleri', paragraphs: [
        'Mağazaya müdahale edemez, yetkisiz erişim deneyemez, zararlı içerik yükleyemez, korunan içeriği toplu kopyalayamaz, başka kişiyi taklit edemez, indirim veya cüzdan kredisini kötüye kullanamaz ve hesabı hukuka aykırı kullanamazsınız. Müşterileri korumak, kötüye kullanımı incelemek, hukuka uymak veya güvenliği sürdürmek için erişim kısıtlanabilir.',
        'Uygun olduğunda işlemin nedeni açıklanır ve iletişim yolu sunulur. Askıya alma, tamamlanmış sipariş yükümlülüklerini veya emredici müşteri haklarını kaldırmaz.',
      ] },
      { number: '08', title: 'Değişiklikler, uygulanacak kurallar ve iletişim', paragraphs: [
        'Mağaza, özellikler, iletişim bilgileri veya yasal gereklilikler değiştiğinde Koşullar güncellenebilir. Güncel sürüm ve tarih burada yayınlanır. Önemli değişiklikler onaylanmış sipariş kapsamında kazanılan hakları kaldırmaz.',
        'İlgili olduğu ölçüde emredici Türk tüketici koruma kuralları uygulanır. Tüketicilerin yetkili Tüketici Hakem Heyetine, uygun olduğunda zorunlu arabuluculuğa ve Tüketici Mahkemelerine başvuru hakları saklıdır.',
      ] },
    ],
    contactTitle: 'Kayıt olmadan önce sorunuz mu var?',
    contactCopy: 'merstassel@gmail.com adresine yazın veya +90 552 848 2640 numarasından WhatsApp mesajı gönderin. Haftanın 7 günü ulaşabilirsiniz.',
    back: 'Kayıt sayfasına dön', close: 'Koşulları kapat', accept: 'Kapat ve kabul et',
  },
};

export function termsOfService(locale: Locale) { return content[locale]; }
