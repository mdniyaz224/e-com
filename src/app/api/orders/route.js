import { NextResponse } from 'next/server';
import { getOrders, saveOrders, pushNotification, getCart, saveCart } from '@/lib/dataStore';

export function attachOrderMeta(order) {
  const createdDate = order.date ? new Date(order.date) : new Date();
  const step = order.currentStep !== undefined ? order.currentStep : 1;
  const status = order.status || 'Confirmed';

  const dateStr = createdDate.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updatedDateStr = order.updatedAt
    ? new Date(order.updatedAt).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : dateStr;

  let timeline = [];
  if (status === 'Cancelled') {
    timeline = [
      {
        step: 1,
        status: 'Confirmed',
        title: 'Order Confirmed',
        desc: 'Your order was verified and confirmed with the seller',
        time: dateStr,
        completed: true,
      },
      {
        step: 0,
        status: 'Cancelled',
        title: 'Order Cancelled',
        desc: 'Order cancellation was requested and processed. Refund initiated.',
        time: updatedDateStr,
        completed: true,
        isCancelled: true,
      },
    ];
  } else {
    timeline = [
      {
        step: 1,
        status: 'Confirmed',
        title: 'Order Confirmed',
        desc: 'Order confirmed and inventory reserved from warehouse',
        time: dateStr,
        completed: step >= 1,
        isCurrent: step === 1,
      },
      {
        step: 2,
        status: 'Packed',
        title: 'Order Packed',
        desc: 'Seller packed items in secure tamper-evident packaging with invoice',
        time: step >= 2 ? updatedDateStr : 'Expected in few hours',
        completed: step >= 2,
        isCurrent: step === 2,
      },
      {
        step: 3,
        status: 'Shipped',
        title: 'Shipped',
        desc: `Handed over to ${order.courier || 'PulseKart Express Logistics'} (AWB: ${
          order.trackingNumber || 'PKEXP892174'
        })`,
        time: step >= 3 ? updatedDateStr : order.deliveryEstimate || 'Expected Tomorrow',
        completed: step >= 3,
        isCurrent: step === 3,
      },
      {
        step: 4,
        status: 'Delivered',
        title: 'Delivered',
        desc: 'Delivered to resident at customer delivery address',
        time: step >= 4 ? updatedDateStr : order.deliveryEstimate || 'Expected Tomorrow by 2 PM',
        completed: step >= 4,
        isCurrent: step === 4,
      },
    ];
  }

  return {
    ...order,
    trackingNumber: order.trackingNumber || 'PKEXP' + (order.id ? order.id.slice(-6) : '892147'),
    courier: order.courier || 'PulseKart Express Logistics',
    timeline,
  };
}

// GET all orders
export async function GET() {
  const orders = await getOrders();
  const enriched = orders.map(attachOrderMeta);
  return NextResponse.json({
    orders: enriched,
    count: enriched.length,
  });
}

// POST place order
export async function POST(request) {
  try {
    const body = await request.json();
    const { items, address, paymentMethod, totalAmount, savings } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cannot place order with empty items' }, { status: 400 });
    }

    const generatedId = 'OD' + Math.floor(10000000 + Math.random() * 90000000);
    const newOrder = {
      id: generatedId,
      date: new Date().toISOString(),
      status: 'Confirmed',
      currentStep: 1,
      deliveryEstimate: 'Tomorrow by 2 PM',
      trackingNumber: 'PKEXP' + generatedId.slice(-6),
      courier: 'PulseKart Express Logistics',
      items: items,
      address: address || {
        name: 'Rahul Sharma',
        phone: '+91 98765 43210',
        pincode: '560034',
        address: 'Flat 402, Lotus Greens, 4th Cross, Koramangala',
        city: 'Bengaluru',
        type: 'HOME',
      },
      paymentMethod: paymentMethod || 'Cash on Delivery',
      totalAmount: totalAmount || items.reduce((sum, i) => sum + i.price * (i.quantity || 1), 0),
      savings: savings || 0,
      updatedAt: new Date().toISOString(),
    };

    const orders = await getOrders();
    orders.unshift(newOrder);
    await saveOrders(orders);

    // Automatically remove ordered items from shopping cart
    try {
      const currentCart = await getCart();
      const orderedIds = new Set((items || []).map((i) => String(i.productId || i.id)));
      const remainingCart = currentCart.filter((i) => !orderedIds.has(String(i.productId || i.id)));
      await saveCart(remainingCart);
    } catch (cartErr) {
      console.warn('Failed to clear ordered items from cart:', cartErr.message);
    }

    try {
      await pushNotification({
        title: `Order #${newOrder.id} Placed Successfully!`,
        desc: `Your order containing ${newOrder.items.length} item(s) totaling ₹${newOrder.totalAmount} has been received.`,
        category: 'orders',
        orderId: newOrder.id,
        link: `/orders/${newOrder.id}`,
        image: newOrder.items?.[0]?.image || '/images/headphones.png',
        icon: '✓',
        badgeColor: '#2874f0',
      });
    } catch (e) {
      console.error('Failed to emit order notification:', e);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Order placed successfully',
        order: attachOrderMeta(newOrder),
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: 'Failed to place order', details: err.message }, { status: 500 });
  }
}

