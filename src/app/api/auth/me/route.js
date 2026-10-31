import { NextResponse } from 'next/server';
import { getUser } from '@/lib/dataStore';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const user = await getUser();

  if (!token) {
    return NextResponse.json({
      isAuthenticated: false,
      user: null,
    });
  }

  return NextResponse.json({
    isAuthenticated: true,
    user,
  });
}

