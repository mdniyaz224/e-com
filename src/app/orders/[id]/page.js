'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/utils/formatPrice';
import styles from '../orders.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function OrderDetailsPage({ params: paramsPromise }) {
  const router = useRouter();
  const params = use(paramsPromise);
  const orderId = params.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchOrder = useCallback(async (isManual = false) => {
    if (!orderId) return;
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}`);
      if (!res.ok) throw new Error('Order not found');
      const data = await res.json();
      setOrder(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();

    // Auto-sync every 8 seconds when tab is active
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchOrder();
      }
    }, 8000);

    const onFocus = () => fetchOrder();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchOrder]);

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setOrder(data.order);
        alert('Order cancelled successfully. Refund will be credited within 2-3 business days.');
      } else {
        alert(data.error || 'Failed to cancel order');
      }
    } catch (err) {
      console.error(err);
      alert('Error cancelling order');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.ordersContainer} style={{ textAlign: 'center', padding: '80px 20px' }}>
        <p style={{ color: '#64748b' }}>Loading order tracking details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.ordersContainer}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <div className={styles.emptyTitle}>Order #{orderId} Not Found</div>
          <div className={styles.emptySub}>
            The requested order could not be located in our fulfillment database.
          </div>
          <Link href="/orders" className={styles.trackBtnBig}>
            Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return '#10b981';
      case 'Shipped': return '#8b5cf6';
      case 'Packed': return '#f59e0b';
      case 'Cancelled': return '#ef4444';
      default: return '#2874f0';
    }
  };

  const statusColor = getStatusColor(order.status);
  const timeline = order.timeline || [];

  return (
    <div className={styles.ordersContainer}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/account">My Account</Link>
        <span>/</span>
        <Link href="/orders">My Orders</Link>
        <span>/</span>
        <span style={{ color: '#0f172a', fontWeight: 600 }}>#{order.id}</span>
      </div>

      {/* Header Card */}
      <div className={styles.detailsHeaderCard}>
        <div className={styles.detailsHeaderInfo}>
          <h2>Order #{order.id}</h2>
          <p>
            Placed on{' '}
            {order.date
              ? new Date(order.date).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Recent'}{' '}
            • {order.items?.length || 1} Item(s)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => fetchOrder(true)}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              color: '#334155'
            }}
          >
            {isRefreshing ? 'Syncing...' : '🔄 Live'}
          </button>

          <span
            style={{
              background: `${statusColor}18`,
              color: statusColor,
              border: `1px solid ${statusColor}40`,
              fontWeight: 800,
              fontSize: '13px',
              padding: '6px 14px',
              borderRadius: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }}></span>
            {order.status || 'Confirmed'}
          </span>
        </div>
      </div>

      {/* Live Tracking Timeline Card */}
      <div className={styles.trackingCard}>
        <div className={styles.trackingCardHeader}>
          <div className={styles.trackingTitle}>
            <span>🚚</span>
            <span>Shipment Tracking & Progress</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Courier: <strong>{order.courier || 'PulseKart Express'}</strong> (AWB: {order.trackingNumber})
          </div>
        </div>

        {/* Flipkart / Amazon Vertical Stepper Timeline */}
        <div className={styles.timeline}>
          {timeline.map((item, index) => {
            return (
              <div
                key={index}
                className={`${styles.timelineItem} ${
                  item.completed ? styles.timelineItemCompleted : ''
                }`}
              >
                <div
                  className={`${styles.timelineNode} ${
                    item.isCancelled
                      ? styles.timelineNodeCompleted
                      : item.completed
                      ? styles.timelineNodeCompleted
                      : item.isCurrent
                      ? styles.timelineNodeCurrent
                      : ''
                  }`}
                  style={item.isCancelled ? { background: '#ef4444', borderColor: '#ef4444' } : {}}
                >
                  {item.isCancelled ? '✕' : item.completed ? '✓' : item.step || index + 1}
                </div>

                <div className={styles.timelineContent}>
                  <div className={styles.timelineHeading}>
                    <span style={item.completed ? { color: '#0f172a' } : { color: '#64748b' }}>
                      {item.title}
                    </span>
                    <span className={styles.timelineTime}>{item.time}</span>
                  </div>
                  <div className={styles.timelineDesc}>{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Details Grid */}
      <div className={styles.detailsGrid}>
        {/* Left Column: Items List */}
        <div>
          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>
              <span>📦</span>
              <span>Items in this Order ({order.items?.length || 0})</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {order.items?.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: '14px',
                    paddingBottom: '14px',
                    borderBottom: idx < order.items.length - 1 ? '1px solid #f1f5f9' : 'none'
                  }}
                >
                  <img
                    src={item.image || '/images/headphones.png'}
                    alt={item.name}
                    style={{
                      width: '72px',
                      height: '72px',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      padding: '4px'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', marginBottom: '4px' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                      Quantity: <strong>{item.quantity || 1}</strong> • Color: {item.color || 'Standard'}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
                      {formatPrice(item.price * (item.quantity || 1))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address Card */}
          {order.address && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionTitle}>
                <span>📍</span>
                <span>Delivery Address</span>
              </div>
              <div className={styles.addressBox}>
                <strong style={{ color: '#0f172a', fontSize: '14px' }}>{order.address.name}</strong>
                <div>{order.address.address}</div>
                <div>
                  {order.address.city} - {order.address.pincode}
                </div>
                <div style={{ marginTop: '6px', color: '#64748b' }}>
                  Phone: <strong>{order.address.phone}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Payment & Actions */}
        <div>
          {/* Payment & Price Card */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>
              <span>💳</span>
              <span>Price & Payment Summary</span>
            </div>

            <div className={styles.priceSummaryRow}>
              <span>Items Total</span>
              <span>{formatPrice(order.totalAmount + (order.savings || 0))}</span>
            </div>

            {order.savings > 0 && (
              <div className={styles.priceSummaryRow} style={{ color: '#16a34a', fontWeight: 600 }}>
                <span>Discount / Savings</span>
                <span>- {formatPrice(order.savings)}</span>
              </div>
            )}

            <div className={styles.priceSummaryRow}>
              <span>Delivery Charges</span>
              <span style={{ color: '#16a34a', fontWeight: 700 }}>FREE</span>
            </div>

            <div className={styles.priceTotalRow}>
              <span>Total Paid</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>

            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
              Payment Method: <strong>{order.paymentMethod || 'Cash on Delivery'}</strong>
            </div>
          </div>

          {/* Actions Card */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>
              <span>⚡</span>
              <span>Order Actions</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                href={`/orders/${order.id}/invoice`}
                target="_blank"
                style={{
                  width: '100%',
                  padding: '11px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxSizing: 'border-box',
                  textDecoration: 'none',
                  transition: 'background 0.15s'
                }}
              >
                <span>📄</span>
                <span>Download / Print Tax Invoice</span>
              </Link>

              {['Confirmed', 'Packed'].includes(order.status) && (
                <button
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className={styles.cancelBtn}
                  style={{ width: '100%', textAlign: 'center', padding: '10px' }}
                >
                  {isCancelling ? 'Cancelling Order...' : '✕ Cancel This Order'}
                </button>
              )}

              <Link
                href="/"
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#eff6ff',
                  color: '#2874f0',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  textAlign: 'center',
                  boxSizing: 'border-box',
                  textDecoration: 'none'
                }}
              >
                Buy More Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

