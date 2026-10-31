import { NextResponse } from 'next/server';
import { getProducts, saveProducts } from '@/lib/dataStore';

// GET product by id
export async function GET(request, { params }) {
  const { id } = await params;
  const productId = parseInt(id);
  const products = await getProducts();
  const product = products.find((p) => p.id === productId || String(p.id) === String(id));

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json(product);
}

// PUT update product by id
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    const updates = await request.json();
    const products = await getProducts();
    const index = products.findIndex((p) => p.id === productId || String(p.id) === String(id));

    if (index === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const existing = products[index];
    const parsedPrice = updates.price !== undefined ? parseFloat(updates.price) : existing.price;
    const parsedOriginalPrice =
      updates.originalPrice !== undefined ? parseFloat(updates.originalPrice) : existing.originalPrice;

    let calculatedDiscount = updates.discount !== undefined ? parseInt(updates.discount) : existing.discount;
    if (updates.price !== undefined || updates.originalPrice !== undefined) {
      if (parsedOriginalPrice > parsedPrice && parsedOriginalPrice > 0) {
        calculatedDiscount = Math.round(((parsedOriginalPrice - parsedPrice) / parsedOriginalPrice) * 100);
      }
    }

    const updatedProduct = {
      ...existing,
      ...updates,
      id: productId,
      price: parsedPrice,
      originalPrice: parsedOriginalPrice,
      discount: calculatedDiscount,
      images: Array.isArray(updates.images) && updates.images.length > 0 ? updates.images : existing.images,
      updatedAt: new Date().toISOString(),
    };

    products[index] = updatedProduct;
    await saveProducts(products);

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update product', details: err.message }, { status: 500 });
  }
}

// DELETE product by id
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    const products = await getProducts();
    const index = products.findIndex((p) => p.id === productId || String(p.id) === String(id));

    if (index === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const deleted = products.splice(index, 1)[0];
    await saveProducts(products);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
      deletedId: productId,
      deletedName: deleted.name,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete product', details: err.message }, { status: 500 });
  }
}

