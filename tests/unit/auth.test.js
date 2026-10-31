const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const API_BASE = 'http://localhost:5000/api/auth';

describe('Auth Module: Complete IAM Suite (Login, Signup, Forgot, Reset & OTP Fallback)', () => {
  let sessionToken = null;

  // 1. Send OTP
  it('1. should send OTP to a valid mobile number', async () => {
    const res = await fetch(`${API_BASE}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '9876543210' })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.match(data.message, /OTP sent successfully/);
    assert.strictEqual(data.demoOtp, '123456');
    assert.strictEqual(data.expiresInSeconds, 300);
  });

  it('2. should send OTP to a valid email address', async () => {
    const res = await fetch(`${API_BASE}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'shopper@pulsekart.in' })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.demoOtp, '123456');
  });

  it('3. should reject empty identifier with 400', async () => {
    const res = await fetch(`${API_BASE}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '   ' })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.success, false);
    assert.match(data.error, /valid mobile number or email/i);
  });

  // 2. Verify OTP
  it('4. should reject invalid OTP with 400', async () => {
    const res = await fetch(`${API_BASE}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '9876543210', otp: '000000' })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.success, false);
    assert.match(data.error, /Invalid or expired OTP/i);
  });

  it('5. should successfully verify OTP with test master code 123456', async () => {
    const res = await fetch(`${API_BASE}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '9876543210',
        otp: '123456',
        name: 'Rahul Sharma'
      })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.token, 'Token should be returned');
    assert.ok(data.user, 'User object should be returned');
    assert.strictEqual(data.user.name, 'Rahul Sharma');

    sessionToken = data.token;
  });

  // 3. User Sign Up
  it('6. should reject signup with short name or password', async () => {
    const res = await fetch(`${API_BASE}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'A',
        identifier: '9123456780',
        password: '12'
      })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.success, false);
  });

  it('7. should register new user with full details and auto-login', async () => {
    const res = await fetch(`${API_BASE}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Priya Patel',
        identifier: '9123456780',
        password: 'priyaPassword2026',
        otp: '123456'
      })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.token);
    assert.strictEqual(data.user.name, 'Priya Patel');
  });

  // 4. Forgot Password & OTP Direct Login Fallback
  it('8. should process forgot-password request and return test OTP', async () => {
    const res = await fetch(`${API_BASE}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '9876543210' })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.demoOtp, '123456');
    assert.strictEqual(data.canLoginDirectlyWithOtp, true);
  });

  // 5. Reset Password
  it('9. should reject password reset with mismatched passwords', async () => {
    const res = await fetch(`${API_BASE}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '9876543210',
        otp: '123456',
        newPassword: 'myNewPassword123',
        confirmPassword: 'differentPassword456'
      })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.success, false);
    assert.match(data.error, /do not match/i);
  });

  it('10. should successfully reset password and log the user in', async () => {
    const res = await fetch(`${API_BASE}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '9876543210',
        otp: '123456',
        newPassword: 'myNewPassword123',
        confirmPassword: 'myNewPassword123'
      })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.token);
    assert.match(data.message, /Password reset successfully/i);

    sessionToken = data.token;
  });

  // 6. Login with Password & Error handling
  it('11. should login with newly updated password', async () => {
    const res = await fetch(`${API_BASE}/login-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '9876543210',
        password: 'myNewPassword123'
      })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.token);
  });

  it('12. should reject incorrect password and offer OTP fallback', async () => {
    const res = await fetch(`${API_BASE}/login-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '9876543210',
        password: 'wrongPassword999'
      })
    });
    const data = await res.json();

    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.canLoginWithOtp, true);
    assert.match(data.error, /login using OTP instead/i);
  });

  // 7. Get Current Auth State
  it('13. should authenticate user session via GET /api/auth/me with Bearer token', async () => {
    assert.ok(sessionToken, 'Precondition: session token required');

    const res = await fetch(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.isAuthenticated, true);
    assert.ok(data.user);
  });

  it('14. should return unauthenticated status when no token is provided to GET /api/auth/me', async () => {
    const res = await fetch(`${API_BASE}/me`);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.isAuthenticated, false);
    assert.strictEqual(data.user, null);
  });

  // 8. Logout
  it('15. should successfully logout and clear session', async () => {
    const res = await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.match(data.message, /Logged out successfully/i);
  });
});
