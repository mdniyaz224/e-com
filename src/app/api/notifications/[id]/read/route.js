import { NextResponse } from 'next/server';
import { markNotificationRead, getNotifications } from '@/lib/dataStore';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
};

export async function PATCH(request, { params }) {
  const { id } = await params;
  const notif = await markNotificationRead(id);

  if (!notif) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404, headers: noCacheHeaders });
  }

  const notifications = await getNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return NextResponse.json(
    {
      success: true,
      message: 'Notification marked as read',
      notification: notif,
      unreadCount,
    },
    { headers: noCacheHeaders }
  );
}

export async function POST(request, context) {
  return PATCH(request, context);
}
