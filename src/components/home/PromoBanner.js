'use client';

import { useState, useEffect } from 'react';
import styles from './PromoBanner.module.css';

export default function PromoBanner() {
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 42, seconds: 10 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 0; minutes = 0; seconds = 0; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className={styles.promoBanner}>
      <div className={styles.topRow}>
        <div className={styles.tag}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
          BIG PULSE DAYS
        </div>
        <div className={styles.countdown}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>{pad(timeLeft.hours)}h : {pad(timeLeft.minutes)}m : {pad(timeLeft.seconds)}s left</span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.textSide}>
          <h2 className={styles.headline}>Up to 80% Off</h2>
          <p className={styles.subtitle}>Top Smartphones & Hi-Fi Audio</p>
          <button
            className={styles.cta}
            onClick={() => {
              const el = document.getElementById('deals-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Shop Now
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
        <div className={styles.imageSide}>
          <div className={styles.promoGraphic}>
            <div className={styles.circle1}></div>
            <div className={styles.circle2}></div>
            <span className={styles.percentIcon}>%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
