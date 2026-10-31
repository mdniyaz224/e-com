import { NextResponse } from 'next/server';
import { getUser, otpStore } from '@/lib/dataStore';
import { normalizeIdentifier } from '@/lib/authUtils';

export async function POST(request) {
  try {
    const { identifier } = await request.json();
    if (!identifier || !String(identifier).trim()) {
      return NextResponse.json(
        { success: false, error: 'Please enter your registered mobile number or email' },
        { status: 400 }
      );
    }

    const norm = normalizeIdentifier(identifier);
    const currentUser = await getUser();
    const userPhoneNorm = normalizeIdentifier(currentUser.phone);
    const userEmailNorm = (currentUser.email || '').toLowerCase();
    const isKnown = norm === userPhoneNorm || norm === userEmailNorm;

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    otpStore.set(norm, {
      otp: generatedOtp,
      expiresAt,
      identifier,
      purpose: 'forgot',
    });

    return NextResponse.json({
      success: true,
      message: `Password reset code sent to ${identifier}`,
      identifier,
      normalizedIdentifier: norm,
      isKnownUser: isKnown,
      canLoginDirectlyWithOtp: true,
      demoOtp: '123456',
      generatedOtp,
      expiresInSeconds: 300,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to process request. Please try again.' }, { status: 500 });
  }
}

