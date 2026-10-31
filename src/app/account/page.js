'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useNotifications } from '@/context/NotificationContext';
import { formatPrice } from '@/utils/formatPrice';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function AccountPage() {
  const router = useRouter();
  const { user: authUser, isAuthenticated, isLoading: isAuthLoading, openAuthModal, logout: authLogout, updateUser } = useAuth();
  const { wishlistCount } = useCart();
  const { unreadCount } = useNotifications();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isCardsModalOpen, setIsCardsModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);

  // Profile Edit Form State
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Male',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState({ type: null, message: '' });

  // New Address State
  const [newAddr, setNewAddr] = useState({
    name: '',
    phone: '',
    pincode: '',
    address: '',
    city: 'Bengaluru',
    label: 'HOME',
  });

  const loadData = async () => {
    if (!isAuthenticated && !isAuthLoading) return;
    try {
      const [uRes, oRes] = await Promise.all([
        fetch(`${API_URL}/api/user`),
        fetch(`${API_URL}/api/orders`),
      ]);
      const uData = uRes.ok ? await uRes.json() : null;
      const oData = oRes.ok ? await oRes.json() : null;

      if (uData) {
        setUser(uData);
        if (updateUser) updateUser(uData);
      }
      if (oData && oData.orders) {
        setOrders(oData.orders);
      }
    } catch (err) {
      console.error('Failed to load profile data:', err);
    }
  };

  useEffect(() => {
    loadData();

    // Auto-sync polling every 10s for live fulfillment updates when tab is active
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadData();
      }
    }, 10000);

    const onFocus = () => loadData();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const handleOpenEditModal = () => {
    const current = user || userData;
    setEditFormData({
      name: current.name || '',
      email: current.email || '',
      phone: current.phone || '',
      gender: current.gender || 'Male',
    });
    setProfileFeedback({ type: null, message: '' });
    setIsEditModalOpen(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editFormData.name.trim()) {
      setProfileFeedback({ type: 'error', message: 'Please enter your full name.' });
      return;
    }
    if (!editFormData.email.trim()) {
      setProfileFeedback({ type: 'error', message: 'Please enter your email address.' });
      return;
    }
    if (!editFormData.phone.trim()) {
      setProfileFeedback({ type: 'error', message: 'Please enter your mobile phone number.' });
      return;
    }

    setIsSavingProfile(true);
    setProfileFeedback({ type: null, message: '' });

    try {
      const res = await fetch(`${API_URL}/api/user`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        setProfileFeedback({ type: 'success', message: '✓ Profile details saved successfully!' });
        setTimeout(() => {
          setIsEditModalOpen(false);
          setProfileFeedback({ type: null, message: '' });
        }, 750);
      } else {
        setProfileFeedback({
          type: 'error',
          message: data.error || 'Failed to update profile. Please try again.',
        });
      }
    } catch (err) {
      setProfileFeedback({
        type: 'error',
        message: 'Network error updating profile: ' + err.message,
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newAddr.name || !newAddr.address || !newAddr.pincode) {
      alert('Please fill out all address details');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/user/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddr),
      });
      const data = await res.json();
      if (data.success) {
        setUser((prev) => ({ ...prev, addresses: data.addresses }));
        setNewAddr({ name: '', phone: '', pincode: '', address: '', city: 'Bengaluru', label: 'HOME' });
        alert('Address added successfully!');
      }
    } catch (err) {
      alert('Failed to add address: ' + err.message);
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/user/addresses/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setUser((prev) => ({ ...prev, addresses: data.addresses }));
      }
    } catch (err) {
      alert('Failed to delete address: ' + err.message);
    }
  };

  const userData = user || authUser || {
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    email: 'rahul.sharma@pulsekart.in',
    gender: 'Male',
    isPlusMember: true,
    superCoins: { balance: 450 },
    pulsePay: { availableCredit: 22452, totalApproved: 25000 },
    addresses: [],
    savedCards: [],
  };

  const activeOrder = orders.length > 0 ? orders[0] : null;

  if (!isAuthenticated && !isAuthLoading) {
    return (
      <div className={styles.accountPage} style={{ padding: '30px 16px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: '540px', width: '100%', background: '#fff', borderRadius: '12px', padding: '36px 24px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ width: '84px', height: '84px', background: '#eff6ff', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '38px' }}>
            🛍️
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
            Log in to PulseKart
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5', marginBottom: '24px' }}>
            Track your deliveries, manage saved delivery addresses, check wishlist, and earn SuperCoins on every purchase.
          </p>

          <button
            onClick={() => openAuthModal('login', '/account')}
            style={{
              width: '100%',
              background: '#fb641b',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '14px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(251, 100, 27, 0.35)',
              marginBottom: '12px'
            }}
          >
            LOGIN / SIGN UP
          </button>

          <button
            onClick={() => openAuthModal('signup', '/account')}
            style={{
              width: '100%',
              background: '#fff',
              color: '#2874f0',
              border: '1px solid #c7d8ff',
              borderRadius: '4px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '26px'
            }}
          >
            New to PulseKart? Create an account
          </button>

          <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '20px', textAlign: 'left' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '12px' }}>PulseKart Member Benefits:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', color: '#64748b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#2874f0', fontWeight: 800 }}>✓</span> Live Order Tracking
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#2874f0', fontWeight: 800 }}>✓</span> SuperCoins Rewards
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#2874f0', fontWeight: 800 }}>✓</span> Saved Addresses & Cards
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#2874f0', fontWeight: 800 }}>✓</span> 24x7 Customer Support
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.accountPage}>
      {/* User Header */}
      <div className={styles.userHeader}>
        <div className={styles.profileInfo}>
          <div className={styles.avatar}>{userData.name?.charAt(0) || 'U'}</div>
          <div className={styles.userDetails}>
            <h2>{userData.name}</h2>
            <div className={styles.userEmail}>{userData.email}</div>
            <div className={styles.phone}>{userData.phone}</div>
            {userData.isPlusMember && (
              <span className={styles.plusBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Pulse Plus VIP Member
              </span>
            )}
          </div>
        </div>
        <button
          className={styles.editBtn}
          onClick={handleOpenEditModal}
          aria-label="Edit Profile"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
          Edit
        </button>
      </div>

      {/* Quick 2x2 Links */}
      <div className={styles.quickGrid}>
        <div className={styles.quickCard} onClick={() => router.push('/orders')}>
          <div className={styles.quickIcon}>📦</div>
          <div className={styles.quickText}>
            <h4>Orders ({orders.length})</h4>
            <p>Track, return & buy again</p>
          </div>
        </div>

        <div className={styles.quickCard} onClick={() => router.push('/wishlist')}>
          <div className={styles.quickIcon}>❤️</div>
          <div className={styles.quickText}>
            <h4>Wishlist ({wishlistCount || 3})</h4>
            <p>Shortlisted & saved items</p>
          </div>
        </div>

        <div className={styles.quickCard} onClick={() => router.push('/coupons')}>
          <div className={styles.quickIcon}>🏷️</div>
          <div className={styles.quickText}>
            <h4>Coupons & Rewards</h4>
            <p>5 coupons & 450 SuperCoins</p>
          </div>
        </div>

        <div className={styles.quickCard} onClick={() => router.push('/help')}>
          <div className={styles.quickIcon}>🎧</div>
          <div className={styles.quickText}>
            <h4>Help Centre</h4>
            <p>24x7 Customer Assistant</p>
          </div>
        </div>
      </div>

      {/* Active Order Tracking Section */}
      {activeOrder && (
        <div className={styles.trackingSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              Arriving {activeOrder.deliveryEstimate || 'Tomorrow by 2 PM'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => loadData()}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: '2px'
                }}
                title="Refresh order status"
              >
                🔄
              </button>
              <span
                className={styles.statusTag}
                style={
                  activeOrder.status === 'Delivered' ? { background: '#e8f5e9', color: '#2e7d32' } :
                  activeOrder.status === 'Shipped' ? { background: '#eff6ff', color: '#1d4ed8' } :
                  activeOrder.status === 'Packed' ? { background: '#fffbeb', color: '#b45309' } :
                  activeOrder.status === 'Cancelled' ? { background: '#fef2f2', color: '#b91c1c' } :
                  { background: '#e8f5e9', color: '#2e7d32' }
                }
              >
                ✓ {activeOrder.status || 'Confirmed'}
              </span>
            </div>
          </div>

          <div className={styles.orderItem}>
            <div className={styles.orderImg}>
              {activeOrder.items?.[0]?.image ? (
                <img
                  src={activeOrder.items[0].image}
                  alt="Product"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px' }}
                />
              ) : (
                '📦'
              )}
            </div>
            <div className={styles.orderInfo}>
              <h5>{activeOrder.items?.[0]?.name || 'PulseKart Order Product'}</h5>
              <p className={styles.orderDate}>
                Order #{activeOrder.id} • {formatPrice(activeOrder.totalAmount)}
              </p>
            </div>
          </div>

          {/* Dynamic Stepper */}
          <div className={styles.orderStepper}>
            <div className={styles.orderStep}>
              <div className={`${styles.stepDot} ${styles.stepDotCompleted}`}></div>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>Confirmed</span>
            </div>
            <div className={styles.orderStep}>
              <div
                className={`${styles.stepDot} ${
                  activeOrder.currentStep >= 2 ? styles.stepDotCompleted : activeOrder.currentStep === 1 ? styles.stepDotCurrent : ''
                }`}
              ></div>
              <span style={activeOrder.currentStep >= 2 ? { fontWeight: 600, color: '#1e293b' } : {}}>Packed</span>
            </div>
            <div className={styles.orderStep}>
              <div
                className={`${styles.stepDot} ${
                  activeOrder.currentStep >= 3 ? styles.stepDotCompleted : activeOrder.currentStep === 2 ? styles.stepDotCurrent : ''
                }`}
              ></div>
              <span style={activeOrder.currentStep >= 3 ? { fontWeight: 600, color: '#1e293b' } : {}}>Shipped</span>
            </div>
            <div className={styles.orderStep}>
              <div
                className={`${styles.stepDot} ${
                  activeOrder.currentStep >= 4 ? styles.stepDotCompleted : activeOrder.currentStep === 3 ? styles.stepDotCurrent : ''
                }`}
              ></div>
              <span style={activeOrder.currentStep >= 4 ? { fontWeight: 600, color: '#1e293b' } : {}}>Delivered</span>
            </div>
          </div>

          <div className={styles.trackButtons}>
            <button
              className={styles.trackBtn}
              onClick={() => router.push(`/orders/${activeOrder.id}`)}
            >
              Track Item
            </button>
            <button
              className={styles.helpBtn}
              onClick={() => router.push('/help')}
            >
              Need Help?
            </button>
          </div>
        </div>
      )}

      {/* PulsePay Credit Card */}
      <div className={styles.creditCard}>
        <div className={styles.creditTop}>
          <span className={styles.creditTitle}>PulsePay Later</span>
          <span className={styles.creditBadge}>✓ Active & Approved</span>
        </div>
        <div className={styles.creditLimit}>
          {formatPrice(userData.pulsePay?.availableCredit || 22452)}
        </div>
        <div className={styles.creditSub}>
          Available credit limit out of {formatPrice(userData.pulsePay?.totalApproved || 25000)}
        </div>
        <button
          className={styles.payBillBtn}
          onClick={() => alert('No pending dues! Next statement generates on the 1st.')}
        >
          View Statement
        </button>
      </div>

      {/* Account Settings List */}
      <div className={styles.settingsSection}>
        <div className={styles.settingItem} onClick={handleOpenEditModal}>
          <div className={styles.settingLeft}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2874F0" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <div>
              <div className={styles.settingTitle}>Profile Information</div>
              <div className={styles.settingDesc}>Name, mobile number, email & gender settings</div>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>

        <div className={styles.settingItem} onClick={() => setIsAddressModalOpen(true)}>
          <div className={styles.settingLeft}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2874F0" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <div>
              <div className={styles.settingTitle}>Saved Addresses</div>
              <div className={styles.settingDesc}>
                {userData.addresses?.length || 2} registered delivery locations
              </div>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>

        <div className={styles.settingItem} onClick={() => setIsCardsModalOpen(true)}>
          <div className={styles.settingLeft}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2874F0" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
            <div>
              <div className={styles.settingTitle}>Saved Cards & UPI</div>
              <div className={styles.settingDesc}>2 Cards saved, Google Pay linked</div>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>

        <div className={styles.settingItem} onClick={() => router.push('/notifications')}>
          <div className={styles.settingLeft}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2874F0" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <div>
              <div className={styles.settingTitle}>
                Notifications & Alerts {unreadCount > 0 && (
                  <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px', marginLeft: '6px' }}>
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className={styles.settingDesc}>Order tracking, price drops & reward alerts</div>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>

        <div
          className={styles.settingItem}
          onClick={() => alert('Language options: English (Default), हिन्दी')}
        >
          <div className={styles.settingLeft}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2874F0" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <div>
              <div className={styles.settingTitle}>Select Language</div>
              <div className={styles.settingDesc}>English / हिन्दी</div>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
        <div
          className={styles.settingItem}
          onClick={() => router.push('/admin')}
          style={{ background: '#F0F6FF', border: '1px solid #C8DDFF', borderRadius: '8px', margin: '8px 12px' }}
        >
          <div className={styles.settingLeft}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <div>
              <div className={styles.settingTitle} style={{ color: '#2874F0', fontWeight: '700' }}>Store Admin Panel</div>
              <div className={styles.settingDesc}>Upload products, manage catalog & fulfill orders</div>
            </div>
          </div>
          <span style={{ background: '#2874F0', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '12px' }}>
            ADMIN
          </span>
        </div>
      </div>

      {/* Logout */}
      <div className={styles.logoutRow}>
        <button
          className={styles.logoutBtn}
          onClick={authLogout}
        >
          Log Out of PulseKart
        </button>
      </div>

      <div className={styles.footerAppInfo}>
        PULSEKART V14.8.2 • MADE WITH PRIDE IN INDIA
      </div>

      {/* 1. Edit Profile Modal Sheet */}
      {isEditModalOpen && (
        <div className={styles.modalOverlay} onClick={() => !isSavingProfile && setIsEditModalOpen(false)}>
          <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Edit Profile Information</h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>Update your personal & contact details</p>
              </div>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSavingProfile}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {profileFeedback.message && (
              <div className={profileFeedback.type === 'success' ? styles.formAlertSuccess : styles.formAlertError}>
                <span>{profileFeedback.type === 'success' ? '✓' : '⚠️'}</span>
                <span>{profileFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Full Name</label>
                <input
                  className={styles.formInput}
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  disabled={isSavingProfile}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email Address</label>
                <input
                  className={styles.formInput}
                  type="email"
                  placeholder="name@example.com"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, email: e.target.value }))}
                  required
                  disabled={isSavingProfile}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mobile Number</label>
                <input
                  className={styles.formInput}
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  required
                  disabled={isSavingProfile}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Gender</label>
                <div className={styles.genderGroup}>
                  <div
                    className={`${styles.genderOption} ${editFormData.gender === 'Male' ? styles.genderOptionActive : ''}`}
                    onClick={() => setEditFormData((prev) => ({ ...prev, gender: 'Male' }))}
                  >
                    <span>👨</span>
                    <span>Male</span>
                  </div>
                  <div
                    className={`${styles.genderOption} ${editFormData.gender === 'Female' ? styles.genderOptionActive : ''}`}
                    onClick={() => setEditFormData((prev) => ({ ...prev, gender: 'Female' }))}
                  >
                    <span>👩</span>
                    <span>Female</span>
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelModalBtn}
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSavingProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveProfileBtn}
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? (
                    <>
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Saved Addresses Modal Sheet */}
      {isAddressModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddressModalOpen(false)}>
          <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Manage Delivery Addresses</h3>
              <button
                className={styles.closeModalBtn}
                onClick={() => setIsAddressModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {userData.addresses?.map((addr) => (
                <div
                  key={addr.id}
                  style={{
                    border: '1px solid #e0e0e0',
                    padding: '12px',
                    borderRadius: '8px',
                    background: '#fafafa',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{addr.name}</strong>
                    <span
                      style={{
                        fontSize: '10px',
                        background: '#e0e0e0',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 700,
                      }}
                    >
                      {addr.label || 'HOME'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>
                    {addr.address}, {addr.city} - {addr.pincode}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px' }}>
                    <span style={{ color: '#888' }}>Contact: {addr.phone || userData.phone}</span>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#d32f2f',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Address Form Inline */}
            <form onSubmit={handleAddAddress} style={{ borderTop: '1px dashed #ccc', paddingTop: '12px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>+ Add New Address</h4>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  className={styles.formInput}
                  placeholder="Full Name"
                  value={newAddr.name}
                  onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                  style={{ flex: 1 }}
                  required
                />
                <input
                  className={styles.formInput}
                  placeholder="Pincode"
                  value={newAddr.pincode}
                  onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                  style={{ width: '100px' }}
                  required
                />
              </div>
              <input
                className={styles.formInput}
                placeholder="Street Address / Flat No"
                value={newAddr.address}
                onChange={(e) => setNewAddr({ ...newAddr, address: e.target.value })}
                style={{ width: '100%', marginBottom: '8px' }}
                required
              />
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  className={styles.formInput}
                  placeholder="City"
                  value={newAddr.city}
                  onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                  style={{ flex: 1 }}
                  required
                />
                <select
                  className={styles.formInput}
                  value={newAddr.label}
                  onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                  style={{ width: '110px' }}
                >
                  <option value="HOME">Home</option>
                  <option value="WORK">Work</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <button type="submit" className={styles.saveProfileBtn}>
                Add Address
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Saved Cards Modal Sheet */}
      {isCardsModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCardsModalOpen(false)}>
          <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Saved Cards & UPI</h3>
              <button
                className={styles.closeModalBtn}
                onClick={() => setIsCardsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #0d47a1, #1976d2)',
                  color: 'white',
                  padding: '14px',
                  borderRadius: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span>HDFC Bank • Credit Card</span>
                  <span>VISA</span>
                </div>
                <div style={{ fontSize: '18px', letterSpacing: '2px', margin: '14px 0 10px' }}>
                  •••• •••• •••• 4921
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', opacity: 0.9 }}>
                  <span>{userData.name}</span>
                  <span>Expires: 09/28</span>
                </div>
              </div>

              <div
                style={{
                  background: 'linear-gradient(135deg, #880e4f, #c2185b)',
                  color: 'white',
                  padding: '14px',
                  borderRadius: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span>PulseKart Axis Bank Card</span>
                  <span>MasterCard</span>
                </div>
                <div style={{ fontSize: '18px', letterSpacing: '2px', margin: '14px 0 10px' }}>
                  •••• •••• •••• 8832
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', opacity: 0.9 }}>
                  <span>{userData.name}</span>
                  <span>Expires: 11/27</span>
                </div>
              </div>

              <div
                style={{
                  border: '1px solid #e0e0e0',
                  padding: '12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '6px',
                }}
              >
                <div style={{ fontSize: '20px' }}>📱</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Google Pay UPI</div>
                  <div style={{ fontSize: '11px', color: '#777' }}>Primary UPI ID: rahul.sharma@okhdfcbank</div>
                </div>
                <span style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 700 }}>VERIFIED</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Orders History Modal Sheet */}
      {isOrdersModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsOrdersModalOpen(false)}>
          <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Your Orders ({orders.length})</h3>
              <button
                className={styles.closeModalBtn}
                onClick={() => setIsOrdersModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No orders placed yet.
                </div>
              ) : (
                orders.map((o) => (
                  <div
                    key={o.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '14px',
                      background: '#f8fafc'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#2874f0', fontSize: '13px' }}>#{o.id}</span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: o.status === 'Delivered' ? '#e8f5e9' : o.status === 'Shipped' ? '#eff6ff' : o.status === 'Packed' ? '#fffbeb' : '#e8f5e9',
                          color: o.status === 'Delivered' ? '#2e7d32' : o.status === 'Shipped' ? '#1d4ed8' : o.status === 'Packed' ? '#b45309' : '#2e7d32'
                        }}
                      >
                        ✓ {o.status || 'Confirmed'}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                      Placed on {o.date ? new Date(o.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                    </div>

                    {o.items?.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', margin: '6px 0' }}>
                        <img
                          src={it.image || '/images/headphones.png'}
                          alt={it.name}
                          style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '4px', background: '#fff', border: '1px solid #e2e8f0' }}
                        />
                        <div style={{ fontSize: '12px', flex: 1 }}>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{it.name}</div>
                          <div style={{ color: '#64748b', fontSize: '11px' }}>Qty: {it.quantity || 1} • {formatPrice(it.price)}</div>
                        </div>
                      </div>
                    ))}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px' }}>Total: {formatPrice(o.totalAmount)}</span>
                      <button
                        onClick={() => {
                          setIsOrdersModalOpen(false);
                          router.push(`/order-success?orderId=${o.id}`);
                        }}
                        style={{
                          background: '#2874f0',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Track Status →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
