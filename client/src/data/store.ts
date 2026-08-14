import { Order, Product, Ticket } from '@/types/commerce';

const photos = {
  pearl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=88',
  gold: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1200&q=88',
  ring: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=88',
  earrings: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=88',
  bracelet: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1200&q=88',
  pendant: 'https://images.unsplash.com/photo-1599459183200-59c7687a0275?auto=format&fit=crop&w=1200&q=88',
  silver: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=88',
  studio: 'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?auto=format&fit=crop&w=1200&q=88',
};

export const products: Product[] = [
  {
    id: 1, name: 'Lâle Pearl Tassel', slug: 'lale-pearl-tassel', category: 'Necklaces', categorySlug: 'necklaces',
    description: 'Freshwater pearls, hand-knotted silk and a warm vermeil finish.',
    story: 'Named for Istanbul’s tulip gardens, Lâle is assembled bead by bead in our atelier. The silk tassel is combed by hand for a fluid, weightless finish.',
    price: { amount: 149, currency: 'USD' }, compareAt: { amount: 189, currency: 'USD' }, image: photos.pearl,
    images: [photos.pearl, photos.gold, photos.studio], colors: ['Rose', 'Ivory', 'Midnight'], material: 'Freshwater pearl · 18k vermeil · silk', dimensions: '76 cm chain · 9 cm tassel', rating: 4.9, reviews: 128, stock: 12, isFeatured: true,
  },
  {
    id: 2, name: 'Sedef Moon Pendant', slug: 'sedef-moon-pendant', category: 'Pendants', categorySlug: 'pendants',
    description: 'Mother-of-pearl catches the light in a sculptural crescent setting.', story: 'Sedef pairs nacre selected for its natural glow with a compact form inspired by moonlight on the Bosphorus.',
    price: { amount: 92, currency: 'USD' }, image: photos.gold, images: [photos.gold, photos.pearl], colors: ['Gold', 'Silver'], material: 'Mother-of-pearl · recycled brass', dimensions: '45 cm chain · 24 mm pendant', rating: 4.8, reviews: 84, stock: 7, isNew: true, isFeatured: true,
  },
  {
    id: 3, name: 'Bosphorus Signet', slug: 'bosphorus-signet', category: 'Rings', categorySlug: 'rings', description: 'A softly sculpted signet with an ocean-blue enamel center.', story: 'Each enamel center is poured and polished by hand, so every surface carries tiny variations of its maker.',
    price: { amount: 118, currency: 'USD' }, image: photos.ring, images: [photos.ring, photos.silver], colors: ['Bosphorus blue', 'Garnet'], material: '18k gold-plated silver · enamel', dimensions: 'Sizes 5–10', rating: 4.7, reviews: 63, stock: 19, isFeatured: true,
  },
  {
    id: 4, name: 'Mira Drop Earrings', slug: 'mira-drop-earrings', category: 'Earrings', categorySlug: 'earrings', description: 'Light-catching drops balanced for all-evening comfort.', story: 'Mira translates traditional filigree into a clean, modern silhouette with movement from every angle.',
    price: { amount: 78, currency: 'USD' }, compareAt: { amount: 98, currency: 'USD' }, image: photos.earrings, images: [photos.earrings, photos.gold], colors: ['Gold', 'Silver'], material: 'Gold vermeil · crystal quartz', dimensions: '48 mm drop', rating: 4.9, reviews: 96, stock: 4, isFeatured: true,
  },
  {
    id: 5, name: 'Nazar Chain Bracelet', slug: 'nazar-chain-bracelet', category: 'Bracelets', categorySlug: 'bracelets', description: 'A refined protective eye motif on a fluid paperclip chain.', story: 'Our minimal interpretation of the familiar Nazar is designed as an everyday talisman and thoughtful gift.',
    price: { amount: 64, currency: 'USD' }, image: photos.bracelet, images: [photos.bracelet, photos.silver], colors: ['Lapis', 'Pearl'], material: 'Recycled silver · hand-set enamel', dimensions: '16–20 cm adjustable', rating: 4.8, reviews: 211, stock: 26, isNew: true,
  },
  {
    id: 6, name: 'Haliç Crystal Pendant', slug: 'halic-crystal-pendant', category: 'Pendants', categorySlug: 'pendants', description: 'A faceted smoky crystal suspended from a whisper-fine chain.', story: 'Cut to gather low evening light, Haliç is an understated centerpiece inspired by the Golden Horn at dusk.',
    price: { amount: 106, currency: 'USD' }, image: photos.pendant, images: [photos.pendant, photos.studio], colors: ['Smoky quartz', 'Clear quartz'], material: 'Natural quartz · gold vermeil', dimensions: '50 cm chain · 18 mm stone', rating: 4.6, reviews: 47, stock: 0,
  },
  {
    id: 7, name: 'Ada Layered Chain', slug: 'ada-layered-chain', category: 'Necklaces', categorySlug: 'necklaces', description: 'Two delicate textures meet in an effortless, pre-layered necklace.', story: 'Ada is named for the Princes’ Islands and made for slow summer days, with a clasp that keeps both layers aligned.',
    price: { amount: 134, currency: 'USD' }, image: photos.silver, images: [photos.silver, photos.pearl], colors: ['Silver', 'Gold'], material: 'Recycled sterling silver', dimensions: '42 cm and 48 cm layers', rating: 4.8, reviews: 71, stock: 15,
  },
  {
    id: 8, name: 'Atelier Charm No. 7', slug: 'atelier-charm-no-7', category: 'Bag charms', categorySlug: 'bag-charms', description: 'Knotted silk, polished stone and a clip made for daily ritual.', story: 'A playful assemblage of atelier remnants turns precious materials into a small object of joy.',
    price: { amount: 46, currency: 'USD' }, image: photos.studio, images: [photos.studio, photos.earrings], colors: ['Mulberry', 'Sage', 'Saffron'], material: 'Silk · agate · brass', dimensions: '14 cm drop', rating: 4.7, reviews: 38, stock: 31, isNew: true,
  },
];

