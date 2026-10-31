'use client';

import { useRouter } from 'next/navigation';

import styles from './page.module.css';

export default function CategoriesPage() {
  const router = useRouter();

  const categories = [
    { name: 'Top Offers', icon: '🏷️', count: '1000+ Deals' },
    { name: 'Mobiles & Tablets', icon: '📱', count: '450+ Items' },
    { name: 'Electronics', icon: '🎧', count: '1200+ Items' },
    { name: 'TVs & Appliances', icon: '📺', count: '320+ Items' },
    { name: 'Fashion & Beauty', icon: '👗', count: '2500+ Items' },
    { name: 'Home & Kitchen', icon: '🏠', count: '890+ Items' },
    { name: 'Grocery & Supermarket', icon: '🛒', count: '600+ Items' },
    { name: 'Sports & Fitness', icon: '⚽', count: '410+ Items' },
  ];

  return (
    <div className={styles.categoriesPage}>
      <h2 className={styles.heading}>
        All Categories
      </h2>
      <div className={styles.grid}>
        {categories.map((cat, i) => (
          <div
            key={i}
            onClick={() => {
              const catKey = cat.name.includes('Mobiles')
                ? 'Mobiles'
                : cat.name.includes('Electronics')
                ? 'Electronics'
                : cat.name.includes('Appliances')
                ? 'Appliances'
                : cat.name.includes('Fashion')
                ? 'Fashion'
                : cat.name.includes('Home')
                ? 'Home'
                : cat.name.includes('Grocery')
                ? 'Grocery'
                : cat.name.includes('Beauty')
                ? 'Beauty'
                : 'Top Offers';
              router.push(`/?category=${encodeURIComponent(catKey)}`);
            }}
            className={styles.card}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.icon}>{cat.icon}</div>
            <div className={styles.name}>{cat.name}</div>
            <div className={styles.count}>{cat.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
