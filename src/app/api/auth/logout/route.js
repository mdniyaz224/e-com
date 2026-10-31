import { NextResponse } from 'next/server';
import { activeSessions } from '@/lib/dataStore';

export async function POST(request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    activeSessions.delete(token);
  }

  return NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });
}

