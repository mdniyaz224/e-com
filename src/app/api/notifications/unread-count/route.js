import { NextResponse } from 'next/server';
import { getNotifications } from '@/lib/dataStore';

export async function GET() {
  const notifications = await getNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;
  return NextResponse.json(
    { unreadCount },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
      },
    }
  );
}
