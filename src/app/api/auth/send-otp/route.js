import { NextResponse } from 'next/server';
import { getUser, otpStore } from '@/lib/dataStore';
import { normalizeIdentifier } from '@/lib/authUtils';

export async function POST(request) {
  try {
    const { identifier, purpose = 'login' } = await request.json();
    if (!identifier || !String(identifier).trim()) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid mobile number or email' },
        { status: 400 }
      );
    }

    const norm = normalizeIdentifier(identifier);
    const currentUser = await getUser();
    const userPhoneNorm = normalizeIdentifier(currentUser.phone);
    const userEmailNorm = (currentUser.email || '').toLowerCase();

    const isExistingUser = norm === userPhoneNorm || norm === userEmailNorm;
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    otpStore.set(norm, {
      otp: generatedOtp,
      expiresAt,
      identifier,
      purpose,
    });

    console.log(`[Next.js Auth] OTP requested [${purpose}] for ${identifier}: ${generatedOtp} / 123456`);

    return NextResponse.json({
      success: true,
      message: `OTP sent successfully to ${identifier}`,
      identifier,
      normalizedIdentifier: norm,
      isNewUser: !isExistingUser,
      purpose,
      demoOtp: '123456',
      generatedOtp,
      expiresInSeconds: 300,
    });
  } catch (err) {
    console.error('Error in send-otp:', err);
    return NextResponse.json({ success: false, error: 'Failed to send OTP. Please try again.', details: err.message }, { status: 500 });
  }
}

