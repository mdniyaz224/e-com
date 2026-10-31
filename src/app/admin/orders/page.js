'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/utils/formatPrice';
import styles from '../admin.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/orders`);
      const data = await res.json();
      setOrders(data?.orders || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Update order status handler
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();

      if (res.ok && data.order) {
        setOrders(prev =>
          prev.map(o => (o.id === orderId ? data.order : o))
        );
        showToast(`Order #${orderId} marked as ${newStatus}!`);
      } else {
        showToast(data.error || 'Failed to update order status', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while updating status', 'error');
    }
  };

  // Delete order
  const handleDeleteOrder = async (orderId) => {
    if (!confirm(`Delete order #${orderId}?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        showToast(`Order #${orderId} deleted successfully`);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to delete order', 'error');
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(o => {
    let matchSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      matchSearch =
        (o.id && o.id.toLowerCase().includes(q)) ||
        (o.address?.name && o.address.name.toLowerCase().includes(q)) ||
        (o.address?.city && o.address.city.toLowerCase().includes(q)) ||
        (o.address?.phone && o.address.phone.toLowerCase().includes(q));
    }

    let matchStatus = true;
    if (selectedStatus) {
      matchStatus = o.status?.toLowerCase() === selectedStatus.toLowerCase();
    }

    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status) => {
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
      {/* Toast Alert */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Info */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Customer Orders & Fulfillment</h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Manage incoming purchase orders, update shipping progress, and review delivery addresses.
          </p>
        </div>
        <button onClick={loadOrders} className={`${styles.btnSm} ${styles.btnSecondary}`}>
          🔄 Refresh Orders
        </button>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchInputWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by Order ID, Customer name, Phone, or City..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className={styles.selectInput}
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">All Statuses ({orders.length})</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Packed">Packed</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <span>🚚</span>
            <span>Orders List ({filteredOrders.length})</span>
          </div>
        </div>

        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order ID & Date</th>
                <th>Customer & Address</th>
                <th>Purchased Items</th>
                <th>Total & Payment</th>
                <th>Fulfillment Status</th>
                <th>Update Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>
                    Loading customer orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📦</div>
                    <p>No orders found matching your search.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#2874f0' }}>#{order.id}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {order.date ? new Date(order.date).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Recent'}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>{order.address?.name || 'Customer'}</div>
                      <div style={{ fontSize: '11px', color: '#475569' }}>
                        {order.address?.phone || ''}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', maxWidth: '200px' }}>
                        {order.address?.address}, {order.address?.city} ({order.address?.pincode})
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {order.items?.map((item, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img
                              src={item.image || '/images/headphones.png'}
                              alt={item.name}
                              style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '4px', background: '#f8fafc' }}
                            />
                            <div style={{ fontSize: '12px' }}>
                              <span style={{ fontWeight: 600 }}>{item.quantity}x</span> {item.name?.slice(0, 24)}...
                              <div style={{ fontSize: '10px', color: '#64748b' }}>
                                {formatPrice(item.price)} each
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
                        {formatPrice(order.totalAmount)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {order.paymentMethod || 'Cash on Delivery'}
                      </div>
                      {order.savings > 0 && (
                        <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 600 }}>
                          Saved {formatPrice(order.savings)}
                        </div>
                      )}
                    </td>

                    <td>
                      <span className={`${styles.badge} ${getStatusBadge(order.status)}`}>
                        {order.status || 'Confirmed'}
                      </span>
                    </td>

                    <td>
                      <select
                        className={styles.selectInput}
                        style={{ padding: '6px 10px', fontSize: '12px', fontWeight: 600 }}
                        value={order.status || 'Confirmed'}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      >
                        <option value="Confirmed">✓ Confirmed</option>
                        <option value="Packed">📦 Packed</option>
                        <option value="Shipped">🚚 Shipped</option>
                        <option value="Delivered">🎉 Delivered</option>
                        <option value="Cancelled">❌ Cancelled</option>
                      </select>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Link
                          href={`/orders/${order.id}/invoice`}
                          target="_blank"
                          className={`${styles.btnSm} ${styles.btnSecondary}`}
                          title="View Official Tax Invoice"
                        >
                          📄 Invoice
                        </Link>
                        <button
                          className={`${styles.btnSm} ${styles.btnDanger}`}
                          onClick={() => handleDeleteOrder(order.id)}
                          title="Delete Order"
                        >
                          🗑️
                        </button>
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

