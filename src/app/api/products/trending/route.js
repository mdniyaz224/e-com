import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/dataStore';

export async function GET() {
  const products = await getProducts();
  const trending = products.filter((p) => p.trendingTag);
  return NextResponse.json(trending);
}

