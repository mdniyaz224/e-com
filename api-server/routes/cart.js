const express = require('express');
const router = express.Router();

// In-memory cart storage
let cartItems = [];

// GET cart
router.get('/', (req, res) => {
  const subtotal = cartItems.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = subtotal - total;
  const superCoinSavings = 100;
  const couponDiscount = 200;
  const deliveryCharge = 0;

  res.json({
    items: cartItems,
    itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    priceDetails: {
      subtotal,
      discount,
      superCoinSavings,
      couponCode: "PULSEFIRST",
      couponDiscount,
      protectFee: 0,
      deliveryCharge,
      deliveryOriginal: 80,
      total: total - superCoinSavings - couponDiscount + deliveryCharge,
      totalSavings: discount + superCoinSavings + couponDiscount
    }
  });
});

// POST add to cart
router.post('/add', (req, res) => {
  const { productId, name, image, price, originalPrice, discount, seller, color, quantity, isAssured, deliveryBy } = req.body;
  const existing = cartItems.find(item => item.productId === productId && item.color === color);

  if (existing) {
    existing.quantity += quantity || 1;
  } else {
    cartItems.push({
      id: cartItems.length + 1,
      productId,
      name,
      image,
      price,
      originalPrice,
      discount,
      seller,
      color,
      quantity: quantity || 1,
      isAssured: isAssured || false,
      deliveryBy: deliveryBy || "3-5 days",
      deliveryFree: true
    });
  }

  res.json({ success: true, cart: cartItems });
});

// PUT update quantity
router.put('/update', (req, res) => {
  const { id, quantity } = req.body;
  const item = cartItems.find(i => i.id === id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  if (quantity <= 0) {
    cartItems = cartItems.filter(i => i.id !== id);
  } else {
    item.quantity = quantity;
  }

  res.json({ success: true, cart: cartItems });
});

// DELETE clear all cart items
router.delete('/clear', (req, res) => {
  cartItems = [];
  res.json({ success: true, cart: cartItems });
});

// DELETE remove item
router.delete('/remove/:id', (req, res) => {
  cartItems = cartItems.filter(i => i.id !== parseInt(req.params.id));
  res.json({ success: true, cart: cartItems });
});

module.exports = router;
