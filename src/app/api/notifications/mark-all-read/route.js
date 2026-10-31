import { NextResponse } from 'next/server';
import { markAllNotificationsRead } from '@/lib/dataStore';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
};

export async function POST() {
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

export async function PATCH() {
  return POST();
}

export async function GET() {
  return POST();
}
