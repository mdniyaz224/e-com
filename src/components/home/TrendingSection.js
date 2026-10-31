'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/utils/formatPrice';
import styles from './TrendingSection.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function TrendingSection({ filterCategory, searchQuery }) {
  const [products, setProducts] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/products/trending`)
      .then(res => res.json())
      .then(setProducts)
      .catch(console.error);
  }, []);

  const displayedProducts = products.filter(p => {
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

  if (displayedProducts.length === 0) return null;

  const visibleProducts = isExpanded || searchQuery ? displayedProducts : displayedProducts.slice(0, 4);

  return (
    <div className={styles.section} id="trending-section">
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.fire}>🔥</span>
          <h2 className={styles.title}>
            {searchQuery
              ? `Results for "${searchQuery}" in Trending`
              : filterCategory && filterCategory !== 'Top Offers'
              ? `Trending in ${filterCategory}`
              : 'Trending in Electronics'}
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={styles.bestValue}>Best Value</span>
          {displayedProducts.length > 4 && !searchQuery && (
            <button
              className={styles.viewAllBtn}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse ▴' : 'View All ▾'}
            </button>
          )}
        </div>
      </div>

      <div className={styles.grid}>
        {visibleProducts.map((product, i) => (
          <Link
            href={`/product/${product.id}`}
            key={product.id}
            className={styles.card}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className={styles.imageWrap}>
              {product.trendingTag && (
                <span className={styles.tag}>{product.trendingTag}</span>
              )}
              {product.images && product.images[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className={styles.productImg}
                />
              ) : (
                <div className={styles.imagePlaceholder}>
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
              )}
            </div>
            <div className={styles.info}>
              <p className={styles.name}>{product.shortName}</p>
              <p className={styles.subtitle}>{product.trendingSubtitle || `From ${formatPrice(product.price)}`}</p>
              {product.freeDelivery && (
                <div className={styles.deliveryBadge}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                  Free by Tomorrow
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
