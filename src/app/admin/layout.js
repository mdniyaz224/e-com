'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './admin.module.css';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navLinks = [
    {
      label: 'Dashboard',
      path: '/admin',
      icon: '📊',
      exact: true
    },
    {
      label: 'Products Catalog',
      path: '/admin/products',
      icon: '📦',
      exact: false
    },
    {
      label: 'Upload Product',
      path: '/admin/products/new',
      icon: '➕',
      exact: true
    },
    {
      label: 'Orders Tracker',
      path: '/admin/orders',
      icon: '🚚',
      exact: true
    }
  ];

  const getPageTitle = () => {
    if (pathname === '/admin') return 'Dashboard Overview';
    if (pathname === '/admin/products/new') return 'Upload New Product';
    if (pathname.startsWith('/admin/products')) return 'Catalog & Inventory';
    if (pathname === '/admin/orders') return 'Customer Orders';
    return 'Admin Studio';
  };

  return (
    <div className={styles.adminContainer}>
      {/* Sidebar Navigation */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/admin" className={styles.brandLogo}>
            <div className={styles.brandIcon}>P</div>
            <div className={styles.brandTitle}>
              PulseKart
              <span className={styles.adminBadge}>Admin</span>
            </div>
          </Link>
          <button
            className={styles.closeSidebarBtn}
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close Sidebar"
          >
            ✕
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          <div className={styles.navSectionLabel}>Store Management</div>
          {navLinks.map((item) => {
            const isActive = item.exact
              ? pathname === item.path
              : pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.storeLink}>
            <span>🛍️</span>
            <span>View Public Store</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainWrapper}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              className={styles.mobileMenuBtn}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Open Sidebar Menu"
            >
              ☰
            </button>
            <div className={styles.pageHeaderInfo}>
              <h1>{getPageTitle()}</h1>
              <p>PulseKart Operations & Inventory Hub</p>
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.statusIndicator}>
              <span className={styles.statusDot}></span>
              <span>API Live</span>
            </div>
            {pathname !== '/admin/products/new' && (
              <Link href="/admin/products/new" className={styles.uploadShortcutBtn}>
                <span>➕</span>
                <span>Upload Product</span>
              </Link>
            )}
          </div>
        </header>

        <main className={styles.pageBody}>
          {children}
        </main>
      </div>
    </div>
  );
}

