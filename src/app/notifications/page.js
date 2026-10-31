'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';
import styles from './page.module.css';

// Helper for human-friendly relative time
function formatRelativeTime(dateString) {
  if (!dateString) return 'Recent';
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'orders' | 'offers' | 'rewards'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications(activeTab === 'unread' ? 'all' : activeTab);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleCardClick = (notification, e) => {
    // If clicking a direct button inside, let it handle its own event
    if (e.target.closest('button')) return;

    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      clearAllNotifications();
    }
  };

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.read;
    return n.category?.toLowerCase() === activeTab.toLowerCase();
  });

  const ordersCount = notifications.filter((n) => n.category === 'orders').length;
  const offersCount = notifications.filter((n) => n.category === 'offers').length;
  const rewardsCount = notifications.filter((n) => n.category === 'rewards').length;

  const getActionLabel = (notif) => {
    if (notif.category === 'orders') return 'Track Shipment →';
    if (notif.category === 'offers') return 'View Deal →';
    if (notif.category === 'rewards') return 'View Rewards →';
    return 'View Details →';
  };

  return (
    <div className={styles.notificationsContainer}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/account">My Account</Link>
        <span>/</span>
        <span style={{ color: '#0f172a', fontWeight: 600 }}>Notifications</span>
      </div>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTitleWrap}>
          <h1 className={styles.pageTitle}>🔔 Notifications</h1>
          {unreadCount > 0 ? (
            <span className={styles.unreadPill}>
              {unreadCount} Unread
            </span>
          ) : (
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '3px 10px', borderRadius: '20px', border: '1px solid #bbf7d0' }}>
              ✓ All Caught Up
            </span>
          )}
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={handleRefresh}
            className={styles.actionBtn}
            title="Sync latest notifications"
          >
            <span>{isRefreshing ? 'Syncing...' : '🔄 Live Sync'}</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className={styles.actionBtn}
              title="Mark all notifications as read"
            >
              <span>✓✓ Mark all read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
              title="Clear all notification history"
            >
              <span>🗑️ Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={styles.tabsBar}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
          onClick={() => handleTabChange('all')}
        >
          <span>All Alerts</span>
          <span className={styles.tabBadge}>{notifications.length}</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'unread' ? styles.tabBtnActive : ''}`}
          onClick={() => handleTabChange('unread')}
        >
          <span>🔴 Unread</span>
          <span
            style={{
              background: unreadCount > 0 ? '#ef4444' : '#64748b',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '10px',
              marginLeft: '4px',
            }}
          >
            {unreadCount}
          </span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'orders' ? styles.tabBtnActive : ''}`}
          onClick={() => handleTabChange('orders')}
        >
          <span>📦 Orders</span>
          <span className={styles.tabBadge}>{ordersCount}</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'offers' ? styles.tabBtnActive : ''}`}
          onClick={() => handleTabChange('offers')}
        >
          <span>🏷️ Deals</span>
          <span className={styles.tabBadge}>{offersCount}</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'rewards' ? styles.tabBtnActive : ''}`}
          onClick={() => handleTabChange('rewards')}
        >
          <span>🪙 Rewards</span>
          <span className={styles.tabBadge}>{rewardsCount}</span>
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '12px' }}>
          <p style={{ color: '#64748b' }}>Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎉</div>
          <div className={styles.emptyTitle}>You&apos;re All Caught Up!</div>
          <div className={styles.emptyDesc}>
            {activeTab === 'all'
              ? 'No new notifications right now. Order milestones, price drops, and reward alerts will appear here.'
              : `No alerts found under ${activeTab.toUpperCase()}. Check other tabs or explore our top offers.`}
          </div>
          <Link href="/" className={styles.shopBtn}>
            Explore Top Deals
          </Link>
        </div>
      ) : (
        <div className={styles.list}>
          {filteredNotifications.map((notif, index) => {
            const isUnread = !notif.read;
            const uniqueKey = notif.id ? `${notif.id}-${index}` : `notif-${index}`;
            return (
              <div
                key={uniqueKey}
                className={`${styles.card} ${isUnread ? styles.cardUnread : ''}`}
                onClick={(e) => handleCardClick(notif, e)}
                style={{ cursor: notif.link ? 'pointer' : 'default' }}
              >
                {/* Icon Wrap */}
                <div
                  className={styles.iconWrap}
                  style={{
                    backgroundColor: `${notif.badgeColor || '#2874f0'}15`,
                    color: notif.badgeColor || '#2874f0'
                  }}
                >
                  {notif.icon || '🔔'}
                </div>

                {/* Content Area */}
                <div className={styles.contentArea}>
                  <div className={styles.cardHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={styles.categoryTag}>
                        {notif.category || 'Alert'}
                      </span>
                      {isUnread ? (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '1px 6px', borderRadius: '4px' }}>
                          ● New
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px' }}>
                          ✓ Read
                        </span>
                      )}
                    </div>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => deleteNotification(notif.id)}
                      title="Delete notification"
                      aria-label="Delete"
                    >
                      ✕
                    </button>
                  </div>

                  <div className={styles.title}>{notif.title}</div>
                  <div className={styles.desc}>{notif.desc}</div>

                  {/* Thumbnail Row if attached */}
                  {notif.image && (
                    <div className={styles.thumbRow}>
                      <img
                        src={notif.image}
                        alt="Product preview"
                        className={styles.thumbImg}
                      />
                      {notif.orderId && (
                        <span className={styles.thumbText}>
                          Order #{notif.orderId}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer & Actions */}
                  <div className={styles.cardFooter}>
                    <div className={styles.time}>
                      <span>🕒</span>
                      <span>{formatRelativeTime(notif.createdAt)}</span>
                    </div>

                    <div className={styles.actionLinks}>
                      {isUnread && (
                        <button
                          className={styles.markReadBtn}
                          onClick={() => markAsRead(notif.id)}
                        >
                          ✓ Mark as read
                        </button>
                      )}

                      {notif.link && (
                        <Link
                          href={notif.link}
                          className={styles.primaryActionLink}
                          onClick={() => {
                            if (isUnread) markAsRead(notif.id);
                          }}
                        >
                          {getActionLabel(notif)}
                        </Link>
                      )}
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
