import { NextResponse } from 'next/server';
import { getCart } from '@/lib/dataStore';

export async function GET() {
  const cartItems = await getCart();
  const subtotal = cartItems.reduce((sum, item) => sum + (item.originalPrice || item.price) * item.quantity, 0);
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = subtotal - total;
  const superCoinSavings = 100;
  const couponDiscount = 200;
  const deliveryCharge = 0;

  return NextResponse.json({
    items: cartItems,
    itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    priceDetails: {
      subtotal,
      discount,
      superCoinSavings,
      couponCode: 'PULSEFIRST',
      couponDiscount,
      protectFee: 0,
      deliveryCharge,
      deliveryOriginal: 80,
      total: Math.max(0, total - superCoinSavings - couponDiscount + deliveryCharge),
      totalSavings: discount + superCoinSavings + couponDiscount,
    },
  });
}

