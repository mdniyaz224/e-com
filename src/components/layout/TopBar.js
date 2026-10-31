'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useNotifications } from '@/context/NotificationContext';
import styles from './TopBar.module.css';

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  if (pathname && (pathname.startsWith('/admin') || pathname.includes('/invoice'))) {
    return null;
  }
  const initialQuery = searchParams ? searchParams.get('search') || '' : '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [address, setAddress] = useState('Rahul, Bengaluru 560034');
  const [isChangingAddress, setIsChangingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const { cartCount } = useCart();
  const { unreadCount } = useNotifications();

  useEffect(() => {
    if (searchParams) {
      setSearchQuery(searchParams.get('search') || '');
    }
  }, [searchParams]);

  // Live Location Search using free OpenStreetMap Nominatim API
  useEffect(() => {
    if (!tempAddress || tempAddress.trim().length < 3 || !isChangingAddress) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const query = encodeURIComponent(tempAddress.trim());
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=in&addressdetails=1&limit=5`
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data || []);
        }
      } catch (err) {
        console.error('Location search error:', err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [tempAddress, isChangingAddress]);

  // Free GPS Auto-detect via Browser Geolocation + Reverse Geocoding
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const area = addr.suburb || addr.neighbourhood || addr.road || addr.county || '';
            const city = addr.city || addr.town || addr.state_district || 'Bengaluru';
            const postcode = addr.postcode ? ` - ${addr.postcode}` : '';
            const detected = `${area ? area + ', ' : ''}${city}${postcode}`;
            const fullAddress = `Rahul, ${detected}`;
            setAddress(fullAddress);
            setTempAddress(fullAddress);
            setIsChangingAddress(false);
          } else {
            setAddress(`Rahul, Current Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`);
            setIsChangingAddress(false);
          }
        } catch (err) {
          alert('Could not resolve GPS address: ' + err.message);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        alert('Location access denied or unavailable. You can search your city/pincode manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectSuggestion = (place) => {
    const addr = place.address || {};
    const city = addr.city || addr.town || addr.state_district || addr.state || '';
    const postcode = addr.postcode ? ` ${addr.postcode}` : '';
    const shortLabel = `${place.name || addr.suburb || city}, ${city}${postcode}`;
    const formatted = `Rahul, ${shortLabel}`;
    setAddress(formatted);
    setTempAddress(formatted);
    setSuggestions([]);
    setIsChangingAddress(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      router.push(`/?search=${encodeURIComponent(query)}`);
    } else {
      router.push('/');
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    router.push('/');
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (tempAddress.trim()) {
      setAddress(tempAddress.trim());
      setIsChangingAddress(false);
    }
  };

  return (
    <header className={styles.topBar}>
      <div className={styles.navContainer}>
        <div className={styles.mainRow}>
          <div className={styles.logoSection} onClick={() => router.push('/')} role="button" tabIndex={0}>
            <div className={styles.logoIcon}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" stroke="#2874F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 6H21" stroke="#2874F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10" stroke="#FF6200" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className={styles.logoText}>PulseKart</span>
          </div>

          {/* Desktop Search Bar positioned in main row */}
          <form className={`${styles.searchRow} ${styles.desktopSearch}`} onSubmit={handleSearch}>
            <div className={styles.searchBox}>
              <button type="submit" className={styles.searchSubmitBtn} aria-label="Submit search">
                <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#878787" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search for Mobiles, Electronics, Fashion & more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className={styles.searchActions}>
                {searchQuery && (
                  <button type="button" className={styles.searchActionBtn} onClick={handleClearSearch} aria-label="Clear search">
                    ✕
                  </button>
                )}
                <button
                  type="button"
                  className={styles.searchActionBtn}
                  aria-label="Voice search"
                  onClick={() => {
                    const sampleQueries = ['Mobiles', 'Headphones', 'Smartwatches', 'Laptops'];
                    const randomQ = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
                    setSearchQuery(randomQ);
                    router.push(`/?search=${encodeURIComponent(randomQ)}`);
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#878787" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                </button>
              </div>
            </div>
          </form>

          <div className={styles.topIcons}>
            <button className={`${styles.iconBtn} ${styles.desktopNavLink}`} onClick={() => router.push('/categories')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span className={styles.navBtnLabel}>Categories</span>
            </button>

            <button className={styles.iconBtn} aria-label="Notifications" onClick={() => router.push('/notifications')}>
              <div className={styles.cartIconWrapper}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && <span className={styles.cartBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </div>
              <span className={`${styles.navBtnLabel} ${styles.desktopOnly}`}>Alerts</span>
            </button>

            <button className={`${styles.iconBtn} ${styles.cartBtn}`} aria-label="Cart" onClick={() => router.push('/cart')}>
              <div className={styles.cartIconWrapper}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {cartCount > 0 && <span className={styles.cartBadge}>{cartCount > 9 ? '9+' : cartCount}</span>}
              </div>
              <span className={`${styles.navBtnLabel} ${styles.desktopOnly}`}>Cart</span>
            </button>

            {/* Flipkart Auth: Login Button / User Profile with Dropdown */}
            {isAuthenticated ? (
              <div
                className={styles.userMenuWrapper}
                onMouseEnter={() => setIsUserMenuOpen(true)}
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <button
                  className={`${styles.iconBtn} ${styles.userProfileBtn}`}
                  onClick={() => router.push('/account')}
                  aria-label="Account Profile"
                >
                  <div className={styles.avatarSmall}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className={`${styles.navBtnLabel} ${styles.userNameLabel} ${styles.desktopOnly}`}>
                    {user?.name ? user.name.split(' ')[0] : 'Account'}
                  </span>
                  <svg className={`${styles.dropdownChevron} ${styles.desktopOnly}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div className={styles.dropdownMenu}>
                    <div className={styles.dropdownHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <strong>{user?.name || 'PulseKart Shopper'}</strong>
                        {user?.isPlusMember && (
                          <span style={{ fontSize: '10px', background: 'rgba(56, 142, 60, 0.12)', color: '#2e7d32', fontWeight: 700, padding: '1px 6px', borderRadius: '8px' }}>
                            PLUS
                          </span>
                        )}
                      </div>
                      <span className={styles.dropdownPhone}>{user?.phone || user?.email}</span>
                    </div>
                    <div className={styles.dropdownDivider} />
                    <div className={styles.dropdownItem} onClick={() => { setIsUserMenuOpen(false); router.push('/account'); }}>
                      <span>👤</span> My Profile
                    </div>
                    <div className={styles.dropdownItem} onClick={() => { setIsUserMenuOpen(false); router.push('/coupons'); }}>
                      <span>🪙</span> SuperCoin Zone
                      <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#fb641b', fontSize: '11px' }}>
                        {user?.superCoins?.balance || 450} coins
                      </span>
                    </div>
                    <div className={styles.dropdownItem} onClick={() => { setIsUserMenuOpen(false); router.push('/orders'); }}>
                      <span>📦</span> Orders
                    </div>
                    <div className={styles.dropdownItem} onClick={() => { setIsUserMenuOpen(false); router.push('/wishlist'); }}>
                      <span>❤️</span> Wishlist
                    </div>
                    <div className={styles.dropdownItem} onClick={() => { setIsUserMenuOpen(false); router.push('/coupons'); }}>
                      <span>🏷️</span> Coupons & Rewards
                    </div>
                    <div className={styles.dropdownItem} onClick={() => { setIsUserMenuOpen(false); router.push('/notifications'); }}>
                      <span>🔔</span> Notifications
                    </div>
                    <div className={styles.dropdownDivider} />
                    <div className={`${styles.dropdownItem} ${styles.dropdownLogout}`} onClick={() => { setIsUserMenuOpen(false); logout(); }}>
                      <span>🚪</span> Log Out
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className={styles.userMenuWrapper}
                onMouseEnter={() => setIsUserMenuOpen(true)}
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <button
                  className={styles.flipkartLoginBtn}
                  onClick={() => openAuthModal('login')}
                  aria-label="Login to PulseKart"
                >
                  <span>Login</span>
                  <svg className={`${styles.dropdownChevron} ${styles.desktopOnly}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div className={styles.dropdownMenu}>
                    <div className={styles.dropdownSignupHeader}>
                      <span>New customer?</span>
                      <button
                        type="button"
                        className={styles.dropdownSignupLink}
                        onClick={() => { setIsUserMenuOpen(false); openAuthModal('signup'); }}
                      >
                        Sign Up
                      </button>
                    </div>
                    <div className={styles.dropdownDivider} />
                    <div className={styles.dropdownItem} onClick={() => { setIsUserMenuOpen(false); openAuthModal('login', '/account'); }}>
                      <span>👤</span> My Profile
                    </div>
                    <div className={styles.dropdownItem} onClick={() => { setIsUserMenuOpen(false); openAuthModal('login', '/orders'); }}>
                      <span>📦</span> Orders
                    </div>
                    <div className={styles.dropdownItem} onClick={() => { setIsUserMenuOpen(false); openAuthModal('login', '/wishlist'); }}>
                      <span>❤️</span> Wishlist
                    </div>
                    <div className={styles.dropdownItem} onClick={() => { setIsUserMenuOpen(false); openAuthModal('login', '/coupons'); }}>
                      <span>🏷️</span> Rewards
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Row (hidden on tablet/desktop) */}
        <form className={`${styles.searchRow} ${styles.mobileSearch}`} onSubmit={handleSearch}>
          <div className={styles.searchBox}>
            <button type="submit" className={styles.searchSubmitBtn} aria-label="Submit search">
              <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#878787" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search for Mobiles, Electronics, etc."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className={styles.searchActions}>
              {searchQuery && (
                <button type="button" className={styles.searchActionBtn} onClick={handleClearSearch} aria-label="Clear search">
                  ✕
                </button>
              )}
              <button
                type="button"
                className={styles.searchActionBtn}
                aria-label="Voice search"
                onClick={() => {
                  const sampleQueries = ['Mobiles', 'Headphones', 'Smartwatches', 'Laptops'];
                  const randomQ = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
                  setSearchQuery(randomQ);
                  router.push(`/?search=${encodeURIComponent(randomQ)}`);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#878787" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              </button>
            </div>
          </div>
        </form>

        <div className={styles.addressRow}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2874F0" strokeWidth="2.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span className={styles.addressText}>
            Deliver to <strong>{address}</strong>
          </span>
          <span className={styles.addressLabel}>Home</span>
          <button
            className={styles.addressChange}
            onClick={() => {
              setTempAddress(address);
              setIsChangingAddress(true);
            }}
          >
            Change ›
          </button>
        </div>
      </div>

      {/* Address Quick Edit Modal with Free Live Search & GPS Auto-detect */}
      {isChangingAddress && (
        <div className={styles.addressModalBackdrop} onClick={() => setIsChangingAddress(false)}>
          <div className={styles.addressModalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className={styles.addressModalTitle}>Change Delivery Location</h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setIsChangingAddress(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className={styles.addressModalSubtitle}>
              Auto-detect your current GPS location or search any area/pincode in India (Free OpenStreetMap API)
            </p>

            {/* GPS Auto-detect button */}
            <button
              type="button"
              className={styles.gpsDetectBtn}
              onClick={handleDetectLocation}
              disabled={isLocating}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="12 2 15 8 22 9 17 14 18 21 12 17 6 21 7 14 2 9 9 8 12 2"></polygon>
              </svg>
              <span>{isLocating ? 'Detecting your GPS location...' : 'Use My Current Location'}</span>
            </button>

            <div className={styles.dividerRow}>
              <span>or search manually</span>
            </div>

            <form onSubmit={handleSaveAddress}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className={styles.addressModalInput}
                  value={tempAddress}
                  onChange={(e) => setTempAddress(e.target.value)}
                  placeholder="Type city, locality, or PIN code (e.g. Indiranagar, 560038)"
                  autoFocus
                />
                {isSearchingLocation && (
                  <span className={styles.inputSearchingSpinner}>⏳</span>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {suggestions.length > 0 && (
                <div className={styles.suggestionsList}>
                  {suggestions.map((place, idx) => (
                    <div
                      key={idx}
                      className={styles.suggestionItem}
                      onClick={() => handleSelectSuggestion(place)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2874F0" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <span className={styles.suggestionText}>{place.display_name}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.addressModalActions}>
                <button
                  type="button"
                  className={styles.addressModalCancelBtn}
                  onClick={() => setIsChangingAddress(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.addressModalSaveBtn}>
                  Apply Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
