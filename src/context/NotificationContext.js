'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NotificationContext = createContext();

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch all notifications from server
  const fetchNotifications = useCallback(async (category = 'all') => {
    try {
      const url = category && category !== 'all'
        ? `${API_URL}/api/notifications?category=${category}&_t=${Date.now()}`
        : `${API_URL}/api/notifications?_t=${Date.now()}`;

      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Lightweight unread counter check for background polling
  const checkUnreadCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/unread-count?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // ignore transient poll error
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Live background polling when tab is active (every 12s)
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkUnreadCount();
      }
    }, 12000);

    const onFocus = () => {
      fetchNotifications();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchNotifications, checkUnreadCount]);

  // Mark single as read
  const markAsRead = useCallback(async (id) => {
    // Optimistic UI update
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PATCH'
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      const res = await fetch(`${API_URL}/api/notifications/mark-all-read`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.unreadCount === 'number') {
          setUnreadCount(data.unreadCount);
        }
      } else {
        await fetch(`${API_URL}/api/notifications/read-all`, {
          method: 'PATCH'
        });
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  // Delete single notification
  const deleteNotification = useCallback(async (id) => {
    const target = notifications.find(n => n.id === id);
    const wasUnread = target && !target.read;

    setNotifications(prev => prev.filter(n => n.id !== id));
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, [notifications]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);

    try {
      await fetch(`${API_URL}/api/notifications`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

