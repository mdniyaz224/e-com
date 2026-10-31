import { NextResponse } from 'next/server';
import { getCart, saveCart } from '@/lib/dataStore';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    let cartItems = await getCart();
    cartItems = cartItems.filter((i) => String(i.id) !== String(id) && String(i.productId) !== String(id));
    saveCart(cartItems);

    return NextResponse.json({ success: true, cart: cartItems });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to remove item', details: err.message }, { status: 500 });
  }
}

export async function POST(request, context) {
  return DELETE(request, context);
}

