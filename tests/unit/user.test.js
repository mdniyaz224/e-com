const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const API_BASE = 'http://localhost:5000/api/user';

describe('User Profile & Address Book Management', () => {
  let createdAddressId = null;

  it('1. should fetch current user profile with complete schema', async () => {
    const res = await fetch(API_BASE);
    const user = await res.json();

    assert.strictEqual(res.status, 200);
    assert.ok(user.name, 'User should have a name');
    assert.ok(user.email, 'User should have an email');
    assert.ok(user.phone, 'User should have a phone');
    assert.ok(Array.isArray(user.addresses), 'User should have an addresses array');
    assert.ok(Array.isArray(user.savedCards), 'User should have a savedCards array');
  });

  it('2. should update user profile details and persist changes', async () => {
    const updatePayload = {
      name: 'Rahul Sharma',
      email: 'rahul.sharma@pulsekart.in',
      phone: '+91 98765 43210',
      gender: 'Male'
    };

    const res = await fetch(API_BASE, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.name, 'Rahul Sharma');
    assert.strictEqual(data.user.email, 'rahul.sharma@pulsekart.in');
    assert.strictEqual(data.user.gender, 'Male');

    // Verify persistence by refetching
    const verifyRes = await fetch(API_BASE);
    const freshUser = await verifyRes.json();
    assert.strictEqual(freshUser.name, 'Rahul Sharma');
    assert.strictEqual(freshUser.email, 'rahul.sharma@pulsekart.in');
  });

  it('3. should validate required fields when adding an address (missing name or pincode)', async () => {
    const res = await fetch(`${API_BASE}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: '123 Test Street'
        // Missing name and pincode
      })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 400);
    assert.ok(data.error);
    assert.match(data.error, /required/i);
  });

  it('4. should successfully add a new delivery address', async () => {
    const newAddress = {
      name: 'Rahul Sharma',
      phone: '+91 98765 43210',
      pincode: '560100',
      address: 'Plot 42, Electronic City Phase 1',
      city: 'Bengaluru',
      label: 'WORK'
    };

    const res = await fetch(`${API_BASE}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAddress)
    });
    const data = await res.json();

    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.addresses));

    const added = data.addresses.find(a => a.pincode === '560100');
    assert.ok(added, 'Newly added address should be in the list');
    assert.strictEqual(added.label, 'WORK');
    assert.strictEqual(added.city, 'Bengaluru');

    createdAddressId = added.id;
  });

  it('5. should delete the address by ID', async () => {
    assert.ok(createdAddressId, 'Address ID from previous step required');

    const res = await fetch(`${API_BASE}/addresses/${createdAddressId}`, {
      method: 'DELETE'
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);

    const exists = data.addresses.some(a => a.id === createdAddressId);
    assert.strictEqual(exists, false, 'Deleted address should no longer exist in array');
  });
});

