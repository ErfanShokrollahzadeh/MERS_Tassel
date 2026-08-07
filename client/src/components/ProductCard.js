'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * ProductCard - Displays a product with image, category, name, price, and hover effects.
 */
export default function ProductCard({ product }) {
  const { t } = useLanguage();
  const hasImage = product.image && !product.image.includes('undefined');
  const isOnSale = product.discount_price && product.discount_price < product.price;

  // Category emoji mapping for placeholder
  const categoryEmojis = {
    'Necklaces': '📿',
    'Pendants': '💎',
    'Bag Accessories': '👜',
    'Jasuichi': '✨',
    'Solid Azon': '💍',
    'Cute Accessories': '🎀',
  };

  const emoji = categoryEmojis[product.category_name] || '✨';

  return (
    <div className="product-card h-100">
      <div className="product-card-image">
        {isOnSale && (
          <span className="product-card-badge">{t('general.sale')}</span>
        )}
        {hasImage ? (
          <img 
            src={product.image} 
            alt={product.image_alt || product.name}
            loading="lazy"
          />
        ) : (
          <div className="product-placeholder">
            <span>{emoji}</span>
          </div>
        )}
      </div>
      <div className="product-card-body">
        <p className="product-card-category">{product.category_name}</p>
        <h4 className="product-card-title">{product.name}</h4>
        <div className="product-card-price">
          <span className="current">
            ${isOnSale ? product.discount_price : product.price}
          </span>
          {isOnSale && (
            <span className="original">${product.price}</span>
          )}
        </div>
      </div>
    </div>
  );
}
