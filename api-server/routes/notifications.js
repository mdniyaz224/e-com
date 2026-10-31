const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const notifFilePath = path.resolve(__dirname, '../data/notifications.json');

// In-memory notifications store loaded from disk
let notifications = [];
try {
  if (fs.existsSync(notifFilePath)) {
    const raw = fs.readFileSync(notifFilePath, 'utf-8');
    notifications = JSON.parse(raw);
  } else {
    notifications = [];
  }
} catch (err) {
  console.error('Error loading notifications.json:', err);
  notifications = [];
}

// Persist helper
function saveNotificationsToFile() {
  try {
    fs.writeFileSync(notifFilePath, JSON.stringify(notifications, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to write notifications.json:', err);
    return false;
  }
}

// Helper to push a new notification programmatically (from orders, products, etc.)
function pushNotification(notif) {
  const newNotif = {
    id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    title: notif.title || 'PulseKart Alert',
    desc: notif.desc || '',
    category: notif.category || 'orders', // 'orders' | 'offers' | 'rewards' | 'system'
    orderId: notif.orderId || null,
    link: notif.link || '/notifications',
    image: notif.image || null,
    icon: notif.icon || '🔔',
    badgeColor: notif.badgeColor || '#2874f0',
    read: false,
    createdAt: new Date().toISOString()
  };

  notifications.unshift(newNotif);
  saveNotificationsToFile();
  return newNotif;
}

// GET all notifications (supports ?category=orders|offers|rewards&unread=true)
router.get('/', (req, res) => {
  const { category, unread } = req.query;
  let filtered = [...notifications];

  if (category && category !== 'all') {
    filtered = filtered.filter(n => n.category?.toLowerCase() === category.toLowerCase());
  }

  if (unread === 'true') {
    filtered = filtered.filter(n => !n.read);
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  res.json({
    notifications: filtered,
    totalCount: notifications.length,
    unreadCount: unreadCount
  });
});

// GET unread count only (lightweight badge query)
router.get('/unread-count', (req, res) => {
  const unreadCount = notifications.filter(n => !n.read).length;
  res.json({ unreadCount });
});

// PATCH mark single notification as read
router.patch('/:id/read', (req, res) => {
  const notif = notifications.find(n => n.id === req.params.id);
  if (!notif) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  notif.read = true;
  saveNotificationsToFile();

  const unreadCount = notifications.filter(n => !n.read).length;
  res.json({
    success: true,
    message: 'Notification marked as read',
    notification: notif,
    unreadCount
  });
});

// PATCH / POST mark all as read
const markAllAsReadHandler = (req, res) => {
  notifications.forEach(n => {
    n.read = true;
  });
  saveNotificationsToFile();

  res.json({
    success: true,
    message: 'All notifications marked as read',
    unreadCount: 0
  });
};

router.patch('/read-all', markAllAsReadHandler);
router.post('/mark-all-read', markAllAsReadHandler);

// POST manually create a notification (e.g. from admin or external action)
router.post('/', (req, res) => {
  const { title, desc, category, link, icon, badgeColor, orderId, image } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const created = pushNotification({
    title,
    desc,
    category,
    link,
    icon,
    badgeColor,
    orderId,
    image
  });

  res.status(201).json({
    success: true,
    message: 'Notification created',
    notification: created
  });
});

// DELETE single notification
router.delete('/:id', (req, res) => {
  const index = notifications.findIndex(n => n.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  notifications.splice(index, 1);
  saveNotificationsToFile();

  const unreadCount = notifications.filter(n => !n.read).length;
  res.json({
    success: true,
    message: 'Notification removed',
    unreadCount
  });
});

// DELETE clear all notifications
router.delete('/', (req, res) => {
  notifications = [];
  saveNotificationsToFile();

  res.json({
    success: true,
    message: 'All notifications cleared',
    unreadCount: 0
  });
});

module.exports = router;
module.exports.pushNotification = pushNotification;

