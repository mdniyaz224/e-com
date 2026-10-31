'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { formatPrice } from '@/utils/formatPrice';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrderData = useCallback(async (isManual = false) => {
    if (!orderId) return;
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}`);
      if (!res.ok) throw new Error('Order not found');
      const data = await res.json();
      setOrder(data);
    } catch {
      if (!order) {
        // Fallback for demo if id not found
        setOrder({
          id: orderId,
          status: 'Confirmed',
          currentStep: 1,
          deliveryEstimate: 'Tomorrow by 2 PM',
          paymentMethod: 'UPI',
          totalAmount: 2499,
          savings: 4500,
          address: {
            name: 'Rahul Sharma',
            phone: '+91 98765 43210',
            address: 'Flat 402, Lotus Greens, 4th Cross, Koramangala',
            city: 'Bengaluru',
            pincode: '560034',
          },
          items: [],
        });
      }
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [orderId, order]);

  useEffect(() => {
    if (orderId) {
      fetchOrderData();

      // Poll every 2.5 seconds so admin updates show up immediately
      const interval = setInterval(() => {
        fetchOrderData();
      }, 2500);

      // Also refresh whenever user switches back to this tab
      const onFocus = () => fetchOrderData();
      window.addEventListener('focus', onFocus);

      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', onFocus);
      };
    } else {
      setLoading(false);
    }
  }, [orderId, fetchOrderData]);

  if (loading) {
    return (
      <div className={styles.successPage} style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p>Loading order details...</p>
      </div>
    );
  }

  const currentStep = order?.currentStep !== undefined ? order.currentStep : 1;
  const status = order?.status || 'Confirmed';

  const fillWidth =
    currentStep <= 1 ? '15%' :
    currentStep === 2 ? '48%' :
    currentStep === 3 ? '78%' : '100%';

  const getStatusBadgeStyle = () => {
    switch (status) {
      case 'Delivered': return { background: '#e8f5e9', color: '#2e7d32' };
      case 'Shipped': return { background: '#eff6ff', color: '#1d4ed8' };
      case 'Packed': return { background: '#fffbeb', color: '#b45309' };
      case 'Cancelled': return { background: '#fef2f2', color: '#b91c1c' };
      default: return { background: '#e8f5e9', color: '#2e7d32' };
    }
  };

  const steps = [
    { num: 1, label: 'Confirmed' },
    { num: 2, label: 'Packed' },
    { num: 3, label: 'Shipped' },
    { num: 4, label: 'Delivered' }
  ];

  return (
    <div className={styles.successPage}>
      {/* Top Banner with animated Checkmark */}
      <div className={styles.successHeader}>
        <div className={styles.checkmarkWrap}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h1 className={styles.successTitle}>
          {status === 'Delivered' ? 'Order Delivered!' : status === 'Shipped' ? 'Order On The Way!' : status === 'Packed' ? 'Order Packed & Ready!' : 'Order Placed Successfully!'}
        </h1>
        <p className={styles.successSub}>
          Thank you for shopping with PulseKart. Tracking updates are synchronized live with our fulfillment centers.
        </p>
      </div>

      {/* Main Order Card */}
      <div className={styles.orderCard}>
        <div className={styles.orderHeaderRow}>
          <div>
            <div style={{ fontSize: '11px', color: '#888' }}>ORDER ID</div>
            <div className={styles.orderIdText}>#{order?.id || orderId || 'PK-8924189'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => fetchOrderData(true)}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                color: '#334155'
              }}
              title="Refresh order status"
            >
              {isRefreshing ? 'Syncing...' : '🔄 Live'}
            </button>
            <span className={styles.orderStatusBadge} style={getStatusBadgeStyle()}>
              ✓ {status}
            </span>
          </div>
        </div>

        <div style={{ fontSize: '13px', color: '#333', marginBottom: '8px' }}>
          Estimated Delivery: <strong style={{ color: '#388e3c' }}>{order?.deliveryEstimate || 'Tomorrow by 2 PM'}</strong>
        </div>

        {/* Dynamic Stepper */}
        <div className={styles.stepperTrack}>
          <div className={styles.trackLine}>
            <div
              className={styles.trackLineFill}
              style={{ width: fillWidth, transition: 'width 0.4s ease' }}
            ></div>
          </div>
          {steps.map((s) => {
            const isCompleted = currentStep >= s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div key={s.num} className={styles.stepNode}>
                <div
                  className={`${styles.stepDot} ${isCompleted ? styles.stepDotActive : ''}`}
                  style={isCurrent ? { boxShadow: '0 0 0 4px rgba(56, 142, 60, 0.25)', fontWeight: 800 } : {}}
                >
                  {isCompleted ? '✓' : s.num}
                </div>
                <span className={`${styles.stepLabel} ${isCompleted ? styles.stepLabelActive : ''}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: '12px', color: '#777', borderTop: '1px solid #f0f0f0', paddingTop: '10px' }}>
          Payment via: <strong>{order?.paymentMethod || 'UPI (Google Pay)'}</strong> • Total Paid:{' '}
          <strong style={{ color: '#212121' }}>{formatPrice(order?.totalAmount || 0)}</strong>
        </div>
      </div>

      {/* Ordered Items Preview */}
      {order?.items && order.items.length > 0 && (
        <div className={styles.itemsSection}>
          <div className={styles.sectionHeading}>Ordered Items ({order.items.length})</div>
          {order.items.map((item, index) => (
            <div key={index} className={styles.orderItemRow}>
              <div className={styles.itemImgBox}>
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }}
                  />
                ) : (
                  '📦'
                )}
              </div>
              <div className={styles.itemInfo}>
                <div className={styles.itemTitle}>{item.name}</div>
                <div className={styles.itemMeta}>Qty: {item.quantity} • {item.color || 'Standard'}</div>
              </div>
              <div className={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Delivery Address Card */}
      {order?.address && (
        <div className={styles.addressCard}>
          <div className={styles.sectionHeading}>Delivery Address</div>
          <div className={styles.addressText}>
            <strong>{order.address.name}</strong> • {order.address.phone}
            <br />
            {order.address.address}, {order.address.city} - {order.address.pincode}
          </div>
        </div>
      )}

      {/* Action Navigation */}
      <div className={styles.actionButtonGroup}>
        <button
          className={styles.viewOrdersBtn}
          onClick={() => router.push('/orders')}
        >
          View in My Orders
        </button>
        <button
          className={styles.continueShoppingBtn}
          onClick={() => router.push('/')}
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px 20px', textAlign: 'center' }}>Loading...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
