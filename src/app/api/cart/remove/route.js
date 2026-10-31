import { NextResponse } from 'next/server';
import { getCart, saveCart } from '@/lib/dataStore';

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    let cartItems = await getCart();
    cartItems = cartItems.filter((i) => i.id !== id);
    saveCart(cartItems);

    return NextResponse.json({ success: true, cart: cartItems });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to remove item', details: err.message }, { status: 500 });
  }
}

