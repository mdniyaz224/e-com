const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { pushNotification } = require('./notifications');

const productsFilePath = path.resolve(__dirname, '../data/products.json');

// In-memory products array loaded from JSON
let products = [];
try {
  const fileData = fs.readFileSync(productsFilePath, 'utf-8');
  products = JSON.parse(fileData);
} catch (err) {
  console.error('Error loading products.json, falling back to require:', err);
  products = require('../data/products.json');
}

// Helper to persist changes to disk
function saveProductsToFile() {
  try {
    fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to write products to disk:', err);
    return false;
  }
}

// GET all products (with search, category, deal filters)
router.get('/', (req, res) => {
  const { category, search, deal, trending } = req.query;
  let filtered = [...products];

  if (category) {
    filtered = filtered.filter(p => p.category?.toLowerCase() === category.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.shortName && p.shortName.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }
  if (deal === 'true') {
    filtered = filtered.filter(p => p.isTopDeal);
  }
  if (trending === 'true') {
    filtered = filtered.filter(p => p.trendingTag);
  }

  res.json(filtered);
});

// GET deals of the day
router.get('/deals', (req, res) => {
  const deals = products.filter(p => p.isTopDeal || (p.discount && p.discount >= 50));
  res.json(deals);
});

// GET trending products
router.get('/trending', (req, res) => {
  const trending = products.filter(p => p.trendingTag);
  res.json(trending);
});

// GET single product by id
router.get('/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// POST create new product
router.post('/', (req, res) => {
  try {
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
      stock
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Product name is required' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ error: 'Product category is required' });
    }

    const parsedPrice = parseFloat(price) || 0;
    const parsedOriginalPrice = parseFloat(originalPrice) || parsedPrice;

    // Calculate discount % if not explicitly provided
    let calculatedDiscount = parseInt(discount);
    if (isNaN(calculatedDiscount) || calculatedDiscount <= 0) {
      if (parsedOriginalPrice > parsedPrice && parsedOriginalPrice > 0) {
        calculatedDiscount = Math.round(((parsedOriginalPrice - parsedPrice) / parsedOriginalPrice) * 100);
      } else {
        calculatedDiscount = 0;
      }
    }

    // Auto-generate next unique ID
    const maxId = products.reduce((max, p) => (p.id > max ? p.id : max), 0);
    const newId = maxId + 1;

    // Handle images array
    let processedImages = [];
    if (Array.isArray(images) && images.length > 0) {
      processedImages = images.filter(img => typeof img === 'string' && img.trim().length > 0);
    }
    if (processedImages.length === 0) {
      processedImages = ['/images/headphones.png']; // Default product image fallback
    }

    // Handle highlights array
    let processedHighlights = [];
    if (Array.isArray(highlights)) {
      processedHighlights = highlights.filter(h => typeof h === 'string' && h.trim().length > 0);
    } else if (typeof highlights === 'string') {
      processedHighlights = highlights.split('\n').map(h => h.trim()).filter(Boolean);
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
      trendingTag: trendingTag ? String(trendingTag).trim() : (isTopDeal ? '🔥 Deal of the Day' : ''),
      freeDelivery: freeDelivery !== undefined ? Boolean(freeDelivery) : true,
      deliveryBy: deliveryBy?.trim() || 'Tomorrow, 2 PM',
      deliveryHighlight: deliveryHighlight?.trim() || 'Free Delivery for Prime members',
      highlights: processedHighlights.length > 0 ? processedHighlights : [
        'Genuine authentic manufacturer product',
        '100% Brand new sealed pack with invoice',
        'Express fast doorstep shipping'
      ],
      colors: Array.isArray(colors) && colors.length > 0 ? colors : [
        { name: 'Standard Edition', hex: '#2C2C2C', image: processedImages[0] }
      ],
      bankOffers: [
        { type: "Bank Offer", description: "10% Instant Discount on select Bank Credit Cards", hasTC: true },
        { type: "Special Price", description: `Flat ₹${Math.max(100, Math.round(parsedPrice * 0.05))} off on online prepaid payment`, hasTC: false }
      ],
      warranty: warranty || {
        replacement: '7 Days',
        cod: true,
        brandWarranty: '1 Year Warranty'
      },
      stock: parseInt(stock) || 50,
      createdAt: new Date().toISOString()
    };

    // Prepend product so it immediately shows up at top of product listings
    products.unshift(newProduct);
    saveProductsToFile();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: newProduct
    });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product', details: err.message });
  }
});

// PUT update product by id
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const existing = products[index];
    const updates = req.body;

    const parsedPrice = updates.price !== undefined ? parseFloat(updates.price) : existing.price;
    const parsedOriginalPrice = updates.originalPrice !== undefined ? parseFloat(updates.originalPrice) : existing.originalPrice;

    let calculatedDiscount = updates.discount !== undefined ? parseInt(updates.discount) : existing.discount;
    if (updates.price !== undefined || updates.originalPrice !== undefined) {
      if (parsedOriginalPrice > parsedPrice && parsedOriginalPrice > 0) {
        calculatedDiscount = Math.round(((parsedOriginalPrice - parsedPrice) / parsedOriginalPrice) * 100);
      }
    }

    const updatedProduct = {
      ...existing,
      ...updates,
      id: id, // Immutable ID
      price: parsedPrice,
      originalPrice: parsedOriginalPrice,
      discount: calculatedDiscount,
      images: Array.isArray(updates.images) && updates.images.length > 0 ? updates.images : existing.images,
      updatedAt: new Date().toISOString()
    };

    products[index] = updatedProduct;
    saveProductsToFile();

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product', details: err.message });
  }
});

// DELETE remove product by id
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const deleted = products.splice(index, 1)[0];
    saveProductsToFile();

    res.json({
      success: true,
      message: 'Product deleted successfully',
      deletedId: id,
      deletedName: deleted.name
    });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product', details: err.message });
  }
});

// PATCH toggle Top Deal flag
router.patch('/:id/toggle-deal', (req, res) => {
  const id = parseInt(req.params.id);
  const product = products.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  product.isTopDeal = !product.isTopDeal;
  saveProductsToFile();

  if (product.isTopDeal) {
    try {
      pushNotification({
        title: `🔥 Deal Alert: ${product.name.slice(0, 36)}...`,
        desc: `Special price drop on ${product.name}. Now at ₹${product.price} (${product.discount}% OFF)!`,
        category: 'offers',
        link: `/product/${product.id}`,
        image: product.images?.[0] || '/images/headphones.png',
        icon: '🔥',
        badgeColor: '#ef4444'
      });
    } catch (e) {
      console.error('Failed to emit deal notification:', e);
    }
  }

  res.json({
    success: true,
    message: `Top deal ${product.isTopDeal ? 'enabled' : 'disabled'}`,
    isTopDeal: product.isTopDeal
  });
});

module.exports = router;
