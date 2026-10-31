'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/utils/formatPrice';
import styles from './admin.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function AdminDashboardPage() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/products`).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/api/orders`).then(r => r.json()).catch(() => ({ orders: [] }))
    ])
      .then(([productsData, ordersData]) => {
        setProducts(Array.isArray(productsData) ? productsData : []);
        setOrders(ordersData?.orders || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const activeDeals = products.filter(p => p.isTopDeal).length;
  const recentOrders = orders.slice(0, 5);
  const recentProducts = products.slice(0, 5);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Delivered': return styles.badgeSuccess;
      case 'Shipped': return styles.badgeInfo;
      case 'Packed': return styles.badgeWarning;
      case 'Cancelled': return styles.badgeDanger;
      default: return styles.badgeAssured;
    }
  };

  return (
    <div>
      {/* Banner */}
      <div className={styles.actionBanner}>
        <div className={styles.actionBannerContent}>
          <h2>PulseKart Admin Studio 🚀</h2>
          <p>Easily upload products, maintain inventory, and process orders in real time.</p>
        </div>
        <Link href="/admin/products/new" className={styles.actionBannerBtn}>
          <span>➕</span>
          <span>Upload Product Now</span>
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div>
            <div className={styles.statLabel}>Total Products</div>
            <div className={styles.statValue}>{products.length}</div>
            <div className={styles.statSub}>Active in catalog</div>
          </div>
          <div className={`${styles.statIconWrap} ${styles.statBlue}`}>📦</div>
        </div>

        <div className={styles.statCard}>
          <div>
            <div className={styles.statLabel}>Total Orders</div>
            <div className={styles.statValue}>{orders.length}</div>
            <div className={styles.statSub}>Customer purchases</div>
          </div>
          <div className={`${styles.statIconWrap} ${styles.statGreen}`}>🚚</div>
        </div>

        <div className={styles.statCard}>
          <div>
            <div className={styles.statLabel}>Total Sales</div>
            <div className={styles.statValue}>{formatPrice(totalRevenue)}</div>
            <div className={styles.statSub}>Gross volume</div>
          </div>
          <div className={`${styles.statIconWrap} ${styles.statOrange}`}>💰</div>
        </div>

        <div className={styles.statCard}>
          <div>
            <div className={styles.statLabel}>Top Deals Active</div>
            <div className={styles.statValue}>{activeDeals}</div>
            <div className={styles.statSub}>Promoted on Home</div>
          </div>
          <div className={`${styles.statIconWrap} ${styles.statPurple}`}>⚡</div>
        </div>
      </div>

      {/* Recent Orders Card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <span>🚚</span>
            <span>Recent Customer Orders</span>
          </div>
          <Link href="/admin/orders" className={`${styles.btnSm} ${styles.btnSecondary}`}>
            View All Orders →
          </Link>
        </div>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>Loading orders...</td>
                </tr>
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No customer orders placed yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map(order => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 700, color: '#2874f0' }}>#{order.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.address?.name || 'Customer'}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{order.address?.city || 'Bengaluru'}</div>
                    </td>
                    <td>{order.items?.length || 1} item(s)</td>
                    <td style={{ fontWeight: 700 }}>{formatPrice(order.totalAmount)}</td>
                    <td>
                      <span className={`${styles.badge} ${getStatusBadgeClass(order.status)}`}>
                        {order.status || 'Confirmed'}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '12px' }}>
                      {order.date ? new Date(order.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Today'}
                    </td>
                    <td>
                      <Link href="/admin/orders" className={`${styles.btnSm} ${styles.btnPrimary}`}>
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recently Added Products Card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <span>📦</span>
            <span>Recently Added Products</span>
          </div>
          <Link href="/admin/products" className={`${styles.btnSm} ${styles.btnSecondary}`}>
            View Full Catalog →
          </Link>
        </div>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price & MRP</th>
                <th>Deal</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>Loading products...</td>
                </tr>
              ) : recentProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No products found. Start by uploading one!
                  </td>
                </tr>
              ) : (
                recentProducts.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={p.images?.[0] || '/images/headphones.png'}
                          alt={p.name}
                          className={styles.productThumb}
                        />
                        <div>
                          <span className={styles.productMetaTitle}>{p.name}</span>
                          <span className={styles.productMetaBrand}>{p.brand}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles.badgeInfo}`}>{p.category}</span>
                    </td>
                    <td>
                      <span className={styles.priceTag}>{formatPrice(p.price)}</span>
                      {p.originalPrice > p.price && (
                        <span className={styles.mrpTag}>{formatPrice(p.originalPrice)}</span>
                      )}
                      {p.discount > 0 && (
                        <span className={styles.discountBadge} style={{ marginLeft: '6px' }}>{p.discount}% OFF</span>
                      )}
                    </td>
                    <td>
                      {p.isTopDeal ? (
                        <span className={`${styles.badge} ${styles.badgeDeal}`}>🔥 Top Deal</span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '11px' }}>Standard</span>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                        {p.stock !== undefined ? `${p.stock} in stock` : 'In Stock'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionBtnsRow}>
                        <Link href={`/product/${p.id}`} target="_blank" className={`${styles.btnSm} ${styles.btnSecondary}`}>
                          View
                        </Link>
                        <Link href="/admin/products" className={`${styles.btnSm} ${styles.btnPrimary}`}>
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

