import { NextResponse } from 'next/server';
import { getCart, saveCart } from '@/lib/dataStore';

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id') || searchParams.get('productId');

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id || body.productId;
    }

    let cartItems = await getCart();
    if (id) {
      cartItems = cartItems.filter((i) => String(i.id) !== String(id) && String(i.productId) !== String(id));
      await saveCart(cartItems);
    }

    return NextResponse.json({ success: true, cart: cartItems });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to remove item', details: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  return DELETE(request);
}
