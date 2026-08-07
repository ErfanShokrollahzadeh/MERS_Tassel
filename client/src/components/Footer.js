import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-mers">
      <div className="container">
        <div className="row g-4">
          {/* Brand Column */}
          <div className="col-lg-4 col-md-6">
            <span className="footer-brand">
              MERS <span>Tassel</span>
            </span>
            <p className="footer-description">
              Handcrafted accessories from Turkey, designed to add elegance and charm
              to your everyday style. Each piece tells a story of artistry and passion.
            </p>
            <div className="footer-social">
              <a href="#" aria-label="Instagram">📷</a>
              <a href="#" aria-label="Facebook">📘</a>
              <a href="#" aria-label="Twitter">🐦</a>
              <a href="#" aria-label="Pinterest">📌</a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-2 col-md-6">
            <h5 className="footer-title">Quick Links</h5>
            <ul className="footer-links">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/products">Products</Link></li>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="col-lg-3 col-md-6">
            <h5 className="footer-title">Categories</h5>
            <ul className="footer-links">
              <li><Link href="/products?category=necklaces">Necklaces</Link></li>
              <li><Link href="/products?category=pendants">Pendants</Link></li>
              <li><Link href="/products?category=bag-accessories">Bag Accessories</Link></li>
              <li><Link href="/products?category=jasuichi">Jasuichi</Link></li>
              <li><Link href="/products?category=cute-accessories">Cute Accessories</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-lg-3 col-md-6">
            <h5 className="footer-title">Contact Us</h5>
            <ul className="footer-links">
              <li>📍 Istanbul, Turkey</li>
              <li>📧 hello@merstassel.com</li>
              <li>📱 +90 555 123 4567</li>
              <li>🕐 : 24/7 Support</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p>
            © {currentYear} MERS Tassel. All rights reserved. Crafted with 💖 in Turkey.
          </p>
        </div>
      </div>
    </footer>
  );
}
