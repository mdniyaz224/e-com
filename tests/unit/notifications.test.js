const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const API_BASE = 'http://localhost:5000/api/notifications';

describe('Notifications System & Real-Time Alert Engine', () => {
  let targetNotifId = null;

  it('1. should fetch all notifications and include unread count', async () => {
    const res = await fetch(API_BASE);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(data.notifications));
    assert.strictEqual(typeof data.unreadCount, 'number');

    if (data.notifications.length > 0) {
      targetNotifId = data.notifications[0].id;
    }
  });

  it('2. should fetch unread count via lightweight polling endpoint', async () => {
    const res = await fetch(`${API_BASE}/unread-count`);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(typeof data.unreadCount, 'number');
    assert.ok(data.unreadCount >= 0);
  });

  it('3. should mark a single notification as read', async () => {
    if (!targetNotifId) return;

    const res = await fetch(`${API_BASE}/${targetNotifId}/read`, {
      method: 'PATCH'
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.notification.read, true);
  });

  it('4. should mark all notifications as read via POST /api/notifications/mark-all-read', async () => {
    const res = await fetch(`${API_BASE}/mark-all-read`, {
      method: 'POST'
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.unreadCount, 0);

    // Verify unread count is 0 via polling endpoint
    const pollRes = await fetch(`${API_BASE}/unread-count`);
    const pollData = await pollRes.json();
    assert.strictEqual(pollData.unreadCount, 0);
  });
});

