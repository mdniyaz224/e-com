const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { pushNotification } = require('./notifications');

const ordersFilePath = path.resolve(__dirname, '../data/orders.json');

// Default initial mock orders
const defaultOrders = [
  {
    id: "OD56768941",
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: "Packed",
    currentStep: 2,
    deliveryEstimate: "Tomorrow by 2 PM",
    trackingNumber: "PKEXP567689",
    courier: "PulseKart Express Logistics",
    items: [
      {
        id: 1,
        productId: 1,
        name: "NovaSound Pro ANC Wireless Headphones (Matte Obsidian)",
        image: "/images/headphones.png",
        price: 2499,
        originalPrice: 6999,
        discount: 64,
        seller: "RetailNet",
        color: "Matte Obsidian",
        quantity: 2,
        isAssured: true,
        deliveryBy: "Tomorrow, 2 PM"
      },
      {
        id: 2,
        productId: 7,
        name: "Braided Fast Charging Type-C Cable 65W (1.5m)",
        image: "/images/usb-cable.png",
        price: 349,
        originalPrice: 999,
        discount: 65,
        seller: "TechElectro",
        color: "Black",
        quantity: 1,
        isAssured: true,
        deliveryBy: "Thursday"
      }
    ],
    address: {
      id: 1,
      name: "Rahul Sharma",
      phone: "+91 98765 43210",
      pincode: "560034",
      address: "Flat 402, Lotus Greens, 4th Cross, Koramangala",
      city: "Bengaluru",
      type: "HOME",
      isDefault: true
    },
    paymentMethod: "Cash on Delivery",
    totalAmount: 5047,
    savings: 9950
  },
  {
    id: "OD92817401",
    date: new Date(Date.now() - 3600000 * 8).toISOString(),
    status: "Shipped",
    currentStep: 3,
    deliveryEstimate: "Tomorrow by 2 PM",
    trackingNumber: "PKEXP928174",
    courier: "PulseKart Express Logistics",
    items: [
      {
        id: 1,
        name: "NovaSound Pro ANC Wireless Headphones (Matte Obsidian)",
        image: "/images/headphones.png",
        price: 2499,
        quantity: 1,
        color: "Matte Obsidian"
      }
    ],
    address: {
      name: "Rahul Sharma",
      phone: "+91 98765 43210",
      pincode: "560034",
      address: "Flat 402, Lotus Greens, 4th Cross, Koramangala",
      city: "Bengaluru",
      state: "Karnataka",
      type: "HOME"
    },
    paymentMethod: "UPI (Google Pay)",
    totalAmount: 2499,
    savings: 4500
  },
  {
    id: "OD81729044",
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: "Delivered",
    currentStep: 4,
    deliveryEstimate: "Delivered yesterday",
    trackingNumber: "PKEXP817290",
    courier: "PulseKart Express Logistics",
    items: [
      {
        id: 2,
        name: "Apex Ultra Smartwatch 1.96 AMOLED Always-On Display",
        image: "/images/smartwatch.png",
        price: 1999,
        quantity: 1,
        color: "Silver Steel"
      }
    ],
    address: {
      name: "Rahul Sharma",
      phone: "+91 98765 43210",
      pincode: "560034",
      address: "Flat 402, Lotus Greens, 4th Cross, Koramangala",
      city: "Bengaluru",
      state: "Karnataka",
      type: "HOME"
    },
    paymentMethod: "HDFC Credit Card",
    totalAmount: 1999,
    savings: 6000
  }
];

// Load orders from disk
let orders = [];
try {
  if (fs.existsSync(ordersFilePath)) {
    const raw = fs.readFileSync(ordersFilePath, 'utf-8');
    orders = JSON.parse(raw);
  } else {
    orders = [...defaultOrders];
    fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2), 'utf-8');
  }
} catch (err) {
  console.error('Error loading orders.json:', err);
  orders = [...defaultOrders];
}

// Persist helper
function saveOrdersToFile() {
  try {
    fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to write orders.json:', err);
    return false;
  }
}

// Generate dynamic industry-standard tracking timeline
function attachOrderMeta(order) {
  const createdDate = order.date ? new Date(order.date) : new Date();
  const step = order.currentStep !== undefined ? order.currentStep : 1;
  const status = order.status || 'Confirmed';

  const dateStr = createdDate.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const updatedDateStr = order.updatedAt
    ? new Date(order.updatedAt).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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
        completed: true
      },
      {
        step: 0,
        status: 'Cancelled',
        title: 'Order Cancelled',
        desc: 'Order cancellation was requested and processed. Refund initiated.',
        time: updatedDateStr,
        completed: true,
        isCancelled: true
      }
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
        isCurrent: step === 1
      },
      {
        step: 2,
        status: 'Packed',
        title: 'Order Packed',
        desc: 'Seller packed items in secure tamper-evident packaging with invoice',
        time: step >= 2 ? updatedDateStr : 'Expected in few hours',
        completed: step >= 2,
        isCurrent: step === 2
      },
      {
        step: 3,
        status: 'Shipped',
        title: 'Shipped',
        desc: `Handed over to ${order.courier || 'PulseKart Express Logistics'} (AWB: ${order.trackingNumber || 'PKEXP892174'})`,
        time: step >= 3 ? updatedDateStr : (order.deliveryEstimate || 'Expected Tomorrow'),
        completed: step >= 3,
        isCurrent: step === 3
      },
      {
        step: 4,
        status: 'Delivered',
        title: 'Delivered',
        desc: 'Delivered to resident at customer delivery address',
        time: step >= 4 ? updatedDateStr : (order.deliveryEstimate || 'Expected Tomorrow by 2 PM'),
        completed: step >= 4,
        isCurrent: step === 4
      }
    ];
  }

  return {
    ...order,
    trackingNumber: order.trackingNumber || ("PKEXP" + (order.id ? order.id.slice(-6) : "892147")),
    courier: order.courier || "PulseKart Express Logistics",
    timeline
  };
}

