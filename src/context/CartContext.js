'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const CartContext = createContext();

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function calculatePriceDetails(items, superCoinsUsed = true, appliedCoupon = 'PULSEFIRST') {
  const safeItems = Array.isArray(items) ? items : [];
  const subtotal = safeItems.reduce((sum, item) => sum + (item.originalPrice || item.price) * (item.quantity || 1), 0);
  const totalRaw = safeItems.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const discount = subtotal - totalRaw;
  const superCoinSavings = superCoinsUsed && safeItems.length > 0 ? 100 : 0;
  const couponDiscount = appliedCoupon && safeItems.length > 0 ? 200 : 0;
  const deliveryCharge = 0;
  const total = Math.max(0, totalRaw - superCoinSavings - couponDiscount + deliveryCharge);
  const totalSavings = discount + superCoinSavings + couponDiscount;

  return {
    subtotal,
    discount,
    superCoinSavings,
    couponCode: appliedCoupon || 'PULSEFIRST',
    couponDiscount,
    protectFee: 0,
    deliveryCharge,
    deliveryOriginal: 80,
    total,
    totalSavings,
  };
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [priceDetails, setPriceDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [superCoinsUsed, setSuperCoinsUsed] = useState(true);
  const [appliedCoupon, setAppliedCoupon] = useState('PULSEFIRST');

  // Wishlist State (starts empty for real live users)
  const [wishlistItems, setWishlistItems] = useState([]);

  // Load from localStorage on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCart = localStorage.getItem('pulsekart_cart');
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCartItems(parsed);
            setPriceDetails(calculatePriceDetails(parsed, superCoinsUsed, appliedCoupon));
          }
        }

        const savedWishlist = localStorage.getItem('pulsekart_wishlist');
        if (savedWishlist) {
          const parsedW = JSON.parse(savedWishlist);
          if (Array.isArray(parsedW)) {
            setWishlistItems(parsedW);
          }
        }
      } catch (e) {
        console.warn('Failed to parse localStorage cache:', e);
      }
    }
  }, []);

  const addToWishlist = useCallback((product) => {
    setWishlistItems(prev => {
      if (prev.some(p => p.id === product.id)) return prev;
      const updated = [product, ...prev];
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('pulsekart_wishlist', JSON.stringify(updated)); } catch {}
      }
      return updated;
    });
  }, []);

  const removeFromWishlist = useCallback((productId) => {
    setWishlistItems(prev => {
      const updated = prev.filter(p => p.id !== productId);
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('pulsekart_wishlist', JSON.stringify(updated)); } catch {}
      }
      return updated;
    });
  }, []);

  const isInWishlist = useCallback((productId) => {
    return wishlistItems.some(p => p.id === productId);
  }, [wishlistItems]);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/cart?_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data.items)) {
        if (data.items.length > 0) {
          setCartItems(data.items);
          setPriceDetails(data.priceDetails || calculatePriceDetails(data.items, superCoinsUsed, appliedCoupon));
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('pulsekart_cart', JSON.stringify(data.items));
            } catch {}
          }
        } else {
          // If server returns empty, check if client has local items in localStorage
          let localItems = [];
          if (typeof window !== 'undefined') {
            try {
              const saved = localStorage.getItem('pulsekart_cart');
              if (saved) localItems = JSON.parse(saved);
            } catch {}
          }
          if (Array.isArray(localItems) && localItems.length > 0) {
            setCartItems(localItems);
            setPriceDetails(calculatePriceDetails(localItems, superCoinsUsed, appliedCoupon));
            // Sync local items to server in background
            for (const item of localItems) {
              fetch(`${API_URL}/api/cart/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item),
              }).catch(() => {});
            }
          } else {
            setCartItems([]);
            setPriceDetails(data.priceDetails || calculatePriceDetails([], superCoinsUsed, appliedCoupon));
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch cart from server:', err.message);
    } finally {
      setLoading(false);
    }
  }, [superCoinsUsed, appliedCoupon]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (product, color, quantity = 1, customImage = null) => {
    if (!product) return;

    const safeImage =
      customImage ||
      (Array.isArray(product.images) && product.images[0]) ||
      product.image ||
      '/images/headphones.png';

    const safeColor = color || (product.colors?.[0]?.name) || 'Standard';

    const newItem = {
      id: Date.now(),
      productId: product.id,
      name: `${product.name} (${safeColor})`,
      image: safeImage,
      price: product.price || 0,
      originalPrice: product.originalPrice || product.price || 0,
      discount: product.discount || 0,
      seller: product.seller || 'PulseKart Verified',
      color: safeColor,
      quantity: quantity || 1,
      isAssured: !!product.isAssured,
      deliveryBy: product.deliveryBy || 'Tomorrow, 2 PM',
      deliveryFree: true,
    };

    // 1. Optimistic Local Update (0ms instant!)
    setCartItems(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const existingIdx = safePrev.findIndex(item => item.productId === product.id && item.color === safeColor);
      let updated;
      if (existingIdx !== -1) {
        updated = [...safePrev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + (quantity || 1),
        };
      } else {
        updated = [newItem, ...safePrev];
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('pulsekart_cart', JSON.stringify(updated));
        } catch {}
      }
      setPriceDetails(calculatePriceDetails(updated, superCoinsUsed, appliedCoupon));
      return updated;
    });

    // 2. Background Sync with Server API
    try {
      await fetch(`${API_URL}/api/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
    } catch (err) {
      console.warn('Background cart sync warning:', err.message);
    }
  }, [superCoinsUsed, appliedCoupon]);

  const updateQuantity = useCallback(async (itemId, quantity) => {
    setCartItems(prev => {
      let updated;
      if (quantity <= 0) {
        updated = prev.filter(i => i.id !== itemId);
      } else {
        updated = prev.map(i => (i.id === itemId ? { ...i, quantity } : i));
      }
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('pulsekart_cart', JSON.stringify(updated));
        } catch {}
      }
      setPriceDetails(calculatePriceDetails(updated, superCoinsUsed, appliedCoupon));
      return updated;
    });

    try {
      await fetch(`${API_URL}/api/cart/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, quantity }),
      });
    } catch (err) {
      console.warn('Failed to update quantity on server:', err.message);
    }
  }, [superCoinsUsed, appliedCoupon]);

  const removeFromCart = useCallback(async (itemId) => {
    setCartItems(prev => {
      const updated = prev.filter(i => i.id !== itemId && i.productId !== itemId);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('pulsekart_cart', JSON.stringify(updated));
        } catch {}
      }
      setPriceDetails(calculatePriceDetails(updated, superCoinsUsed, appliedCoupon));
      return updated;
    });

    try {
      await fetch(`${API_URL}/api/cart/remove/${itemId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Failed to remove item on server:', err.message);
    }
  }, [superCoinsUsed, appliedCoupon]);

  const toggleSuperCoins = useCallback(() => {
    setSuperCoinsUsed(prev => {
      const next = !prev;
      setPriceDetails(calculatePriceDetails(cartItems, next, appliedCoupon));
      return next;
    });
  }, [cartItems, appliedCoupon]);

  const applyCoupon = useCallback((code) => {
    setAppliedCoupon(code);
    setPriceDetails(calculatePriceDetails(cartItems, superCoinsUsed, code));
  }, [cartItems, superCoinsUsed]);

  const clearCart = useCallback(async () => {
    setCartItems([]);
    setPriceDetails(calculatePriceDetails([], superCoinsUsed, appliedCoupon));
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('pulsekart_cart');
      } catch {}
    }

    try {
      await fetch(`${API_URL}/api/cart/clear`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Failed to clear cart on server:', err.message);
    }
  }, [superCoinsUsed, appliedCoupon]);

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

  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      priceDetails,
      loading,
      cartLoading: loading,
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
