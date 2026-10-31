import { NextResponse } from 'next/server';
import { getUser, saveUser, otpStore, activeSessions } from '@/lib/dataStore';
import { normalizeIdentifier, generateToken } from '@/lib/authUtils';

export async function POST(request) {
  try {
    const { identifier, otp, name } = await request.json();
    if (!identifier || !otp) {
      return NextResponse.json({ success: false, error: 'Identifier and OTP are required' }, { status: 400 });
    }

    const norm = normalizeIdentifier(identifier);
    const enteredOtp = String(otp).trim();

    const stored = otpStore.get(norm);
    const isMasterOtp = enteredOtp === '123456';
    const isStoreOtp = stored && stored.otp === enteredOtp && Date.now() < stored.expiresAt;

    if (!isMasterOtp && !isStoreOtp) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired OTP. Please use code 123456 or request a new OTP.',
        },
        { status: 400 }
      );
    }

    otpStore.delete(norm);

    let user = await getUser();
    const userPhoneNorm = normalizeIdentifier(user.phone);
    const userEmailNorm = (user.email || '').toLowerCase();
    const isExisting = norm === userPhoneNorm || norm === userEmailNorm;

    if (!isExisting) {
      user.name = name && name.trim() ? name.trim() : 'PulseKart Shopper';
      if (norm.includes('@')) {
        user.email = norm;
      } else {
        user.phone = '+91 ' + norm;
      }
      user.isPlusMember = false;
      user.superCoins = user.superCoins || { balance: 100, value: 100 };
      await saveUser(user);
    } else if (name && name.trim() && user.name !== name.trim()) {
      user.name = name.trim();
      await saveUser(user);
    }

    const token = generateToken(user.id || 1);
    activeSessions.set(token, {
      userId: user.id || 1,
      createdAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      message: isExisting ? 'Logged in successfully' : 'Account created & logged in successfully',
      token,
      user,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Authentication failed. Please try again.' }, { status: 500 });
  }
}

