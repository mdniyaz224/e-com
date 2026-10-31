const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const API_BASE = 'http://localhost:5000/api/cart';

describe('Cart Engine & Price Calculation Logic', () => {
  it('1. should fetch active cart and accurately compute price breakdown', async () => {
    const res = await fetch(API_BASE);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(data.items));
    assert.ok(data.priceDetails);

    const { subtotal, discount, superCoinSavings, couponDiscount, total, totalSavings } = data.priceDetails;

    // Verify subtotal formula
    const expectedSubtotal = data.items.reduce((s, it) => s + (it.originalPrice * it.quantity), 0);
    assert.strictEqual(subtotal, expectedSubtotal);

    // Verify selling price and discount formula
    const rawTotal = data.items.reduce((s, it) => s + (it.price * it.quantity), 0);
    assert.strictEqual(discount, subtotal - rawTotal);

    // Verify total savings formula: discount + superCoins + coupon
    assert.strictEqual(totalSavings, discount + superCoinSavings + couponDiscount);

    // Verify final net payable total: rawTotal - superCoins - coupon
    assert.strictEqual(total, rawTotal - superCoinSavings - couponDiscount);
  });

  it('2. should add a new product item to the cart', async () => {
    const itemToAdd = {
      productId: 99,
      name: "Protective Tempered Glass Screen Guard",
      image: "/images/accessories.png",
      price: 199,
      originalPrice: 499,
      discount: 60,
      seller: "Pulse Accessories",
      color: "Clear",
      quantity: 1
    };

    const res = await fetch(`${API_BASE}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemToAdd)
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.cart));

    const added = data.cart.find(it => it.productId === 99);
    assert.ok(added, 'Added item should exist in the cart');
    assert.strictEqual(added.price, 199);
  });

  it('3. should update the quantity of an item in the cart', async () => {
    // Get current cart items to find item id
    const cartRes = await fetch(API_BASE);
    const cartData = await cartRes.json();
    const targetItem = cartData.items.find(it => it.productId === 99);
    assert.ok(targetItem);

    const res = await fetch(`${API_BASE}/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: targetItem.id, quantity: 3 })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);

    const updated = data.cart.find(it => it.id === targetItem.id);
    assert.strictEqual(updated.quantity, 3);
  });

  it('4. should remove an item from the cart', async () => {
    const cartRes = await fetch(API_BASE);
    const cartData = await cartRes.json();
    const targetItem = cartData.items.find(it => it.productId === 99);
    assert.ok(targetItem);

    const res = await fetch(`${API_BASE}/remove/${targetItem.id}`, {
      method: 'DELETE'
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);

    const exists = data.cart.some(it => it.productId === 99);
    assert.strictEqual(exists, false, 'Removed item should not be in the cart');
  });
});

