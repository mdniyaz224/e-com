'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { formatPrice, formatNumber } from '@/utils/formatPrice';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const [currentImage, setCurrentImage] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [pincode, setPincode] = useState('560034');
  const [showAllOffers, setShowAllOffers] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetch(`${API_URL}/api/products/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data || data.error) {
          setNotFound(true);
        } else {
          setProduct(data);
        }
      })
      .catch((err) => {
        console.error('Error loading product:', err);
        setNotFound(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className={styles.productPage}>
        <div className={styles.backBar}>
          <button className={styles.backBtn} onClick={() => router.back()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <span className={styles.pageTitle}>Product Not Found</span>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#212121', marginBottom: '8px' }}>Product Not Found</h2>
          <p style={{ fontSize: '14px', color: '#878787', marginBottom: '24px' }}>The product you are looking for does not exist or may have been removed.</p>
          <button
            onClick={() => router.push('/')}
            style={{
              background: '#2874F0',
              color: '#fff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  // Safe image array resolving
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : (product.image ? [product.image] : []);

  const safeImageIndex = currentImage >= 0 && currentImage < images.length ? currentImage : 0;
  const activeColor = product.colors?.[selectedColor];
  const activeImage =
    images[safeImageIndex] || activeColor?.image || images[0] || product.image || '';

  const handlePrevImage = () => {
    if (images.length <= 1) return;
    setCurrentImage((prev) => (prev <= 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (images.length <= 1) return;
    setCurrentImage((prev) => (prev >= images.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    if (distance > 40) {
      handleNextImage(); // Swiped left -> Next
    } else if (distance < -40) {
      handlePrevImage(); // Swiped right -> Prev
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const handleSelectColor = (index) => {
    setSelectedColor(index);
    const colorObj = product.colors?.[index];
    if (colorObj?.image && images.length > 0) {
      const matchIdx = images.findIndex((img) => img === colorObj.image);
      if (matchIdx !== -1) {
        setCurrentImage(matchIdx);
      }
    }
  };

  const handleAddToCart = () => {
    addToCart(product, activeColor?.name || 'Standard', 1, activeImage);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, activeColor?.name || 'Standard', 1, activeImage);
    router.push('/cart');
  };

  return (
    <div className={styles.productPage}>
      {/* Back button */}
      <div className={styles.backBar}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <span className={styles.pageTitle}>Product Details</span>
        <div className={styles.backBarIcons}>
          <button
            className={styles.backBtn}
            onClick={() => router.push('/?search=')}
            aria-label="Search"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
          <button className={styles.backBtn} onClick={() => router.push('/cart')} aria-label="Cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Responsive Content Grid: Image gallery on left, Details on right on desktop */}
      <div className={styles.productDesktopLayout}>
        <div className={styles.leftColumn}>
          {/* Enhanced Image Carousel */}
          <div className={styles.imageSection}>
            <div
              className={styles.imageMain}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Previous / Next Arrow Controls */}
              {images.length > 1 && (
                <>
                  <button
                    className={`${styles.navArrow} ${styles.prevArrow}`}
                    onClick={handlePrevImage}
                    aria-label="Previous Image"
                  >
                    ‹
                  </button>
                  <button
                    className={`${styles.navArrow} ${styles.nextArrow}`}
                    onClick={handleNextImage}
                    aria-label="Next Image"
                  >
                    ›
                  </button>
                </>
              )}

              <button
                className={`${styles.wishlistBtn} ${wishlisted ? styles.wishlisted : ''}`}
                onClick={() => setWishlisted(!wishlisted)}
                aria-label="Wishlist"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill={wishlisted ? '#FF1744' : 'none'} stroke={wishlisted ? '#FF1744' : '#666'} strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
              <button
                className={styles.shareBtn}
                aria-label="Share"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: product.name,
                      text: `Check out ${product.name} on PulseKart!`,
                      url: window.location.href,
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Product link copied to clipboard!');
                  }
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </button>

              {activeImage ? (
                <img
                  src={activeImage}
                  alt={`${product.name} - Slide ${safeImageIndex + 1}`}
                  className={styles.productMainImage}
                  key={activeImage}
                />
              ) : (
                <div className={styles.imagePlaceholder}>
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="0.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
              )}
            </div>

            <div className={styles.badges}>
              {product.isAssured && (
                <span className={styles.assuredBadge}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2874F0" strokeWidth="2.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  PULSE ASSURED
                </span>
              )}
              {images.length > 0 && (
                <span className={styles.imageCount}>
                  {safeImageIndex + 1} of {images.length}
                </span>
              )}
            </div>

            {/* Indicator Dots */}
            {images.length > 1 && (
              <div className={styles.dots}>
                {images.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.dot} ${i === safeImageIndex ? styles.dotActive : ''}`}
                    onClick={() => setCurrentImage(i)}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Thumbnail Filmstrip */}
            {images.length > 1 && (
              <div className={styles.thumbnailStrip}>
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={`${styles.thumbBtn} ${i === safeImageIndex ? styles.thumbActive : ''}`}
                    onClick={() => setCurrentImage(i)}
                  >
                    <img src={img} alt={`Thumbnail ${i + 1}`} className={styles.thumbImg} />
                  </button>
                ))}
              </div>
            )}

            {/* Desktop Action Buttons under image */}
            <div className={styles.desktopActionButtons}>
              <button
                className={`${styles.addToCartBtn} ${addedToCart ? styles.added : ''}`}
                onClick={handleAddToCart}
              >
                {addedToCart ? '✓ Added to Cart' : '🛒 Add to Cart'}
              </button>
              <button className={styles.buyNowBtn} onClick={handleBuyNow}>
                ⚡ Buy Now
              </button>
            </div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          {/* Product Info */}
          <div className={styles.infoSection}>
        <div className={styles.tagsRow}>
          {product.isTopDeal && <span className={styles.topDealBadge}>TOP DEAL</span>}
          <span className={styles.categoryTag}>{product.categoryTag}</span>
        </div>

        <h1 className={styles.productTitle}>{product.name}</h1>

        <div className={styles.ratingRow}>
          <span className="rating">
            {product.rating}
            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </span>
          <span className={styles.ratingText}>
            {formatNumber(product.ratingCount)} ratings & {formatNumber(product.reviewCount)} reviews
          </span>
        </div>

        <div className={styles.priceRow}>
          <span className={styles.priceBig}>{formatPrice(product.price)}</span>
          <span className="price-original">{formatPrice(product.originalPrice)}</span>
          <span className="price-discount">{product.discount}% off</span>
        </div>

        {product.freeDelivery && (
          <div className={styles.deliveryHighlight}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
            Free delivery by {product.deliveryBy}
          </div>
        )}
      </div>

      {/* Bank Offers */}
      {Array.isArray(product.bankOffers) && product.bankOffers.length > 0 && (
        <div className={styles.offersSection}>
          <div className={styles.offersHeader}>
            <span className={styles.offersTitle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#388E3C" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              Available Bank Offers
            </span>
            <button className={styles.offersCount} onClick={() => setShowAllOffers(!showAllOffers)}>
              {product.bankOffers.length} OFFERS
            </button>
          </div>
          {product.bankOffers.slice(0, showAllOffers ? undefined : 2).map((offer, i) => (
            <div key={i} className={styles.offerItem}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2874F0" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
              <div className={styles.offerText}>
                <span className={styles.offerType}>{offer.type}:</span> {offer.description}
                {offer.hasTC && (
                  <button
                    className={styles.tcBtn}
                    onClick={() => alert(`Terms & Conditions for ${offer.type}:\n\n- Valid on transactions above ₹4,999.\n- Maximum discount up to ₹1,500.\n- Offer automatically applied at checkout.`)}
                  >
                    T&C Apply
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Color Variants */}
      {Array.isArray(product.colors) && product.colors.length > 1 && (
        <div className={styles.colorSection}>
          <div className={styles.colorHeader}>
            <span>Color: <strong>{product.colors[selectedColor]?.name || 'Standard'}</strong></span>
            <span className={styles.variantCount}>{product.colors.length} Variants in stock</span>
          </div>
          <div className={styles.colorOptions}>
            {product.colors.map((color, i) => (
              <button
                key={i}
                className={`${styles.colorSwatch} ${i === selectedColor ? styles.colorActive : ''}`}
                onClick={() => handleSelectColor(i)}
              >
                <div className={styles.swatchCircle} style={{ background: color.hex }}></div>
                <span className={styles.swatchLabel}>{color.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PulseCare */}
      <div className={styles.pulsecare}>
        <input type="checkbox" id="pulsecare" className={styles.pulsecareCheck} />
        <label htmlFor="pulsecare" className={styles.pulsecareLabel}>
          <div>
            <strong>PulseCare Complete Protection</strong>
            <p>1 Year Complete Accidental & Liquid Damage Protection for only <strong>₹199</strong>.</p>
          </div>
        </label>
      </div>

      {/* Delivery & Services */}
      <div className={styles.deliverySection}>
        <div className={styles.deliveryHeader}>
          <h3>Delivery & Services</h3>
          <span className={styles.fastestTag}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            Fastest Delivery
          </span>
        </div>
        <div className={styles.pincodeRow}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#878787" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <input
            type="text"
            className={styles.pincodeInput}
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            placeholder="Enter pincode"
            maxLength="6"
          />
          <button
            className={styles.checkBtn}
            onClick={() => {
              if (pincode && pincode.length >= 6) {
                alert(`✓ Serviceable! Express delivery is available for pincode ${pincode} by tomorrow.`);
              } else {
                alert('Please enter a valid 6-digit Indian pincode.');
              }
            }}
          >
            Check
          </button>
        </div>
        <div className={styles.deliveryInfo}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#388E3C" strokeWidth="2">
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
          <div>
            <p className={styles.deliveryTo}>Delivery to {pincode}</p>
            <p className={styles.deliveryTime}>{product.deliveryHighlight || 'Fast delivery available'}</p>
          </div>
        </div>
      </div>

      {/* Key Highlights */}
      {Array.isArray(product.highlights) && product.highlights.length > 0 && (
        <div className={styles.highlightsSection}>
          <h3 className={styles.highlightsTitle}>Key Highlights</h3>
          <ul className={styles.highlightsList}>
            {product.highlights.map((h, i) => (
              <li key={i} className={styles.highlightItem}>
                <svg width="6" height="6" viewBox="0 0 24 24" fill="#212121">
                  <circle cx="12" cy="12" r="12"></circle>
                </svg>
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warranty Badges */}
      {product.warranty && (
        <div className={styles.warrantySection}>
          {product.warranty.replacement && (
            <div className={styles.warrantyBadge}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2874F0" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span className={styles.warrantyValue}>{product.warranty.replacement}</span>
              <span className={styles.warrantyLabel}>Replacement</span>
            </div>
          )}
          {product.warranty.cod && (
            <div className={styles.warrantyBadge}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2874F0" strokeWidth="1.5">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
              <span className={styles.warrantyValue}>Cash on</span>
              <span className={styles.warrantyLabel}>Delivery Available</span>
            </div>
          )}
          {product.warranty.brandWarranty && (
            <div className={styles.warrantyBadge}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2874F0" strokeWidth="1.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span className={styles.warrantyValue}>{product.warranty.brandWarranty}</span>
              <span className={styles.warrantyLabel}>Brand Warranty</span>
            </div>
          )}
        </div>
      )}
      </div>
    </div>

      {/* Bottom Action Bar (Mobile Only) */}
      <div className={styles.actionBar}>
        <button
          className={`${styles.addToCartBtn} ${addedToCart ? styles.added : ''}`}
          onClick={handleAddToCart}
        >
          {addedToCart ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Added!
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              Add to Cart
            </>
          )}
        </button>
        <button className={styles.buyNowBtn} onClick={handleBuyNow}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
          Buy Now
        </button>
      </div>
    </div>
  );
}
