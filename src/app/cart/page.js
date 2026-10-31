'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/formatPrice';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, openAuthModal } = useAuth();
  const {
    cartItems,
    priceDetails,
    updateQuantity,
    removeFromCart,
    superCoinsUsed,
    toggleSuperCoins,
    appliedCoupon,
    loading: cartLoading,
  } = useCart();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/user`)
      .then((res) => res.json())
      .then((data) => {
        if (data.addresses && data.addresses.length > 0) {
          setAddresses(data.addresses);
          const def = data.addresses.find((a) => a.isDefault) || data.addresses[0];
          setSelectedAddressId(def.id);
        }
      })
      .catch(() => {});
  }, []);

  const currentAddress = addresses.find((a) => a.id === selectedAddressId) || addresses[0] || null;

  if (cartLoading && (!cartItems || cartItems.length === 0)) {
    return (
      <div className={styles.cartPage}>
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#878787' }}>
          <p>Loading cart...</p>
        </div>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    if (!isLoading && !isAuthenticated) {
      return (
        <div className={styles.cartPage}>
          <div className={styles.emptyState}>
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#2874F0" strokeWidth="1.2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <h2>Missing Cart items?</h2>
            <p>Login to see the items you added previously</p>
            <button
              className={styles.shopNowBtn}
              style={{ background: '#fb641b', borderColor: '#fb641b', padding: '12px 36px', fontSize: '15px' }}
              onClick={() => openAuthModal('login', '/cart')}
            >
              Login
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.cartPage}>
        <div className={styles.emptyState}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <h2>Your cart is empty!</h2>
          <p>Explore our products and find great deals today.</p>
          <button className={styles.shopNowBtn} onClick={() => router.push('/')}>
            Shop Now
          </button>
        </div>
      </div>
    );
  }

  // Calculate pricing summary dynamically if not returned from backend
  const calculatedOriginalPrice = cartItems.reduce(
    (sum, item) => sum + (item.originalPrice || item.price * 1.5) * item.quantity,
    0
  );
  const calculatedItemsPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discountAmount = calculatedOriginalPrice - calculatedItemsPrice;
  const superCoinDiscount = superCoinsUsed ? 100 : 0;
  const couponDiscount = appliedCoupon ? 200 : 0;
  const totalAmount = Math.max(0, calculatedItemsPrice - superCoinDiscount - couponDiscount);
  const totalSavings = discountAmount + superCoinDiscount + couponDiscount;

  const handlePlaceOrder = () => {
    if (!isAuthenticated) {
      openAuthModal('login', '/checkout');
    } else {
      router.push('/checkout');
    }
  };

  return (
    <div className={styles.cartPage}>
      {/* 3-Step Progress Indicator */}
      <div className={styles.progressContainer}>
        <div className={`${styles.step} ${styles.stepActive}`}>
          <span className={styles.stepNum}>1</span>
          <span>Cart</span>
        </div>
        <div className={styles.stepLine}></div>
        <div className={styles.step}>
          <span className={styles.stepNum}>2</span>
          <span>Address</span>
        </div>
        <div className={styles.stepLine}></div>
        <div className={styles.step}>
          <span className={styles.stepNum}>3</span>
          <span>Payment</span>
        </div>
      </div>

      {/* Responsive Cart Grid: Left items column & Right sticky checkout column */}
      <div className={styles.cartDesktopGrid}>
        <div className={styles.cartMainColumn}>
          {/* Deliver To Address Strip */}
          <div className={styles.addressBar}>
            <div className={styles.addressLeft}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2874F0" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span className={styles.addressText}>
                {currentAddress ? (
                  <>
                    Deliver to: <strong>{currentAddress.name}, {currentAddress.pincode}</strong>
                    <span style={{ fontSize: '11px', color: '#777', marginLeft: '6px' }}>
                      ({currentAddress.label || 'HOME'})
                    </span>
                  </>
                ) : (
                  <span>Select or add delivery address</span>
                )}
              </span>
            </div>
            <button className={styles.changeBtn} onClick={() => setIsAddressModalOpen(true)}>
              {currentAddress ? 'Change' : 'Add Address'}
            </button>
          </div>

          {/* Cart Items List */}
          <div className={styles.itemsSection}>
        {cartItems.map((item) => (
          <div key={item.id} className={styles.itemCard}>
            <div className={styles.itemMain}>
              <div className={styles.itemImgWrap}>
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                  />
                ) : (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1">
                    <rect x="2" y="2" width="20" height="20" rx="3" ry="3"></rect>
                    <circle cx="8.5" cy="8.5" r="2"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                )}
              </div>

              <div className={styles.itemDetails}>
                <h3 className={styles.itemName}>{item.name}</h3>
                <div className={styles.itemMeta}>
                  <span>Seller: {item.seller || 'Pulse Retail'}</span>
                  {item.isAssured && <span className={styles.itemAssured}>✓ Assured</span>}
                </div>

                <div className={styles.itemPrices}>
                  <span className={styles.priceNow}>{formatPrice(item.price)}</span>
                  {item.originalPrice && (
                    <span className={styles.priceOriginal}>{formatPrice(item.originalPrice)}</span>
                  )}
                  {item.discount && (
                    <span className={styles.itemDiscount}>{item.discount}% off</span>
                  )}
                </div>

                <div className={styles.itemDelivery}>
                  Delivery by <strong>{item.deliveryBy || 'Tomorrow, 2 PM'}</strong> | <span style={{ color: '#388E3C' }}>Free</span>
                </div>
              </div>
            </div>

            {/* Actions: Quantity & Remove */}
            <div className={styles.itemActions}>
              <div className={styles.qtyControl}>
                <button
                  className={styles.qtyBtn}
                  onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                  disabled={item.quantity <= 1}
                >
                  −
                </button>
                <span className={styles.qtyValue}>{item.quantity}</span>
                <button
                  className={styles.qtyBtn}
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  +
                </button>
              </div>

              <div className={styles.itemBtnGroup}>
                <button
                  className={styles.actionLink}
                  onClick={() => {
                    removeFromCart(item.id);
                    alert(`"${item.name}" moved to your Saved for Later items.`);
                  }}
                >
                  Save for later
                </button>
                <button
                  className={styles.actionLink}
                  onClick={() => removeFromCart(item.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className={styles.cartSidebarColumn}>
          {/* SuperCoins & Coupons */}
          <div className={styles.savingsStrip}>
        <div className={styles.superCoinRow}>
          <div className={styles.superCoinLeft}>
            <div className={styles.coinIcon}>🪙</div>
            <div className={styles.superCoinText}>
              <h4>Use 100 SuperCoins to save ₹100</h4>
              <p>Balance: 450 coins available</p>
            </div>
          </div>
          <div
            className={`${styles.toggleSwitch} ${superCoinsUsed ? styles.toggleActive : ''}`}
            onClick={toggleSuperCoins}
          >
            <div className={styles.toggleThumb}></div>
          </div>
        </div>

        <div className={styles.couponRow}>
          <div className={styles.couponLeft}>
            <span className={styles.couponBadge}>✓ APPLIED</span>
            <span>Coupon &apos;{appliedCoupon}&apos; saved ₹200</span>
          </div>
          <button
            className={styles.changeBtn}
            onClick={() => {
              const code = prompt('Enter Coupon Code (e.g. EXTRA500, PULSEFIRST):', appliedCoupon);
              if (code) {
                alert(`Coupon "${code.toUpperCase()}" applied successfully!`);
              }
            }}
          >
            Coupons
          </button>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className={styles.priceSection}>
        <h4 className={styles.priceTitle}>Price Details ({cartItems.length} items)</h4>

        <div className={styles.priceRow}>
          <span>Total MRP</span>
          <span>{formatPrice(calculatedOriginalPrice)}</span>
        </div>

        <div className={styles.priceRow}>
          <span>Discount on MRP</span>
          <span className={styles.discountGreen}>-{formatPrice(discountAmount)}</span>
        </div>

        {superCoinsUsed && (
          <div className={styles.priceRow}>
            <span>SuperCoin Savings</span>
            <span className={styles.discountGreen}>-₹100</span>
          </div>
        )}

        {appliedCoupon && (
          <div className={styles.priceRow}>
            <span>Coupon Savings</span>
            <span className={styles.discountGreen}>-₹200</span>
          </div>
        )}

        <div className={styles.priceRow}>
          <span>Delivery Charges</span>
          <span className={styles.discountGreen}><del style={{ color: '#878787' }}>₹80</del> FREE</span>
        </div>

        <div className={styles.totalRow}>
          <span>Total Amount</span>
          <span>{formatPrice(totalAmount)}</span>
        </div>

        <div className={styles.saveMessage}>
          🎉 You will save {formatPrice(totalSavings)} on this order!
        </div>

        {/* Desktop Place Order Button inside sidebar */}
        <div className={styles.desktopCheckoutAction}>
          <button
            className={styles.desktopOrderBtn}
            onClick={handlePlaceOrder}
          >
            Place Order ({cartItems.length} items)
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>

      {/* Trust Badges */}
      <div className={styles.trustStrip}>
        <div className={styles.trustItem}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2874F0" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span>100% Safe Payments</span>
        </div>
        <div className={styles.trustItem}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2874F0" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          <span>Easy 7 Days Return</span>
        </div>
        <div className={styles.trustItem}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2874F0" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 14 14"></polyline>
          </svg>
          <span>24x7 Customer Support</span>
        </div>
      </div>

      {/* Sticky Bottom Place Order Bar */}
      <div className={styles.cartFooter}>
        <div className={styles.footerLeft}>
          <div className={styles.footerTotal}>{formatPrice(totalAmount)}</div>
          <button
            className={styles.viewDetailsLink}
            onClick={() => {
              window.scrollTo({ top: document.body.scrollHeight / 2, behavior: 'smooth' });
            }}
          >
            View price details
          </button>
        </div>
        <button
          className={styles.orderBtn}
          onClick={handlePlaceOrder}
        >
          Place Order
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>

      {/* Address Selection Modal */}
      {isAddressModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddressModalOpen(false)}>
          <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Select Delivery Address</h3>
              <button
                className={styles.closeModalBtn}
                onClick={() => setIsAddressModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {addresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id;
                return (
                  <div
                    key={addr.id}
                    className={`${styles.addressOptionCard} ${isSelected ? styles.addressSelected : ''}`}
                    onClick={() => setSelectedAddressId(addr.id)}
                  >
                    <div className={`${styles.radioCircle} ${isSelected ? styles.radioSelected : ''}`}>
                      {isSelected && <div className={styles.radioDot}></div>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px' }}>{addr.name}</span>
                        <span
                          style={{
                            fontSize: '10px',
                            background: '#f0f0f0',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 700,
                          }}
                        >
                          {addr.label || 'HOME'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#555', marginTop: '4px', lineHeight: 1.4 }}>
                        {addr.address}, {addr.city} - <strong>{addr.pincode}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '3px' }}>
                        Phone: {addr.phone}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              className={styles.deliverHereBtn}
              onClick={() => setIsAddressModalOpen(false)}
            >
              Deliver to this Address
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
