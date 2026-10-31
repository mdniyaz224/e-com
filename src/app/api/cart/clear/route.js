import { NextResponse } from 'next/server';
import { saveCart } from '@/lib/dataStore';

export async function POST() {
  saveCart([]);
  return NextResponse.json({ success: true, cart: [] });
}

