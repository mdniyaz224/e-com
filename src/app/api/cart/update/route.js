import { NextResponse } from 'next/server';
import { getCart, saveCart } from '@/lib/dataStore';

export async function PUT(request) {
  try {
    const { id, quantity } = await request.json();
    let cartItems = await getCart();
    const item = cartItems.find((i) => i.id === id);

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (quantity <= 0) {
      cartItems = cartItems.filter((i) => i.id !== id);
    } else {
      item.quantity = quantity;
    }

    await saveCart(cartItems);
    return NextResponse.json({ success: true, cart: cartItems });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update item quantity', details: err.message }, { status: 500 });
  }
}