export const categories = [
  { name: 'Necklaces', slug: 'necklaces', count: 24, image: photos.pearl },
  { name: 'Pendants', slug: 'pendants', count: 18, image: photos.gold },
  { name: 'Earrings', slug: 'earrings', count: 31, image: photos.earrings },
  { name: 'Rings', slug: 'rings', count: 16, image: photos.ring },
];

export const orders: Order[] = [
  { id: '#MT-1048', customer: 'Sofia Martin', email: 'sofia@example.com', total: 241, items: 2, status: 'Processing', date: '14 Aug, 10:42', channel: 'Storefront' },
  { id: '#MT-1047', customer: 'Elif Demir', email: 'elif@example.com', total: 149, items: 1, status: 'Shipped', date: '14 Aug, 09:18', channel: 'Instagram' },
  { id: '#MT-1046', customer: 'Maya Chen', email: 'maya@example.com', total: 318, items: 3, status: 'Delivered', date: '13 Aug, 18:05', channel: 'Storefront' },
  { id: '#MT-1045', customer: 'Lina Haddad', email: 'lina@example.com', total: 92, items: 1, status: 'Processing', date: '13 Aug, 14:22', channel: 'Storefront' },
  { id: '#MT-1044', customer: 'Amelia Jones', email: 'amelia@example.com', total: 184, items: 2, status: 'Cancelled', date: '13 Aug, 11:06', channel: 'Pinterest' },
  { id: '#MT-1043', customer: 'Zeynep Kaya', email: 'zeynep@example.com', total: 267, items: 3, status: 'Delivered', date: '12 Aug, 16:51', channel: 'Storefront' },
];

export const tickets: Ticket[] = [
  { id: 'TK-284', subject: 'Can I change my delivery address?', customer: 'Sofia Martin', email: 'sofia@example.com', status: 'Open', priority: 'Urgent', updated: '2 min ago', sla: '00:42', orderId: '#MT-1048', spend: 683, messages: [{ id: 1, from: 'customer', body: 'Hi! I just placed my order but noticed the apartment number is missing. Can you update it before dispatch?', time: '10:46' }] },
  { id: 'TK-283', subject: 'Pendant care instructions', customer: 'Maya Chen', email: 'maya@example.com', status: 'In progress', priority: 'Normal', updated: '18 min ago', sla: '03:18', orderId: '#MT-1046', spend: 924, messages: [{ id: 1, from: 'customer', body: 'What is the best way to keep the vermeil finish bright?', time: '10:21' }, { id: 2, from: 'staff', body: 'Use the included soft cloth and store it dry, away from fragrance.', time: '10:29' }] },
  { id: 'TK-282', subject: 'Gift wrap message', customer: 'Lina Haddad', email: 'lina@example.com', status: 'Open', priority: 'High', updated: '44 min ago', sla: '01:56', orderId: '#MT-1045', spend: 236, messages: [{ id: 1, from: 'customer', body: 'Could you add “Happy birthday, Noor” to the gift note?', time: '09:58' }] },
  { id: 'TK-281', subject: 'Sizing help for signet ring', customer: 'Amelia Jones', email: 'amelia@example.com', status: 'Resolved', priority: 'Low', updated: 'Yesterday', sla: 'Met', spend: 184, messages: [{ id: 1, from: 'customer', body: 'I am between sizes 7 and 8. Which do you recommend?', time: 'Yesterday' }, { id: 2, from: 'staff', body: 'For the wider signet band, we recommend sizing up to 8.', time: 'Yesterday' }] },
];

export const revenueSeries = [
  { name: 'Mon', revenue: 4200, orders: 31 }, { name: 'Tue', revenue: 5100, orders: 38 },
  { name: 'Wed', revenue: 4700, orders: 34 }, { name: 'Thu', revenue: 6400, orders: 46 },
  { name: 'Fri', revenue: 7200, orders: 51 }, { name: 'Sat', revenue: 6800, orders: 48 },
  { name: 'Sun', revenue: 8100, orders: 57 },
];

export const trafficSeries = [
  { name: 'Organic', value: 42 }, { name: 'Instagram', value: 28 }, { name: 'Direct', value: 17 }, { name: 'Pinterest', value: 13 },
];

export function findProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}
