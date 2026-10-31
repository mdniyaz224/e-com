const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const API_BASE = 'http://localhost:5000/api/products';

describe('Products & Catalog Management', () => {
  let createdProductId = null;

  it('1. should fetch all products with proper Flipkart product schema', async () => {
    const res = await fetch(API_BASE);
    const products = await res.json();

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(products));
    assert.ok(products.length > 0, 'Products list should not be empty');

    const first = products[0];
    assert.ok(first.id, 'Product must have an id');
    assert.ok(first.name, 'Product must have a name');
    assert.ok(first.price >= 0, 'Product must have a valid price');
    assert.ok(first.category, 'Product must have a category');
    assert.ok(Array.isArray(first.images), 'Product must have images array');
  });

  it('2. should filter products by category', async () => {
    const res = await fetch(`${API_BASE}?category=Mobiles`);
    const products = await res.json();

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(products));
    products.forEach(p => {
      assert.strictEqual(p.category.toLowerCase(), 'mobiles');
    });
  });

  it('3. should search products by keyword', async () => {
    const res = await fetch(`${API_BASE}?search=Headphones`);
    const products = await res.json();

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(products));
    assert.ok(products.length > 0);
    const match = products.some(p => p.name.toLowerCase().includes('headphones') || p.category.toLowerCase().includes('headphones'));
    assert.strictEqual(match, true);
  });

  it('4. should fetch top deals and trending collections', async () => {
    const [dealsRes, trendRes] = await Promise.all([
      fetch(`${API_BASE}/deals`),
      fetch(`${API_BASE}/trending`)
    ]);

    const deals = await dealsRes.json();
    const trending = await trendRes.json();

    assert.strictEqual(dealsRes.status, 200);
    assert.strictEqual(trendRes.status, 200);
    assert.ok(Array.isArray(deals));
    assert.ok(Array.isArray(trending));
  });

  it('5. should validate required fields (name and category) when adding a product', async () => {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        price: 999
        // missing name and category
      })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 400);
    assert.match(data.error, /name is required/i);
  });

  it('6. should successfully create a new product', async () => {
    const newProduct = {
      name: 'PulseBuds Pro Wireless Earbuds (Active Noise Cancellation)',
      shortName: 'PulseBuds Pro ANC',
      brand: 'PulseAudio',
      category: 'Electronics',
      price: 1999,
      originalPrice: 4999,
      stock: 35,
      isAssured: true
    };

    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    });
    const data = await res.json();

    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.success, true);
    assert.ok(data.product.id);
    assert.strictEqual(data.product.name, newProduct.name);
    assert.strictEqual(data.product.price, 1999);
    assert.strictEqual(data.product.discount, 60); // 4999 -> 1999 is 60% discount

    createdProductId = data.product.id;
  });

  it('7. should update existing product details via PUT /api/products/:id', async () => {
    assert.ok(createdProductId, 'Product ID required from previous test');

    const res = await fetch(`${API_BASE}/${createdProductId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        price: 1799,
        stock: 50
      })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.product.price, 1799);
    assert.strictEqual(data.product.stock, 50);
  });

  it('8. should toggle isTopDeal status via PATCH /api/products/:id/toggle-deal', async () => {
    assert.ok(createdProductId);

    const res = await fetch(`${API_BASE}/${createdProductId}/toggle-deal`, {
      method: 'PATCH'
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(typeof data.isTopDeal, 'boolean');
  });

  it('9. should delete the test product via DELETE /api/products/:id', async () => {
    assert.ok(createdProductId);

    const res = await fetch(`${API_BASE}/${createdProductId}`, {
      method: 'DELETE'
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.deletedId, createdProductId);

    // Verify deletion returns 404
    const getRes = await fetch(`${API_BASE}/${createdProductId}`);
    assert.strictEqual(getRes.status, 404);
  });
});

