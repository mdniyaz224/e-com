import styles from './SuperCoinBanner.module.css';

export default function SuperCoinBanner() {
  return (
    <div className={styles.banner}>
      <div className={styles.coinIcon}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#FFD700" stroke="#E6B800" strokeWidth="1.5"/>
          <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#996600">S</text>
        </svg>
      </div>
      <div className={styles.content}>
        <div className={styles.titleRow}>
          <span className={styles.title}>SuperCoinZone</span>
          <span className={styles.plusBadge}>PLUS</span>
        </div>
        <p className={styles.subtitle}>Earn 50 SuperCoins + Free Express Delivery</p>
      </div>
      <button className={styles.exploreBtn}>Explore</button>
    </div>
  );
}
