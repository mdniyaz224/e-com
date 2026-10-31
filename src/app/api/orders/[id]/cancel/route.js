import { NextResponse } from 'next/server';
import { getOrders, saveOrders, pushNotification } from '@/lib/dataStore';
import { attachOrderMeta } from '@/app/api/orders/route';

export async function POST(request, { params }) {
  const { id } = await params;
  const orders = await getOrders();
  const order = orders.find((o) => o.id === id);

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.status === 'Delivered') {
    return NextResponse.json(
      { error: 'Delivered orders cannot be cancelled. You can request a return.' },
      { status: 400 }
    );
  }

  order.status = 'Cancelled';
  order.currentStep = 0;
  order.updatedAt = new Date().toISOString();
  await saveOrders(orders);

  try {
    await pushNotification({
      title: `Order #${order.id} Cancelled`,
      desc: `Your cancellation request was completed. Any paid amount will be reversed within 2-3 business days.`,
      category: 'orders',
      orderId: order.id,
      link: `/orders/${order.id}`,
      image: order.items?.[0]?.image || '/images/headphones.png',
      icon: '✕',
      badgeColor: '#ef4444',
    });
  } catch (e) {
    console.error('Failed to emit cancel notification:', e);
  }

  return NextResponse.json({
    success: true,
    message: 'Order cancelled successfully',
    order: attachOrderMeta(order),
  });
}

