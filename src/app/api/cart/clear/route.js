import { NextResponse } from 'next/server';
import { saveCart } from '@/lib/dataStore';

export async function DELETE() {
  await saveCart([]);
  return NextResponse.json({ success: true, cart: [] });
}

export async function POST() {
  return DELETE();
}

export async function GET() {
  return DELETE();
}
