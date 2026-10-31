import { NextResponse } from 'next/server';
import { getUser, saveUser } from '@/lib/dataStore';

export async function POST(request) {
  try {
    const { label, name, phone, pincode, address, city } = await request.json();
    if (!name || !address || !pincode) {
      return NextResponse.json({ error: 'Name, address, and pincode are required' }, { status: 400 });
    }

    const user = await getUser();
    const newAddress = {
      id: Date.now(),
      label: (label || 'HOME').toUpperCase(),
      name: String(name).trim(),
      phone: phone ? String(phone).trim() : user.phone,
      pincode: String(pincode).trim(),
      address: String(address).trim(),
      city: (city || 'Bengaluru').trim(),
      isDefault: !user.addresses || user.addresses.length === 0,
    };

    if (!Array.isArray(user.addresses)) {
      user.addresses = [];
    }
    user.addresses.push(newAddress);
    await saveUser(user);

    return NextResponse.json({ success: true, addresses: user.addresses }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Internal server error adding address' }, { status: 500 });
  }
}

