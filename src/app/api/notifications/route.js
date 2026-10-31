import { NextResponse } from 'next/server';
import { getNotifications, markAllNotificationsRead, clearAllNotifications, pushNotification } from '@/lib/dataStore';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
};

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

  return NextResponse.json(
    {
      notifications: filtered,
      totalCount: notifications.length,
      unreadCount,
    },
    { headers: noCacheHeaders }
  );
}

// POST create notification or mark-all-read
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === 'mark-all-read' || body.markAllRead) {
      await markAllNotificationsRead();
      return NextResponse.json(
        {
          success: true,
          message: 'All notifications marked as read',
          unreadCount: 0,
        },
        { headers: noCacheHeaders }
      );
    }
    if (body.title) {
      const created = await pushNotification(body);
      return NextResponse.json(
        {
          success: true,
          message: 'Notification created',
          notification: created,
        },
        { status: 201, headers: noCacheHeaders }
      );
    }
    // Default fallback: mark all as read
    await markAllNotificationsRead();
    return NextResponse.json(
      {
        success: true,
        message: 'All notifications marked as read',
        unreadCount: 0,
      },
      { headers: noCacheHeaders }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: noCacheHeaders });
  }
}

// PATCH read-all alias
export async function PATCH() {
  await markAllNotificationsRead();
  return NextResponse.json(
    {
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0,
    },
    { headers: noCacheHeaders }
  );
}

// DELETE clear all notifications
export async function DELETE() {
  await clearAllNotifications();
  return NextResponse.json(
    {
      success: true,
      message: 'All notifications cleared',
      unreadCount: 0,
    },
    { headers: noCacheHeaders }
  );
}
