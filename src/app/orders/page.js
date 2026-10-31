'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/utils/formatPrice';
import styles from './orders.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function MyOrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, openAuthModal } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'on_the_way' | 'delivered' | 'cancelled'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrders = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch(`${API_URL}/api/orders`);
      const data = await res.json();
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setIsRefreshing(false), 500);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    // Live background polling every 8 seconds when tab is active
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchOrders();
      }
    }, 8000);

    const onFocus = () => fetchOrders();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchOrders]);

  // Filter orders based on active tab & search
  const filteredOrders = orders.filter((o) => {
    // Search query filter
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const hasItem = o.items?.some(it => it.name?.toLowerCase().includes(q));
      matchesSearch =
        (o.id && o.id.toLowerCase().includes(q)) ||
        (o.address?.name && o.address.name.toLowerCase().includes(q)) ||
        hasItem;
    }

    // Status tab filter
    let matchesTab = true;
    if (activeTab === 'on_the_way') {
      matchesTab = ['Confirmed', 'Packed', 'Shipped'].includes(o.status);
    } else if (activeTab === 'delivered') {
      matchesTab = o.status === 'Delivered';
    } else if (activeTab === 'cancelled') {
      matchesTab = o.status === 'Cancelled';
    }

    return matchesSearch && matchesTab;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return '#10b981'; // Green
      case 'Shipped': return '#8b5cf6';   // Purple
      case 'Packed': return '#f59e0b';    // Amber
      case 'Cancelled': return '#ef4444'; // Red
      default: return '#2874f0';          // Blue (Confirmed)
    }
  };

  const getStatusHeadline = (order) => {
    switch (order.status) {
      case 'Delivered':
        return `Delivered ${order.deliveryEstimate?.toLowerCase().includes('delivered') ? order.deliveryEstimate : 'on ' + new Date(order.updatedAt || order.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`;
      case 'Shipped':
        return `Shipped • Expected ${order.deliveryEstimate || 'Tomorrow'}`;
      case 'Packed':
        return `Item Packed • Ready for dispatch`;
      case 'Cancelled':
        return `Order Cancelled • Refund Processed`;
      default:
        return `Order Confirmed • Expected ${order.deliveryEstimate || 'Tomorrow by 2 PM'}`;
    }
  };

  if (!isAuthenticated && !isAuthLoading) {
    return (
      <div className={styles.ordersContainer}>
        <div style={{ maxWidth: '480px', margin: '40px auto', background: '#fff', padding: '36px 24px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
            Login to view your orders
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
            Please log in with your mobile number or email to access your order history, track active shipments, and download tax invoices.
          </p>
          <button
            onClick={() => openAuthModal('login', '/orders')}
            style={{
              width: '100%',
              background: '#fb641b',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '13px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            LOGIN TO PULSEKART
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.ordersContainer}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/account">My Account</Link>
        <span>/</span>
        <span style={{ color: '#0f172a', fontWeight: 600 }}>My Orders</span>
      </div>

      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>
          <span>📦 My Orders</span>
          <span className={styles.orderCountBadge}>{orders.length} Orders</span>
        </div>

        <button
          onClick={() => fetchOrders(true)}
          style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '8px 14px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#334155'
          }}
        >
          <span>{isRefreshing ? 'Syncing...' : '🔄 Live Sync'}</span>
        </button>
      </div>

      {/* Search & Filter Tabs */}
      <div className={styles.filterRow}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search all orders by product title, brand or Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.tabsBar}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Orders ({orders.length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'on_the_way' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('on_the_way')}
          >
            On the way ({orders.filter(o => ['Confirmed', 'Packed', 'Shipped'].includes(o.status)).length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'delivered' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('delivered')}
          >
            Delivered ({orders.filter(o => o.status === 'Delivered').length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'cancelled' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            Cancelled ({orders.filter(o => o.status === 'Cancelled').length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '12px' }}>
          <p style={{ color: '#64748b' }}>Loading your orders history...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🛍️</div>
          <div className={styles.emptyTitle}>
            {searchQuery ? 'No matching orders found' : 'No orders in this category'}
          </div>
          <div className={styles.emptySub}>
            {searchQuery
              ? `We couldn't find any orders matching "${searchQuery}".`
              : 'Browse our catalog and enjoy the best deals on PulseKart!'}
          </div>
          <Link href="/" className={styles.trackBtnBig}>
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {filteredOrders.map((order) => {
            const statusColor = getStatusColor(order.status);
            return (
              <div key={order.id} className={styles.orderCard}>
                {/* Header Row */}
                <div className={styles.orderCardHeader}>
                  <div className={styles.headerMetaCol}>
                    <span className={styles.headerMetaLabel}>ORDER PLACED</span>
                    <span className={styles.headerMetaVal}>
                      {order.date
                        ? new Date(order.date).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : 'Recent'}
                    </span>
                  </div>

                  <div className={styles.headerMetaCol}>
                    <span className={styles.headerMetaLabel}>TOTAL</span>
                    <span className={styles.headerMetaVal}>{formatPrice(order.totalAmount)}</span>
                  </div>

                  <div className={styles.headerMetaCol}>
                    <span className={styles.headerMetaLabel}>SHIP TO</span>
                    <span className={styles.headerMetaVal}>
                      {order.address?.name || 'Customer'}
                    </span>
                  </div>

                  <div className={styles.headerMetaCol} style={{ textAlign: 'right' }}>
                    <span className={styles.headerMetaLabel}>ORDER #</span>
                    <span className={styles.headerMetaVal} style={{ color: '#2874f0' }}>
                      {order.id}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className={styles.orderCardBody}>
                  {/* Items Column */}
                  <div className={styles.itemsCol}>
                    {order.items?.map((item, i) => (
                      <div key={i} className={styles.itemRow}>
                        <img
                          src={item.image || '/images/headphones.png'}
                          alt={item.name}
                          className={styles.itemThumb}
                        />
                        <div className={styles.itemDetails}>
                          <Link href={`/orders/${order.id}`} className={styles.itemName}>
                            {item.name}
                          </Link>
                          <div className={styles.itemSub}>
                            <span>Qty: {item.quantity || 1}</span>
                            <span>•</span>
                            <span>{formatPrice(item.price)} each</span>
                            {item.color && (
                              <>
                                <span>•</span>
                                <span>Color: {item.color}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Status & Actions Column */}
                  <div className={styles.statusCol}>
                    <div className={styles.statusIndicatorBig} style={{ color: statusColor }}>
                      <span
                        className={styles.statusDotPulse}
                        style={{ backgroundColor: statusColor }}
                      ></span>
                      <span>{getStatusHeadline(order)}</span>
                    </div>

                    <div className={styles.statusDesc}>
                      {order.status === 'Delivered'
                        ? 'Your item has been delivered'
                        : order.status === 'Cancelled'
                        ? 'Order was cancelled and payment reversed'
                        : 'Your package is on its way'}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                      <Link href={`/orders/${order.id}`} className={styles.trackBtnBig}>
                        <span>Track Package</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

