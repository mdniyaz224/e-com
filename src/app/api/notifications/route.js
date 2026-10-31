import { NextResponse } from 'next/server';
import { getNotifications, saveNotifications } from '@/lib/dataStore';

// GET all notifications
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const unread = searchParams.get('unread');

  const notifications = await getNotifications();
  let filtered = [...notifications];

  if (category && category !== 'all') {
    filtered = filtered.filter((n) => n.category?.toLowerCase() === category.toLowerCase());
  }

  if (unread === 'true') {
    filtered = filtered.filter((n) => !n.read);
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return NextResponse.json({
    notifications: filtered,
    totalCount: notifications.length,
    unreadCount,
  });
}

// PATCH read-all alias
export async function PATCH() {
  const notifications = await getNotifications();
  notifications.forEach((n) => {
    n.read = true;
  });
  await saveNotifications(notifications);

  return NextResponse.json({
    success: true,
    message: 'All notifications marked as read',
    unreadCount: 0,
  });
}

