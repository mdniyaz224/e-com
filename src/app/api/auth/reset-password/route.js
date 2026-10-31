import { NextResponse } from 'next/server';
import { getUser, saveUser, otpStore, activeSessions } from '@/lib/dataStore';
import { normalizeIdentifier, generateToken } from '@/lib/authUtils';

export async function POST(request) {
  try {
    const { identifier, otp, newPassword, confirmPassword } = await request.json();

    if (!identifier || !otp) {
      return NextResponse.json({ success: false, error: 'Identifier and OTP code are required' }, { status: 400 });
    }
    if (!newPassword || String(newPassword).length < 4) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 4 characters long' },
        { status: 400 }
      );
    }
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'New password and confirm password do not match' },
        { status: 400 }
      );
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
    user.password = newPassword;
    await saveUser(user);

    const token = generateToken(user.id || 1);
    activeSessions.set(token, {
      userId: user.id || 1,
      createdAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully! You are now logged in.',
      token,
      user,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to reset password. Please try again.' }, { status: 500 });
  }
}

