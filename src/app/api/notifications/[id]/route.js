import { NextResponse } from 'next/server';
import { getNotifications, deleteNotificationById } from '@/lib/dataStore';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
};

export async function GET(request, { params }) {
  const { id } = await params;
  const notifications = await getNotifications();
  const notif = notifications.find((n) => n.id === id);

  if (!notif) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404, headers: noCacheHeaders });
  }

  return NextResponse.json(notif, { headers: noCacheHeaders });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const remaining = await deleteNotificationById(id);
  const unreadCount = remaining.filter((n) => !n.read).length;

  return NextResponse.json(
    {
      success: true,
      message: 'Notification deleted',
      unreadCount,
    },
    { headers: noCacheHeaders }
  );
}
