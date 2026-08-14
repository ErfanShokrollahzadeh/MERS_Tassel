import Link from 'next/link';
import { ArrowRight, Gem, HandHeart, Leaf } from 'lucide-react';
import { products } from '@/data/store';
import { MediaImage } from '@/components/MediaImage';

export const metadata = { title: 'Our atelier', description: 'Meet the hands and ideas behind MERS Tassel in Istanbul.' };
const values = [
  { icon: HandHeart, title: 'Hands before machines', copy: 'Human rhythm gives each piece its subtle, singular character.' },
  { icon: Gem, title: 'Materials with memory', copy: 'We choose materials that age beautifully and invite repair.' },
  { icon: Leaf, title: 'Less, but better', copy: 'Small editions, considered packaging and no trend-chasing.' },
];

export default function AboutPage() {
  return <div className="story-page">
    <section className="story-hero"><div className="container-narrow"><span className="eyebrow">Istanbul · Since 2018</span><h1>Made slowly.<br /><em>Kept for years.</em></h1><p>MERS began with a silk tassel, a shared workbench and a belief that everyday objects can carry uncommon feeling.</p></div></section>
    <section className="story-split"><div><MediaImage src={products[7].image} alt="Inside the MERS Tassel atelier" sizes="(max-width: 800px) 100vw, 52vw" /></div><article><span className="eyebrow">Our beginning</span><h2>A small idea, tied by hand.</h2><p>Founder Meral grew up among fabric merchants, metalsmiths and the crowded color of Istanbul. After years in fashion, she returned to the gestures she remembered most: knotting silk, polishing metal and choosing each stone by eye.</p><p>What began at a kitchen table is now a close-knit atelier. We still work in small editions, still know who touched every piece, and still wrap each order as though it were a gift between friends.</p><blockquote>Beauty feels different when you can sense the person who made it.</blockquote></article></section>
    <section className="section story-values"><div className="container-wide"><div className="center-heading"><span className="eyebrow">What guides us</span><h2>Care, in every layer.</h2></div><div>{values.map((value) => <article key={value.title}><value.icon /><h3>{value.title}</h3><p>{value.copy}</p></article>)}</div></div></section>
    <section className="story-cta"><span className="eyebrow">Your next keepsake</span><h2>Find the one that feels like you.</h2><Link href="/products" className="button button--light">Explore the collection <ArrowRight /></Link></section>
  </div>;
}
