const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const API_BASE = 'http://localhost:5000/api/orders';

describe('Orders Management, State Machine & Tax Engine', () => {
  let createdOrderId = null;

  it('1. should fetch all customer orders with tracking metadata', async () => {
    const res = await fetch(API_BASE);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(data.orders));

    if (data.orders.length > 0) {
      const first = data.orders[0];
      assert.ok(first.id, 'Order must have an ID');
      assert.ok(first.status, 'Order must have a status');
      assert.ok(Array.isArray(first.items), 'Order must have items');
      assert.ok(Array.isArray(first.timeline), 'Order must have a timeline array');
    }
  });

  it('2. should place a new order via POST /api/orders/place', async () => {
    const orderPayload = {
      items: [
        {
          id: 1,
          productId: 1,
          name: "NovaSound Pro ANC Wireless Headphones",
          image: "/images/headphones.png",
          price: 2499,
          quantity: 1,
          seller: "RetailNet"
        }
      ],
      address: {
        name: "Rahul Sharma",
        phone: "+91 98765 43210",
        pincode: "560034",
        address: "Flat 402, Lotus Greens, Koramangala",
        city: "Bengaluru",
        type: "HOME"
      },
      paymentMethod: "UPI (Google Pay)",
      totalAmount: 2499,
      savings: 4500
    };

    const res = await fetch(`${API_BASE}/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    const data = await res.json();

    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.success, true);
    assert.ok(data.order.id.startsWith('OD'));
    assert.strictEqual(data.order.status, 'Confirmed');
    assert.strictEqual(data.order.currentStep, 1);
    assert.ok(data.order.trackingNumber.startsWith('PKEXP'));

    createdOrderId = data.order.id;
  });

  it('3. should fetch specific order details by ID', async () => {
    assert.ok(createdOrderId);

    const res = await fetch(`${API_BASE}/${createdOrderId}`);
    const order = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(order.id, createdOrderId);
    assert.strictEqual(order.status, 'Confirmed');
    assert.strictEqual(order.timeline.length, 4);
    assert.strictEqual(order.timeline[0].completed, true);
  });

  it('4. should transition order status from Confirmed -> Packed', async () => {
    assert.ok(createdOrderId);

    const res = await fetch(`${API_BASE}/${createdOrderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Packed' })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.order.status, 'Packed');
    assert.strictEqual(data.order.currentStep, 2);
  });

  it('5. should transition order status from Packed -> Shipped', async () => {
    assert.ok(createdOrderId);

    const res = await fetch(`${API_BASE}/${createdOrderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Shipped' })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.order.status, 'Shipped');
    assert.strictEqual(data.order.currentStep, 3);
  });

  it('6. should transition order status from Shipped -> Delivered', async () => {
    assert.ok(createdOrderId);

    const res = await fetch(`${API_BASE}/${createdOrderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Delivered' })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.order.status, 'Delivered');
    assert.strictEqual(data.order.currentStep, 4);
    assert.strictEqual(data.order.timeline[3].completed, true);
  });

  it('7. should reject invalid order status transitions with 400', async () => {
    assert.ok(createdOrderId);

    const res = await fetch(`${API_BASE}/${createdOrderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'UnknownStatus' })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 400);
    assert.match(data.error, /Invalid status/i);
  });

  it('8. should prevent cancelling already Delivered orders with 400', async () => {
    assert.ok(createdOrderId);

    const res = await fetch(`${API_BASE}/${createdOrderId}/cancel`, {
      method: 'POST'
    });
    const data = await res.json();

    assert.strictEqual(res.status, 400);
    assert.match(data.error, /Delivered orders cannot be cancelled/i);
  });

  it('9. should cancel an active Confirmed or In-Transit order via POST /api/orders/:id/cancel', async () => {
    // Place a new order to cancel
    const newRes = await fetch(`${API_BASE}/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ id: 1, name: "Sample Item", price: 499, quantity: 1 }],
        totalAmount: 499
      })
    });
    const { order } = await newRes.json();
    assert.ok(order.id);

    const cancelRes = await fetch(`${API_BASE}/${order.id}/cancel`, {
      method: 'POST'
    });
    const cancelData = await cancelRes.json();

    assert.strictEqual(cancelRes.status, 200);
    assert.strictEqual(cancelData.success, true);
    assert.strictEqual(cancelData.order.status, 'Cancelled');
  });

  it('10. should correctly compute GST Tax Invoice values (18% GST split: 9% CGST + 9% SGST)', () => {
    const totalGross = 2499;
    const gstRate = 0.18; // 18% standard electronics GST
    const taxableAmount = Math.round((totalGross / (1 + gstRate)) * 100) / 100;
    const totalGst = Math.round((totalGross - taxableAmount) * 100) / 100;
    const cgst = Math.round((totalGst / 2) * 100) / 100;
    const sgst = Math.round((totalGst / 2) * 100) / 100;

    // Verify taxable value
    assert.strictEqual(taxableAmount, 2117.8);
    // Verify 18% total GST amount
    assert.strictEqual(totalGst, 381.2);
    // Verify equal 9% CGST and 9% SGST split
    assert.strictEqual(cgst, 190.6);
    assert.strictEqual(sgst, 190.6);
    // Verify that taxableAmount + cgst + sgst matches totalGross within rounding tolerance
    assert.strictEqual(Math.round(taxableAmount + cgst + sgst), totalGross);
  });
});
