import { NextResponse } from 'next/server';
import { getNotifications, saveNotifications } from '@/lib/dataStore';

export async function POST() {
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

export async function PATCH() {
  return POST();
}

