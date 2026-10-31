import { NextResponse } from 'next/server';
import { getUser, saveUser } from '@/lib/dataStore';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const targetId = parseInt(id);
    const user = await getUser();
    user.addresses = (user.addresses || []).filter((a) => a.id !== targetId);
    await saveUser(user);

    return NextResponse.json({ success: true, addresses: user.addresses });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Internal server error deleting address' }, { status: 500 });
  }
}

