import Link from 'next/link';
import { ArrowUpRight, Camera } from 'lucide-react';

export function StoreFooter() {
  return (
    <footer className="store-footer">
      <div className="container-wide footer-grid">
        <div className="footer-brand">
          <Link href="/" className="wordmark wordmark--footer"><span className="wordmark__seal">M</span><span>MERS <i>Tassel</i></span></Link>
          <p>Small objects of beauty, shaped by hand in Istanbul and designed to stay with you.</p>
        </div>
        <div><span className="footer-label">Explore</span><Link href="/products">Shop all</Link><Link href="/products?sort=new">New arrivals</Link><Link href="/about">Our atelier</Link></div>
        <div><span className="footer-label">Care</span><Link href="/contact">Contact</Link><Link href="/contact">Shipping & returns</Link><Link href="/contact">Jewelry care</Link></div>
        <div className="footer-newsletter"><span className="footer-label">Atelier notes</span><p>New pieces, quiet stories, once or twice a month.</p><form onSubmit={(event) => event.preventDefault()}><label className="sr-only" htmlFor="footer-email">Email address</label><input id="footer-email" type="email" placeholder="Email address" required /><button aria-label="Subscribe"><ArrowUpRight size={18} /></button></form></div>
      </div>
      <div className="container-wide footer-bottom"><span>© 2026 MERS Tassel · Istanbul</span><span>EN / TR</span><a href="https://instagram.com" aria-label="Instagram"><Camera size={17} /></a></div>
    </footer>
  );
}
