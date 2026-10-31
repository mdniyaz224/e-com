import { NextResponse } from 'next/server';
import { getProducts, saveProducts, pushNotification } from '@/lib/dataStore';

export async function PATCH(request, { params }) {
  const { id } = await params;
  const productId = parseInt(id);
  const products = await getProducts();
  const product = products.find((p) => p.id === productId);

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  product.isTopDeal = !product.isTopDeal;
  await saveProducts(products);

  if (product.isTopDeal) {
    try {
      await pushNotification({
        title: `🔥 Deal Alert: ${product.name.slice(0, 36)}...`,
        desc: `Special price drop on ${product.name}. Now at ₹${product.price} (${product.discount}% OFF)!`,
        category: 'offers',
        link: `/product/${product.id}`,
        image: product.images?.[0] || '/images/headphones.png',
        icon: '🔥',
        badgeColor: '#ef4444',
      });
    } catch (e) {
      console.error('Failed to emit deal notification:', e);
    }
  }

  return NextResponse.json({
    success: true,
    message: `Top deal ${product.isTopDeal ? 'enabled' : 'disabled'}`,
    isTopDeal: product.isTopDeal,
  });
}

