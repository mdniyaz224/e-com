import { NextResponse } from 'next/server';
import { getProducts, saveProducts } from '@/lib/dataStore';

// GET all products with filtering
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const deal = searchParams.get('deal');
  const trending = searchParams.get('trending');

  let filtered = [...(await getProducts())];

  if (category) {
    filtered = filtered.filter((p) => p.category?.toLowerCase() === category.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.shortName && p.shortName.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
    );
  }
  if (deal === 'true') {
    filtered = filtered.filter((p) => p.isTopDeal);
  }
  if (trending === 'true') {
    filtered = filtered.filter((p) => p.trendingTag);
  }

  return NextResponse.json(filtered);
}

// POST create product
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      shortName,
      brand,
      category,
      categoryTag,
      images,
      price,
      originalPrice,
      discount,
      rating,
      ratingCount,
      reviewCount,
      seller,
      isAssured,
      isTopDeal,
      trendingTag,
      freeDelivery,
      deliveryBy,
      deliveryHighlight,
      highlights,
      colors,
      warranty,
      stock,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }
    if (!category || !category.trim()) {
      return NextResponse.json({ error: 'Product category is required' }, { status: 400 });
    }

    const parsedPrice = parseFloat(price) || 0;
    const parsedOriginalPrice = parseFloat(originalPrice) || parsedPrice;

    let calculatedDiscount = parseInt(discount);
    if (isNaN(calculatedDiscount) || calculatedDiscount <= 0) {
      if (parsedOriginalPrice > parsedPrice && parsedOriginalPrice > 0) {
        calculatedDiscount = Math.round(((parsedOriginalPrice - parsedPrice) / parsedOriginalPrice) * 100);
      } else {
        calculatedDiscount = 0;
      }
    }

    const products = await getProducts();
    const maxId = products.reduce((max, p) => (p.id > max ? p.id : max), 0);
    const newId = maxId + 1;

    let processedImages = [];
    if (Array.isArray(images) && images.length > 0) {
      processedImages = images.filter((img) => typeof img === 'string' && img.trim().length > 0);
    }
    if (processedImages.length === 0) {
      processedImages = ['/images/headphones.png'];
    }

    let processedHighlights = [];
    if (Array.isArray(highlights)) {
      processedHighlights = highlights.filter((h) => typeof h === 'string' && h.trim().length > 0);
    } else if (typeof highlights === 'string') {
      processedHighlights = highlights.split('\n').map((h) => h.trim()).filter(Boolean);
    }

    const newProduct = {
      id: newId,
      name: name.trim(),
      shortName: shortName?.trim() || (name.length > 32 ? name.substring(0, 32) + '...' : name),
      brand: brand?.trim() || 'PulseKart Direct',
      category: category.trim(),
      categoryTag: categoryTag?.trim() || `Popular in ${category.trim()}`,
      images: processedImages,
      price: parsedPrice,
      originalPrice: parsedOriginalPrice,
      discount: calculatedDiscount,
      rating: parseFloat(rating) || 4.5,
      ratingCount: parseInt(ratingCount) || 120,
      reviewCount: parseInt(reviewCount) || 18,
      seller: seller?.trim() || 'RetailNet',
      isAssured: isAssured !== undefined ? Boolean(isAssured) : true,
      isTopDeal: Boolean(isTopDeal),
      trendingTag: trendingTag ? String(trendingTag).trim() : isTopDeal ? '🔥 Deal of the Day' : '',
      freeDelivery: freeDelivery !== undefined ? Boolean(freeDelivery) : true,
      deliveryBy: deliveryBy?.trim() || 'Tomorrow, 2 PM',
      deliveryHighlight: deliveryHighlight?.trim() || 'Free Delivery for Prime members',
      highlights:
        processedHighlights.length > 0
          ? processedHighlights
          : [
              'Genuine authentic manufacturer product',
              '100% Brand new sealed pack with invoice',
              'Express fast doorstep shipping',
            ],
      colors:
        Array.isArray(colors) && colors.length > 0
          ? colors
          : [{ name: 'Standard Edition', hex: '#2C2C2C', image: processedImages[0] }],
      bankOffers: [
        { type: 'Bank Offer', description: '10% Instant Discount on select Bank Credit Cards', hasTC: true },
        {
          type: 'Special Price',
          description: `Flat ₹${Math.max(100, Math.round(parsedPrice * 0.05))} off on online prepaid payment`,
          hasTC: false,
        },
      ],
      warranty: warranty || {
        replacement: '7 Days',
        cod: true,
        brandWarranty: '1 Year Warranty',
      },
      stock: parseInt(stock) || 50,
      createdAt: new Date().toISOString(),
    };

    products.unshift(newProduct);
    await saveProducts(products);

    return NextResponse.json(
      {
        success: true,
        message: 'Product created successfully',
        product: newProduct,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error creating product:', err);
    return NextResponse.json({ error: 'Failed to create product', details: err.message }, { status: 500 });
  }
}

