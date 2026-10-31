import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/dataStore';

export async function GET() {
  const products = await getProducts();
  const deals = products.filter((p) => p.isTopDeal || (p.discount && p.discount >= 50));
  return NextResponse.json(deals);
}

