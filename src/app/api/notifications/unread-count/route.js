import { NextResponse } from 'next/server';
import { getNotifications } from '@/lib/dataStore';

export async function GET() {
  const notifications = await getNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;
  return NextResponse.json({ unreadCount });
}

