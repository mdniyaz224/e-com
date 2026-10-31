import { NextResponse } from 'next/server';
import { getNotifications, saveNotifications } from '@/lib/dataStore';

export async function PATCH(request, { params }) {
  const { id } = await params;
  const notifications = await getNotifications();
  const notif = notifications.find((n) => n.id === id);

  if (!notif) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }

  notif.read = true;
  await saveNotifications(notifications);

  const unreadCount = notifications.filter((n) => !n.read).length;
  return NextResponse.json({
    success: true,
    message: 'Notification marked as read',
    notification: notif,
    unreadCount,
  });
}

