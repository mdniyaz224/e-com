'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/formatPrice';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, superCoinsUsed, appliedCoupon, placeOrder } = useCart();

  // Address state
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddr, setNewAddr] = useState({
    name: '',
    phone: '',
    pincode: '',
    address: '',
    city: '',
    type: 'HOME',
  });

  useEffect(() => {
    fetch(`${API_URL}/api/user`)
      .then((r) => r.json())
      .then((data) => {
        if (data.addresses && data.addresses.length > 0) {
          const mapped = data.addresses.map((a) => ({
            id: a.id,
            name: a.name,
            phone: a.phone || '',
            pincode: a.pincode,
            address: a.address,
            city: a.city,
            type: a.label || 'HOME',
            isDefault: a.isDefault,
          }));
          setAddresses(mapped);
          const def = mapped.find((a) => a.isDefault) || mapped[0];
          setSelectedAddressId(def.id);
        } else {
          setAddresses([]);
          setShowNewAddressForm(true);
        }
      })
      .catch(() => {
        setAddresses([]);
        setShowNewAddressForm(true);
      });
  }, []);

  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiApp, setUpiApp] = useState('gpay');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If cart is empty and user directly visits /checkout
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className={styles.checkoutPage}>
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => router.push('/cart')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <span className={styles.topBarTitle}>Order Checkout</span>
        </div>
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <h3>Your cart is empty</h3>
          <p style={{ color: '#888', marginTop: '8px', marginBottom: '20px' }}>
            Add items to your cart before proceeding to checkout.
          </p>
          <button
            onClick={() => router.push('/')}
            style={{
              background: '#2874F0',
              color: 'white',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '4px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Explore Products
          </button>
        </div>
      </div>
    );
  }

  // Calculate pricing
  const calculatedOriginalPrice = cartItems.reduce(
    (sum, item) => sum + (item.originalPrice || item.price * 1.5) * item.quantity,
    0
  );
  const calculatedItemsPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discountAmount = calculatedOriginalPrice - calculatedItemsPrice;
  const superCoinDiscount = superCoinsUsed ? 100 : 0;
  const couponDiscount = appliedCoupon ? 200 : 0;
  const totalAmount = Math.max(0, calculatedItemsPrice - superCoinDiscount - couponDiscount);
  const totalSavings = discountAmount + superCoinDiscount + couponDiscount;

  const handleAddNewAddress = (e) => {
    e.preventDefault();
    if (!newAddr.name || !newAddr.phone || !newAddr.address || !newAddr.pincode) {
      alert('Please fill out all address fields');
      return;
    }
    const created = {
      id: Date.now(),
      ...newAddr,
      isDefault: false,
    };
    setAddresses((prev) => [...prev, created]);
    setSelectedAddressId(created.id);
    setShowNewAddressForm(false);
    setNewAddr({ name: '', phone: '', pincode: '', address: '', city: '', type: 'HOME' });
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    try {
      const selectedAddr = addresses.find((a) => a.id === selectedAddressId) || addresses[0];
      if (!selectedAddr) {
        alert('Please add a delivery address before placing your order.');
        setShowNewAddressForm(true);
        setIsSubmitting(false);
        return;
      }
      const methodLabels = {
        upi: `UPI (${upiApp === 'gpay' ? 'Google Pay' : upiApp === 'phonepe' ? 'PhonePe' : 'Paytm'})`,
        card: 'Credit / Debit Card',
        netbanking: 'Net Banking',
        cod: 'Cash on Delivery',
        pulsepay: 'PulsePay Later',
      };

      const orderPayload = {
        items: cartItems,
        address: selectedAddr,
        paymentMethod: methodLabels[paymentMethod] || paymentMethod,
        totalAmount,
        savings: totalSavings,
      };

      const createdOrder = await placeOrder(orderPayload);
      router.push(`/order-success?orderId=${createdOrder.id}`);
    } catch (err) {
      alert('Failed to place order: ' + (err.message || 'Please try again.'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.checkoutPage}>
      {/* Top Header */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => router.push('/cart')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <span className={styles.topBarTitle}>Order Checkout</span>
      </div>

      {/* 3-Step Progress Indicator */}
      <div className={styles.progressContainer}>
        <div className={`${styles.step} ${styles.stepDone}`}>
          <span className={styles.stepNum}>✓</span>
          <span>Cart</span>
        </div>
        <div className={styles.stepLine}></div>
        <div className={`${styles.step} ${styles.stepActive}`}>
          <span className={styles.stepNum}>2</span>
          <span>Address</span>
        </div>
        <div className={styles.stepLine}></div>
        <div className={`${styles.step} ${styles.stepActive}`}>
          <span className={styles.stepNum}>3</span>
          <span>Payment</span>
        </div>
      </div>

      {/* Responsive Checkout Grid: Main steps on left, Price summary on right */}
      <div className={styles.checkoutDesktopGrid}>
        <div className={styles.checkoutMainColumn}>
          {/* 1. Delivery Address Selection */}
          <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2874F0" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            Select Delivery Address
          </span>
          {!showNewAddressForm && (
            <button
              className={styles.addBtn}
              onClick={() => setShowNewAddressForm(true)}
            >
              + Add New
            </button>
          )}
        </div>

        <div className={styles.addressList}>
          {addresses.length === 0 && !showNewAddressForm && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
              <p style={{ margin: '0 0 12px', fontSize: '14px' }}>No delivery address added yet.</p>
              <button
                type="button"
                className={styles.addBtn}
                onClick={() => setShowNewAddressForm(true)}
              >
                + Add Delivery Address
              </button>
            </div>
          )}
          {addresses.map((addr) => {
            const isSelected = selectedAddressId === addr.id;
            return (
              <div
                key={addr.id}
                className={`${styles.addressCard} ${isSelected ? styles.addressSelected : ''}`}
                onClick={() => setSelectedAddressId(addr.id)}
              >
                <div className={`${styles.radioCircle} ${isSelected ? styles.radioSelected : ''}`}>
                  {isSelected && <div className={styles.radioDot}></div>}
                </div>
                <div className={styles.addressDetails}>
                  <div className={styles.nameRow}>
                    <span className={styles.personName}>{addr.name}</span>
                    <span className={styles.typeBadge}>{addr.type}</span>
                  </div>
                  <div className={styles.fullAddress}>
                    {addr.address}, {addr.city} - <strong>{addr.pincode}</strong>
                  </div>
                  <div className={styles.phoneNum}>Contact: {addr.phone}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Address Form Inline */}
        {showNewAddressForm && (
          <form className={styles.newAddressForm} onSubmit={handleAddNewAddress}>
            <h5 style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>Add New Address</h5>
            <div className={styles.inputRow}>
              <input
                className={styles.inputField}
                placeholder="Full Name *"
                value={newAddr.name}
                onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                required
              />
              <input
                className={styles.inputField}
                placeholder="Mobile (10 digits) *"
                value={newAddr.phone}
                onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                required
              />
            </div>
            <div className={styles.inputRow}>
              <input
                className={styles.inputField}
                placeholder="6-digit Pincode *"
                value={newAddr.pincode}
                onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                required
              />
              <input
                className={styles.inputField}
                placeholder="City *"
                value={newAddr.city}
                onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                required
              />
            </div>
            <input
              className={styles.inputField}
              placeholder="Flat, House no., Building, Street Area *"
              value={newAddr.address}
              onChange={(e) => setNewAddr({ ...newAddr, address: e.target.value })}
              required
            />
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setShowNewAddressForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className={styles.saveAddressBtn}>
                Save & Deliver Here
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. Order Items Review */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2874F0" strokeWidth="2">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
            Items in Order ({cartItems.length})
          </span>
          <button className={styles.addBtn} onClick={() => router.push('/cart')}>
            Modify
          </button>
        </div>

        {cartItems.map((item) => (
          <div key={item.id} className={styles.orderItemRow}>
            <div className={styles.itemIconBox}>
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }}
                />
              ) : (
                '🛍️'
              )}
            </div>
            <div className={styles.itemInfoCol}>
              <div className={styles.itemHeading}>{item.name}</div>
              <div className={styles.itemSubtitle}>
                Qty: {item.quantity} • Delivery: {item.deliveryBy || 'Tomorrow, 2 PM'}
              </div>
            </div>
            <div className={styles.itemPriceCol}>{formatPrice(item.price * item.quantity)}</div>
          </div>
        ))}
      </div>

      {/* 3. Payment Method Selection */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2874F0" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
            Select Payment Option
          </span>
        </div>

        <div className={styles.paymentList}>
          {/* UPI */}
          <div
            className={`${styles.paymentOption} ${paymentMethod === 'upi' ? styles.paymentSelected : ''}`}
            onClick={() => setPaymentMethod('upi')}
          >
            <div className={`${styles.radioCircle} ${paymentMethod === 'upi' ? styles.radioSelected : ''}`}>
              {paymentMethod === 'upi' && <div className={styles.radioDot}></div>}
            </div>
            <div className={styles.paymentIconWrap}>⚡</div>
            <div className={styles.paymentText}>
              <div className={styles.paymentTitle}>
                UPI (Instant & Free)
                <span className={styles.paymentTag}>Recommended</span>
              </div>
              <div className={styles.paymentSub}>Google Pay, PhonePe, Paytm, or UPI ID</div>
              {paymentMethod === 'upi' && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  {['gpay', 'phonepe', 'paytm'].map((app) => (
                    <button
                      key={app}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUpiApp(app);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: upiApp === app ? '1.5px solid #2874f0' : '1px solid #ccc',
                        background: upiApp === app ? '#f0f5ff' : 'white',
                        fontSize: '12px',
                        fontWeight: upiApp === app ? '700' : '500',
                        cursor: 'pointer',
                      }}
                    >
                      {app === 'gpay' ? 'Google Pay' : app === 'phonepe' ? 'PhonePe' : 'Paytm'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PulsePay Later */}
          <div
            className={`${styles.paymentOption} ${paymentMethod === 'pulsepay' ? styles.paymentSelected : ''}`}
            onClick={() => setPaymentMethod('pulsepay')}
          >
            <div className={`${styles.radioCircle} ${paymentMethod === 'pulsepay' ? styles.radioSelected : ''}`}>
              {paymentMethod === 'pulsepay' && <div className={styles.radioDot}></div>}
            </div>
            <div className={styles.paymentIconWrap}>💳</div>
            <div className={styles.paymentText}>
              <div className={styles.paymentTitle}>
                PulsePay Later
                <span className={styles.paymentTag}>Available ₹22,452</span>
              </div>
              <div className={styles.paymentSub}>Pay next month with 0% interest</div>
            </div>
          </div>

          {/* Credit / Debit Card */}
          <div
            className={`${styles.paymentOption} ${paymentMethod === 'card' ? styles.paymentSelected : ''}`}
            onClick={() => setPaymentMethod('card')}
          >
            <div className={`${styles.radioCircle} ${paymentMethod === 'card' ? styles.radioSelected : ''}`}>
              {paymentMethod === 'card' && <div className={styles.radioDot}></div>}
            </div>
            <div className={styles.paymentIconWrap}>💳</div>
            <div className={styles.paymentText}>
              <div className={styles.paymentTitle}>Credit / Debit / ATM Card</div>
              <div className={styles.paymentSub}>Visa, MasterCard, Rupay, Maestro</div>
              {paymentMethod === 'card' && (
                <div className={styles.cardSubForm} onClick={(e) => e.stopPropagation()}>
                  <input
                    className={styles.inputField}
                    placeholder="Card Number (XXXX XXXX XXXX XXXX)"
                    maxLength="19"
                  />
                  <div className={styles.inputRow}>
                    <input className={styles.inputField} placeholder="MM/YY" maxLength="5" />
                    <input className={styles.inputField} placeholder="CVV" maxLength="4" type="password" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cash on Delivery */}
          <div
            className={`${styles.paymentOption} ${paymentMethod === 'cod' ? styles.paymentSelected : ''}`}
            onClick={() => setPaymentMethod('cod')}
          >
            <div className={`${styles.radioCircle} ${paymentMethod === 'cod' ? styles.radioSelected : ''}`}>
              {paymentMethod === 'cod' && <div className={styles.radioDot}></div>}
            </div>
            <div className={styles.paymentIconWrap}>💵</div>
              <div className={styles.paymentText}>
                <div className={styles.paymentTitle}>Cash on Delivery (COD)</div>
                <div className={styles.paymentSub}>Pay cash or UPI at your doorstep</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Price summary & desktop confirm action */}
      <div className={styles.checkoutSidebarColumn}>
          {/* 4. Price Breakdown Details */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Price Summary</span>
            </div>

            <div className={styles.priceBreakdown}>
              <div className={styles.priceLine}>
                <span>Price ({cartItems.length} items)</span>
                <span>{formatPrice(calculatedOriginalPrice)}</span>
              </div>

              <div className={styles.priceLine}>
                <span>Special Discount</span>
                <span className={styles.priceGreen}>-{formatPrice(discountAmount)}</span>
              </div>

              {superCoinsUsed && (
                <div className={styles.priceLine}>
                  <span>SuperCoin Savings</span>
                  <span className={styles.priceGreen}>-₹100</span>
                </div>
              )}

              {appliedCoupon && (
                <div className={styles.priceLine}>
                  <span>Coupon Savings ({appliedCoupon})</span>
                  <span className={styles.priceGreen}>-₹200</span>
                </div>
              )}

              <div className={styles.priceLine}>
                <span>Delivery Fee</span>
                <span className={styles.priceGreen}>FREE</span>
              </div>

              <div className={styles.totalLine}>
                <span>Amount Payable</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>

              <div className={styles.savingsNote}>
                🎉 Total savings on this order: {formatPrice(totalSavings)}
              </div>
            </div>
          </div>

          <div className={styles.desktopConfirmWrapper}>
            <button
              className={styles.desktopConfirmBtn}
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing Payment...' : `Confirm & Place Order (${formatPrice(totalAmount)})`}
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Place Order Action Bar */}
      <div className={styles.bottomConfirmBar}>
        <div className={styles.confirmLeft}>
          <div className={styles.confirmTotal}>{formatPrice(totalAmount)}</div>
          <div className={styles.confirmSub}>Total Payable</div>
        </div>
        <button
          className={styles.confirmBtn}
          onClick={handlePlaceOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className={styles.spinner}></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>Confirm & Place Order</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
