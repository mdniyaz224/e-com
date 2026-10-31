const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('Categories & Promo Banners API', () => {
  it('1. should fetch categories list with names and icons', async () => {
    const res = await fetch('http://localhost:5000/api/categories');
    const categories = await res.json();

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(categories));
    assert.ok(categories.length > 0);

    const first = categories[0];
    assert.ok(first.name, 'Category must have a name');
    assert.ok(first.icon || first.image, 'Category must have icon or image');
  });

  it('2. should fetch promotional hero banners with proper structure', async () => {
    const res = await fetch('http://localhost:5000/api/banners');
    const banners = await res.json();

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(banners));
    assert.ok(banners.length > 0);

    const first = banners[0];
    assert.ok(first.id, 'Banner must have an id');
    assert.ok(first.title || first.image, 'Banner must have title or image');
  });
});

