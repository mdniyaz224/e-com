import { NextResponse } from 'next/server';
import { getUser, saveUser, otpStore, activeSessions } from '@/lib/dataStore';
import { normalizeIdentifier, generateToken } from '@/lib/authUtils';

export async function POST(request) {
  try {
    const { name, identifier, password, otp } = await request.json();

    if (!name || String(name).trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Please enter your full name (at least 2 characters)' },
        { status: 400 }
      );
    }
    if (!identifier || !String(identifier).trim()) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid mobile number or email address' },
        { status: 400 }
      );
    }
    if (!password || String(password).length < 4) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 4 characters long' },
        { status: 400 }
      );
    }

    const norm = normalizeIdentifier(identifier);

    if (otp) {
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
    }

    let user = await getUser();
    user.name = name.trim();
    user.password = password;
    if (norm.includes('@')) {
      user.email = norm;
    } else {
      user.phone = '+91 ' + norm;
    }
    user.isPlusMember = user.isPlusMember ?? false;
    user.superCoins = user.superCoins || { balance: 100, value: 100 };
    await saveUser(user);

    const token = generateToken(user.id || 1);
    activeSessions.set(token, {
      userId: user.id || 1,
      createdAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      message: 'Account created and logged in successfully!',
      token,
      user,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to create account. Please try again.' }, { status: 500 });
  }
}

