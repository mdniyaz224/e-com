import { NextResponse } from 'next/server';
import { getUser, saveUser } from '@/lib/dataStore';

export async function GET() {
  const user = await getUser();
  return NextResponse.json(user);
}

export async function PUT(request) {
  try {
    const { name, email, phone, gender } = await request.json();
    const user = await getUser();

    if (name !== undefined && name !== null) {
      user.name = String(name).trim();
    }
    if (email !== undefined && email !== null) {
      user.email = String(email).trim();
    }
    if (phone !== undefined && phone !== null) {
      user.phone = String(phone).trim();
    }
    if (gender !== undefined && gender !== null) {
      user.gender = String(gender).trim();
    }

    await saveUser(user);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Internal server error updating profile' }, { status: 500 });
  }
}

