'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import styles from './coupons.module.css';

const availableCoupons = [
  {
    code: 'PULSEFIRST',
    title: 'Flat 10% Instant Discount',
    desc: 'Get 10% instant off on your first order up to ₹500 on all categories.',
    minOrder: 'No minimum order',
    expiry: 'Valid till 30 Nov 2026'
  },
  {
    code: 'EXTRA500',
    title: 'Extra ₹500 OFF',
    desc: 'Save flat ₹500 instantly on high-value cart orders exceeding ₹2,499.',
    minOrder: 'Min order ₹2,499',
    expiry: 'Valid till 15 Nov 2026'
  },
  {
    code: 'AUDIO20',
    title: 'Flat 20% OFF Audio & Tech',
    desc: 'Valid on wireless headphones, Bluetooth earbuds, soundbars & accessories.',
    minOrder: 'Min order ₹1,499',
    expiry: 'Valid till 20 Nov 2026'
  },
  {
    code: 'FREESHIP',
    title: '100% Free Express Delivery',
    desc: 'Zero shipping charges on any cart value across all pin codes in India.',
    minOrder: 'No minimum order',
    expiry: 'Valid till 31 Dec 2026'
  },
  {
    code: 'FESTIVE1000',
    title: 'Festive Special ₹1,000 OFF',
    desc: 'Special mega festive voucher on 4K Smart TVs, Laptops & Home Appliances.',
    minOrder: 'Min order ₹9,999',
    expiry: 'Valid till 10 Nov 2026'
  }
];

export default function CouponsPage() {
  const { appliedCoupon, applyCoupon } = useCart();
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleApply = (code) => {
    applyCoupon(code);
    handleCopy(code);
  };

  return (
    <div className={styles.container}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/account">My Account</Link>
        <span>/</span>
        <span style={{ color: '#0f172a', fontWeight: 600 }}>Coupons & Rewards</span>
      </div>

      {/* SuperCoins Rewards Hero Card */}
      <div className={styles.superCoinCard}>
        <div className={styles.coinLeft}>
          <div className={styles.coinCircle}>🪙</div>
          <div>
            <div className={styles.coinAmount}>450 SuperCoins</div>
            <div className={styles.coinSub}>
              Worth ₹450 savings on your upcoming purchases • 1 Coin = ₹1
            </div>
          </div>
        </div>

        <div className={styles.coinRight}>
          <span>★</span>
          <span>PulseKart Plus VIP Member</span>
        </div>
      </div>

      {/* Active Coupons Section */}
      <div className={styles.sectionTitle}>
        <span>🏷️</span>
        <span>Available Discount Coupons ({availableCoupons.length})</span>
      </div>

      <div className={styles.couponsGrid}>
        {availableCoupons.map((coupon) => {
          const isApplied = appliedCoupon === coupon.code;
          return (
            <div key={coupon.code} className={styles.couponCard}>
              <div className={styles.couponTop}>
                <span className={styles.codeBox}>{coupon.code}</span>
                <button
                  className={styles.copyBtn}
                  onClick={() => handleCopy(coupon.code)}
                >
                  {copiedCode === coupon.code ? 'Copied! ✓' : 'Copy'}
                </button>
              </div>

              <div className={styles.couponBody}>
                <div className={styles.offerHeadline}>{coupon.title}</div>
                <div className={styles.offerDesc}>{coupon.desc}</div>

                <div className={styles.expiryRow}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#475569' }}>{coupon.minOrder}</span>
                    <div style={{ color: '#94a3b8', fontSize: '10px' }}>{coupon.expiry}</div>
                  </div>

                  {isApplied ? (
                    <span className={styles.appliedBadge}>✓ Applied in Cart</span>
                  ) : (
                    <button
                      className={styles.applyBtn}
                      onClick={() => handleApply(coupon.code)}
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

