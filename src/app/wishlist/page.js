'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/formatPrice';
import styles from './wishlist.module.css';

export default function WishlistPage() {
  const { isAuthenticated, isLoading: isAuthLoading, openAuthModal } = useAuth();
  const { wishlistItems, removeFromWishlist, addToCart } = useCart();

  const handleMoveToCart = async (product) => {
    await addToCart(product, 'Standard', 1);
    removeFromWishlist(product.id);
  };

  if (!isAuthenticated && !isAuthLoading) {
    return (
      <div className={styles.wishlistContainer}>
        <div style={{ maxWidth: '520px', margin: '40px auto', background: '#fff', borderRadius: '12px', padding: '40px 24px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '50px', marginBottom: '14px' }}>❤️</div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
            Missing Wishlist items?
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
            Log in to view your saved items, price drop alerts, and sync wishlisted products across all devices.
          </p>
          <button
            onClick={() => openAuthModal('login', '/wishlist')}
            style={{
              width: '100%',
              background: '#fb641b',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '13px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(251, 100, 27, 0.3)'
            }}
          >
            LOGIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wishlistContainer}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/account">My Account</Link>
        <span>/</span>
        <span style={{ color: '#0f172a', fontWeight: 600 }}>My Wishlist</span>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>
          <span>❤️ My Wishlist</span>
          <span className={styles.countBadge}>{wishlistItems.length} Saved</span>
        </div>
      </div>

      {/* Wishlist Items Grid */}
      {wishlistItems.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💔</div>
          <div className={styles.emptyTitle}>Your Wishlist is Empty</div>
          <div className={styles.emptySub}>
            Explore more and shortlist some of your favorite electronics, audio gear, and fashion!
          </div>
          <Link href="/" className={styles.exploreBtn}>
            Explore PulseKart Store
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {wishlistItems.map((product) => (
            <div key={product.id} className={styles.card}>
              <div className={styles.imageWrap}>
                <img src={product.images?.[0] || '/images/headphones.png'} alt={product.name} />
                <button
                  className={styles.removeBtn}
                  onClick={() => removeFromWishlist(product.id)}
                  title="Remove from Wishlist"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>

              <div className={styles.body}>
                <div className={styles.brand}>{product.brand || 'PulseKart Select'}</div>
                <Link href={`/product/${product.id}`} className={styles.productName}>
                  {product.name}
                </Link>

                <div className={styles.ratingRow}>
                  <div className={styles.ratingBadge}>
                    <span>★</span>
                    <span>{product.rating || '4.5'}</span>
                  </div>
                  <span className={styles.ratingCount}>
                    ({product.ratingCount ? product.ratingCount.toLocaleString() : '1,200'})
                  </span>
                </div>

                <div className={styles.priceRow}>
                  <span className={styles.price}>{formatPrice(product.price)}</span>
                  {product.originalPrice > product.price && (
                    <span className={styles.mrp}>{formatPrice(product.originalPrice)}</span>
                  )}
                  {product.discount > 0 && (
                    <span className={styles.discount}>{product.discount}% OFF</span>
                  )}
                </div>

                <button
                  className={styles.moveToCartBtn}
                  onClick={() => handleMoveToCart(product)}
                >
                  <span>🛒 Move to Cart</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

