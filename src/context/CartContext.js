'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const CartContext = createContext();

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [priceDetails, setPriceDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [superCoinsUsed, setSuperCoinsUsed] = useState(true);
  const [appliedCoupon, setAppliedCoupon] = useState('PULSEFIRST');

  // Wishlist State with initial demo products
  const [wishlistItems, setWishlistItems] = useState([
    {
      id: 1,
      name: "NovaSound Pro ANC Wireless Headphones with 50H Playtime (Matte Obsidian)",
      brand: "NovaSound",
      category: "Audio Gear",
      price: 2499,
      originalPrice: 6999,
      discount: 64,
      rating: 4.4,
      ratingCount: 38912,
      images: ["/images/headphones.png"],
      isAssured: true,
      inStock: true
    },
    {
      id: 2,
      name: "Ultra Smartwatch AMOLED Display with SpO2, Heart Rate & GPS Tracking",
      brand: "Apex",
      category: "Electronics",
      price: 1999,
      originalPrice: 7999,
      discount: 75,
      rating: 4.6,
      ratingCount: 19430,
      images: ["/images/smartwatch.png"],
      isAssured: true,
      inStock: true
    },
    {
      id: 7,
      name: "Braided Fast Charging Type-C Cable 65W (1.5m, Ultra Durable)",
      brand: "TechElectro",
      category: "Electronics",
      price: 349,
      originalPrice: 999,
      discount: 65,
      rating: 4.3,
      ratingCount: 12400,
      images: ["/images/usb-cable.png"],
      isAssured: true,
      inStock: true
    }
  ]);

  const addToWishlist = useCallback((product) => {
    setWishlistItems(prev => {
      if (prev.some(p => p.id === product.id)) return prev;
      return [product, ...prev];
    });
  }, []);

  const removeFromWishlist = useCallback((productId) => {
    setWishlistItems(prev => prev.filter(p => p.id !== productId));
  }, []);

  const isInWishlist = useCallback((productId) => {
    return wishlistItems.some(p => p.id === productId);
  }, [wishlistItems]);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/cart`);
      const data = await res.json();
      setCartItems(data.items);
      setPriceDetails(data.priceDetails);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (product, color, quantity = 1, customImage = null) => {
    try {
      await fetch(`${API_URL}/api/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          name: `${product.name} (${color})`,
          image: customImage || product.images[0],
          price: product.price,
          originalPrice: product.originalPrice,
          discount: product.discount,
          seller: product.seller,
          color,
          quantity,
          isAssured: product.isAssured,
          deliveryBy: product.deliveryBy,
        }),
      });
      await fetchCart();
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  }, [fetchCart]);

  const updateQuantity = useCallback(async (itemId, quantity) => {
    try {
      await fetch(`${API_URL}/api/cart/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, quantity }),
      });
      await fetchCart();
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  }, [fetchCart]);

  const removeFromCart = useCallback(async (itemId) => {
    try {
      await fetch(`${API_URL}/api/cart/remove/${itemId}`, {
        method: 'DELETE',
      });
      await fetchCart();
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  }, [fetchCart]);

  const toggleSuperCoins = useCallback(() => {
    setSuperCoinsUsed(prev => !prev);
  }, []);

  const clearCart = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/cart/clear`, {
        method: 'DELETE',
      });
      await fetchCart();
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  }, [fetchCart]);

  const placeOrder = useCallback(async (orderData) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/place`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      const data = await res.json();
      if (data.success) {
        await clearCart();
        return data.order;
      }
      throw new Error(data.error || 'Failed to place order');
    } catch (err) {
      console.error('Order placement error:', err);
      throw err;
    }
  }, [clearCart]);

  const applyCoupon = useCallback((code) => {
    setAppliedCoupon(code);
  }, []);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      priceDetails,
      loading,
      cartCount,
      superCoinsUsed,
      appliedCoupon,
      wishlistItems,
      wishlistCount: wishlistItems.length,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      placeOrder,
      toggleSuperCoins,
      applyCoupon,
      fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
