'use client';

import { useState } from 'react';
import styles from './BankOffer.module.css';

export default function BankOffer() {
  const [showTerms, setShowTerms] = useState(false);

  return (
    <>
      <div className={styles.bankOffer}>
        <div className={styles.iconWrap}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2874F0" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
        </div>
        <div className={styles.content}>
          <span className={styles.title}>Bank Offer: 10% Instant Discount</span>
          <span className={styles.subtitle}>On HDFC Bank & SBI Credit Cards</span>
        </div>
        <button
          className={styles.tcLink}
          onClick={() => setShowTerms(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          T&C
        </button>
      </div>

      {showTerms && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setShowTerms(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              maxWidth: '440px',
              width: '100%',
              padding: '20px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#212121' }}>
              Bank Offer Terms & Conditions
            </h3>
            <ul style={{ fontSize: '13px', color: '#555', lineHeight: 1.6, paddingLeft: '20px', margin: '0 0 16px' }}>
              <li>10% Instant Discount up to ₹1,500 on HDFC Bank Credit Card EMI transactions.</li>
              <li>Minimum cart value required: ₹4,999.</li>
              <li>Offer valid on all Mobiles, Laptops, Audio, and Home Appliances.</li>
              <li>Discount applied automatically at checkout payment stage.</li>
            </ul>
            <button
              onClick={() => setShowTerms(false)}
              style={{
                width: '100%',
                background: '#2874f0',
                color: '#fff',
                border: 'none',
                padding: '10px',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}

