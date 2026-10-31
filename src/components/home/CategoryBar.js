'use client';

import styles from './CategoryBar.module.css';

const categories = [
  { id: 1, name: 'Top Offers', icon: '🏷️' },
  { id: 2, name: 'Mobiles', icon: '📱' },
  { id: 3, name: 'Electronics', icon: '🎧' },
  { id: 4, name: 'Fashion', icon: '👔' },
  { id: 5, name: 'Appliances', icon: '📺' },
  { id: 6, name: 'Grocery', icon: '🛒' },
  { id: 7, name: 'Home', icon: '🏠' },
  { id: 8, name: 'Beauty', icon: '✨' },
];

export default function CategoryBar({ selectedCategory, onSelectCategory }) {
  return (
    <div className={styles.categoryBar}>
      <div className={`${styles.scrollContainer} hide-scrollbar`}>
        {categories.map((cat, i) => {
          const isActive = selectedCategory === cat.name;
          return (
            <button
              key={cat.id}
              className={`${styles.categoryItem} ${isActive ? styles.active : ''}`}
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => onSelectCategory && onSelectCategory(cat.name)}
            >
              <div className={styles.iconCircle}>
                <span className={styles.emoji}>{cat.icon}</span>
              </div>
              <span className={styles.label}>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
