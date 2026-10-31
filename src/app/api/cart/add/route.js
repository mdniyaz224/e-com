import { NextResponse } from 'next/server';
import { getCart, saveCart } from '@/lib/dataStore';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      productId,
      name,
      image,
      price,
      originalPrice,
      discount,
      seller,
      color,
      quantity,
      isAssured,
      deliveryBy,
    } = body;

    let cartItems = await getCart();
    const existing = cartItems.find((item) => item.productId === productId && item.color === color);

    if (existing) {
      existing.quantity += quantity || 1;
    } else {
      cartItems.push({
        id: cartItems.length + 1,
        productId,
        name,
        image,
        price,
        originalPrice,
        discount,
        seller,
        color,
        quantity: quantity || 1,
        isAssured: isAssured || false,
        deliveryBy: deliveryBy || '3-5 days',
        deliveryFree: true,
      });
    }

    await saveCart(cartItems);
    return NextResponse.json({ success: true, cart: cartItems });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to add item to cart', details: err.message }, { status: 500 });
  }
}

