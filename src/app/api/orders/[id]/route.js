import { NextResponse } from 'next/server';
import { getOrders, saveOrders, pushNotification } from '@/lib/dataStore';
import { attachOrderMeta } from '@/app/api/orders/route';

// GET single order by id
export async function GET(request, { params }) {
  const { id } = await params;
  const orders = await getOrders();
  const order = orders.find((o) => o.id === id);

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json(attachOrderMeta(order));
}

// PUT / PATCH update order status
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;
    const orders = await getOrders();
    const order = orders.find((o) => o.id === id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const statusMap = {
      Confirmed: 1,
      Packed: 2,
      Shipped: 3,
      Delivered: 4,
      Cancelled: 0,
    };

    if (!Object.prototype.hasOwnProperty.call(statusMap, status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${Object.keys(statusMap).join(', ')}` },
        { status: 400 }
      );
    }

    order.status = status;
    order.currentStep = statusMap[status];
    order.updatedAt = new Date().toISOString();

    if (status === 'Delivered') {
      order.deliveryEstimate = 'Delivered on ' + new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } else if (status === 'Shipped') {
      order.deliveryEstimate = 'Arriving Tomorrow by 2 PM';
    } else if (status === 'Packed') {
      order.deliveryEstimate = 'Dispatched soon, Delivery in 2 Days';
    } else if (status === 'Confirmed') {
      order.deliveryEstimate = 'Tomorrow by 2 PM';
    }

    await saveOrders(orders);

    try {
      let notifTitle = `Order #${order.id} Updated to ${status}`;
      let notifDesc = `Your order status has progressed to ${status}.`;
      let notifIcon = '📦';
      let badgeColor = '#2874f0';

      if (status === 'Packed') {
        notifTitle = `Order #${order.id} Packed & Ready!`;
        notifDesc = `Your items have been packed with invoice and are ready for courier pickup.`;
        notifIcon = '📦';
        badgeColor = '#f59e0b';
      } else if (status === 'Shipped') {
        notifTitle = `Order #${order.id} Shipped!`;
        notifDesc = `In transit via ${order.courier || 'PulseKart Express'} (AWB: ${
          order.trackingNumber || 'PKEXP' + order.id.slice(-6)
        }). Expected ${order.deliveryEstimate}.`;
        notifIcon = '🚚';
        badgeColor = '#8b5cf6';
      } else if (status === 'Delivered') {
        notifTitle = `🎉 Order #${order.id} Delivered!`;
        notifDesc = `Your package has been delivered to resident at your shipping address. Enjoy your products!`;
        notifIcon = '✓';
        badgeColor = '#10b981';
      } else if (status === 'Cancelled') {
        notifTitle = `Order #${order.id} Cancelled`;
        notifDesc = `Order cancellation has been processed. Refund initiated to original payment method.`;
        notifIcon = '✕';
        badgeColor = '#ef4444';
      }

      await pushNotification({
        title: notifTitle,
        desc: notifDesc,
        category: 'orders',
        orderId: order.id,
        link: `/orders/${order.id}`,
        image: order.items?.[0]?.image || '/images/headphones.png',
        icon: notifIcon,
        badgeColor: badgeColor,
      });
    } catch (e) {
      console.error('Failed to emit status notification:', e);
    }

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: attachOrderMeta(order),
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update order', details: err.message }, { status: 500 });
  }
}

export async function PATCH(request, context) {
  return PUT(request, context);
}

// DELETE order
export async function DELETE(request, { params }) {
  const { id } = await params;
  const orders = await getOrders();
  const index = orders.findIndex((o) => o.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  orders.splice(index, 1);
  await saveOrders(orders);
  return NextResponse.json({ success: true, message: 'Order removed' });
}

