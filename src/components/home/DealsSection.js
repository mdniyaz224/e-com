'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice, formatNumber } from '@/utils/formatPrice';
import styles from './DealsSection.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function DealsSection({ filterCategory, searchQuery }) {
  const [deals, setDeals] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/products/deals`)
      .then(res => res.json())
      .then(setDeals)
      .catch(console.error);
  }, []);

  const displayedDeals = deals.filter(p => {
    let matchesCategory = true;
    if (filterCategory && filterCategory !== 'Top Offers') {
      matchesCategory =
        p.category?.toLowerCase().includes(filterCategory.toLowerCase()) ||
        p.categoryTag?.toLowerCase().includes(filterCategory.toLowerCase());
    }

    let matchesSearch = true;
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      matchesSearch =
        p.name?.toLowerCase().includes(q) ||
        p.shortName?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.categoryTag?.toLowerCase().includes(q);
    }

    return matchesCategory && matchesSearch;
  });

  if (displayedDeals.length === 0) return null;

  const showGrid = isExpanded || Boolean(searchQuery);

  return (
    <div className={styles.section} id="deals-section">
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>
            {searchQuery
              ? `Results for "${searchQuery}" in Deals`
              : filterCategory && filterCategory !== 'Top Offers'
              ? `${filterCategory} Deals`
              : 'Deals of the Day'}
          </h2>
          <p className={styles.subtitle}>
            {searchQuery ? `${displayedDeals.length} items found` : 'Fresh discounts every 24 hours'}
          </p>
        </div>
        {!searchQuery && (
          <button
            className={styles.viewAll}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse ▴' : 'View All ▾'}
          </button>
        )}
      </div>

      <div className={`${styles.carousel} ${showGrid ? styles.gridExpanded : ''} hide-scrollbar`}>
        {displayedDeals.map((product, i) => (
          <Link
            href={`/product/${product.id}`}
            key={product.id}
            className={styles.card}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={styles.imageWrap}>
              <div className={styles.discountBadge}>{product.discount}% off</div>
              {product.images && product.images[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className={styles.productImg}
                />
              ) : (
                <div className={styles.imagePlaceholder}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
              )}
            </div>
            <div className={styles.info}>
              <p className={styles.productName}>{product.shortName}</p>
              <div className={styles.ratingRow}>
                <span className="rating">
                  {product.rating}
                  <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                </span>
                <span className={styles.ratingCount}>({formatNumber(product.ratingCount)})</span>
              </div>
              <div className="price">
                <span className="price-current">{formatPrice(product.price)}</span>
                <span className="price-original">{formatPrice(product.originalPrice)}</span>
              </div>
              {product.freeDelivery && (
                <span className={styles.freeDelivery}>Free delivery</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