// GET all orders
router.get('/', (req, res) => {
  const enriched = orders.map(attachOrderMeta);
  res.json({
    orders: enriched,
    count: enriched.length
  });
});

// GET specific order
router.get('/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json(attachOrderMeta(order));
});

// POST place order
router.post('/place', (req, res) => {
  const { items, address, paymentMethod, totalAmount, savings } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Cannot place order with empty items" });
  }

  const generatedId = "OD" + Math.floor(10000000 + Math.random() * 90000000);
  const newOrder = {
    id: generatedId,
    date: new Date().toISOString(),
    status: "Confirmed",
    currentStep: 1, // 1: Confirmed, 2: Packed, 3: Shipped, 4: Delivered
    deliveryEstimate: "Tomorrow by 2 PM",
    trackingNumber: "PKEXP" + generatedId.slice(-6),
    courier: "PulseKart Express Logistics",
    items: items,
    address: address || {
      name: "Rahul Sharma",
      phone: "+91 98765 43210",
      pincode: "560034",
      address: "Flat 402, Lotus Greens, 4th Cross, Koramangala",
      city: "Bengaluru",
      type: "HOME"
    },
    paymentMethod: paymentMethod || "Cash on Delivery",
    totalAmount: totalAmount || items.reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0),
    savings: savings || 0,
    updatedAt: new Date().toISOString()
  };

  orders.unshift(newOrder);
  saveOrdersToFile();

  try {
    pushNotification({
      title: `Order #${newOrder.id} Placed Successfully!`,
      desc: `Your order containing ${newOrder.items.length} item(s) totaling ₹${newOrder.totalAmount} has been received.`,
      category: 'orders',
      orderId: newOrder.id,
      link: `/orders/${newOrder.id}`,
      image: newOrder.items?.[0]?.image || '/images/headphones.png',
      icon: '✓',
      badgeColor: '#2874f0'
    });
  } catch (e) {
    console.error('Failed to emit order notification:', e);
  }

  res.status(201).json({
    success: true,
    message: "Order placed successfully",
    order: attachOrderMeta(newOrder)
  });
});

// PUT update order status
router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  const order = orders.find(o => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  const statusMap = {
    'Confirmed': 1,
    'Packed': 2,
    'Shipped': 3,
    'Delivered': 4,
    'Cancelled': 0
  };

  if (!statusMap.hasOwnProperty(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${Object.keys(statusMap).join(', ')}` });
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

  saveOrdersToFile();

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
      notifDesc = `In transit via ${order.courier || 'PulseKart Express'} (AWB: ${order.trackingNumber || 'PKEXP' + order.id.slice(-6)}). Expected ${order.deliveryEstimate}.`;
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

    pushNotification({
      title: notifTitle,
      desc: notifDesc,
      category: 'orders',
      orderId: order.id,
      link: `/orders/${order.id}`,
      image: order.items?.[0]?.image || '/images/headphones.png',
      icon: notifIcon,
      badgeColor: badgeColor
    });
  } catch (e) {
    console.error('Failed to emit status notification:', e);
  }

  res.json({
    success: true,
    message: `Order status updated to ${status}`,
    order: attachOrderMeta(order)
  });
});

// POST cancel order
router.post('/:id/cancel', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  if (order.status === 'Delivered') {
    return res.status(400).json({ error: "Delivered orders cannot be cancelled. You can request a return." });
  }

  order.status = 'Cancelled';
  order.currentStep = 0;
  order.updatedAt = new Date().toISOString();
  saveOrdersToFile();

  try {
    pushNotification({
      title: `Order #${order.id} Cancelled`,
      desc: `Your cancellation request was completed. Any paid amount will be reversed within 2-3 business days.`,
      category: 'orders',
      orderId: order.id,
      link: `/orders/${order.id}`,
      image: order.items?.[0]?.image || '/images/headphones.png',
      icon: '✕',
      badgeColor: '#ef4444'
    });
  } catch (e) {
    console.error('Failed to emit cancel notification:', e);
  }

  res.json({
    success: true,
    message: "Order cancelled successfully",
    order: attachOrderMeta(order)
  });
});

// DELETE remove order
router.delete('/:id', (req, res) => {
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Order not found" });
  }
  orders.splice(index, 1);
  saveOrdersToFile();
  res.json({ success: true, message: "Order removed" });
});

module.exports = router;
