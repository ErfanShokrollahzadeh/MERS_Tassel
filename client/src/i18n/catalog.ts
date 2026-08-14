import type { Locale } from '@/i18n/I18nProvider';
import type { Product } from '@/types/commerce';

const categories: Record<string, string> = { Necklaces: 'Kolyeler', Pendants: 'Kolye uçları', Rings: 'Yüzükler', Earrings: 'Küpeler', Bracelets: 'Bileklikler', 'Bag charms': 'Çanta aksesuarları' };
const colors: Record<string, string> = { Rose: 'Gül', Ivory: 'Fildişi', Midnight: 'Gece mavisi', Gold: 'Altın', Silver: 'Gümüş', 'Bosphorus blue': 'Boğaz mavisi', Garnet: 'Lal', Lapis: 'Lapis', Pearl: 'İnci', 'Smoky quartz': 'Dumanlı kuvars', 'Clear quartz': 'Berrak kuvars', Mulberry: 'Dut', Sage: 'Adaçayı', Saffron: 'Safran' };
const copy: Record<string, Pick<Product, 'description' | 'story' | 'material' | 'dimensions'>> = {
  'lale-pearl-tassel': { description: 'Tatlı su incileri, elde düğümlenmiş ipek ve sıcak vermeil dokunuş.', story: 'Adını İstanbul’un lale bahçelerinden alan Lâle, atölyemizde boncuk boncuk birleştirilir. İpek püskül, akışkan ve hafif bir bitiş için elde taranır.', material: 'Tatlı su incisi · 18 ayar vermeil · ipek', dimensions: '76 cm zincir · 9 cm püskül' },
  'sedef-moon-pendant': { description: 'Sedef, heykelsi hilal yuvasında ışığı yakalar.', story: 'Sedef; doğal ışıltısı için seçilen sedefi, Boğaz üzerindeki ay ışığından ilham alan kompakt bir formla buluşturur.', material: 'Sedef · geri dönüştürülmüş pirinç', dimensions: '45 cm zincir · 24 mm uç' },
  'bosphorus-signet': { description: 'Okyanus mavisi mine merkezli, yumuşak hatlı mühür yüzük.', story: 'Her mine merkezi elde dökülüp cilalandığı için yüzeyinde ustasının küçük izlerini taşır.', material: '18 ayar altın kaplama gümüş · mine', dimensions: '5–10 numara' },
  'mira-drop-earrings': { description: 'Tüm gece rahatlık için dengelenmiş, ışığı yakalayan sallantılar.', story: 'Mira, geleneksel telkâriyi her açıdan hareket taşıyan temiz ve modern bir siluete dönüştürür.', material: 'Altın vermeil · kristal kuvars', dimensions: '48 mm uzunluk' },
  'nazar-chain-bracelet': { description: 'Akışkan ataç zincir üzerinde yalın bir nazar motifi.', story: 'Tanıdık nazarın minimal yorumunu, her gün taşınan bir tılsım ve anlamlı bir hediye olarak tasarladık.', material: 'Geri dönüştürülmüş gümüş · elde yerleştirilmiş mine', dimensions: '16–20 cm ayarlanabilir' },
  'halic-crystal-pendant': { description: 'İncecik zincirde asılı, fasetli dumanlı kristal.', story: 'Akşamın loş ışığını toplamak için kesilen Haliç, gün batımındaki Altın Boynuz’dan esinlenen sakin bir odak noktasıdır.', material: 'Doğal kuvars · altın vermeil', dimensions: '50 cm zincir · 18 mm taş' },
  'ada-layered-chain': { description: 'İki narin doku, zahmetsiz ve hazır katmanlı bir kolyede buluşur.', story: 'Adını Prens Adaları’ndan alan Ada, iki katmanı hizalı tutan tokasıyla yavaş yaz günleri için üretildi.', material: 'Geri dönüştürülmüş 925 ayar gümüş', dimensions: '42 cm ve 48 cm katmanlar' },
  'atelier-charm-no-7': { description: 'Düğümlü ipek, cilalı taş ve günlük ritüeller için bir klips.', story: 'Atölyeden kalan malzemelerin neşeli birleşimi, değerli parçaları küçük bir mutluluk nesnesine dönüştürür.', material: 'İpek · akik · pirinç', dimensions: '14 cm uzunluk' },
};

export const categoryName = (name: string, locale: Locale) => locale === 'tr' ? categories[name] || name : name;
export const colorName = (name: string, locale: Locale) => locale === 'tr' ? colors[name] || name : name;
export const productCopy = (product: Product, locale: Locale) => locale === 'tr' && copy[product.slug] ? { ...product, ...copy[product.slug], category: categoryName(product.category, locale) } : product;
