'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'signup' | 'otp' | 'password'
  const [redirectUrl, setRedirectUrl] = useState(null);
  const [activeIdentifier, setActiveIdentifier] = useState('');
  const [demoOtpHint, setDemoOtpHint] = useState('');

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const showToast = useCallback((message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'info' });
    }, 3500);
  }, []);

  const initAuth = useCallback(async () => {
    try {
      const savedToken = localStorage.getItem('pulsekart_auth_token');
      const isExplicitlyLoggedOut = localStorage.getItem('pulsekart_auth_logged_out') === 'true';

      if (savedToken && !isExplicitlyLoggedOut) {
        const res = await fetch(`${API_URL}/api/user`);
        if (res.ok) {
          const uData = await res.json();
          setUser(uData);
          setToken(savedToken);
        } else {
          setUser(null);
          setToken(null);
        }
      } else if (!isExplicitlyLoggedOut) {
        // First visit default session
        const res = await fetch(`${API_URL}/api/user`);
        if (res.ok) {
          const uData = await res.json();
          const defaultToken = 'pk_default_session_token';
          localStorage.setItem('pulsekart_auth_token', defaultToken);
          setUser(uData);
          setToken(defaultToken);
        }
      } else {
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize Auth State & Setup Cross-Tab Sync
  useEffect(() => {
    initAuth();

    const handleStorageChange = (e) => {
      if (e.key === 'pulsekart_auth_token' || e.key === 'pulsekart_auth_logged_out') {
        initAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [initAuth]);

  // Open & Close Modal
  const openAuthModal = useCallback((mode = 'login', redirect = null) => {
    setAuthModalMode(mode);
    setRedirectUrl(redirect);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setActiveIdentifier('');
    setDemoOtpHint('');
  }, []);

  // 1. Request OTP
  const requestOtp = async (identifier, purpose = 'login') => {
    try {
      const res = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, purpose })
      });
      const data = await res.json();
      if (data.success) {
        setActiveIdentifier(identifier);
        setDemoOtpHint(data.demoOtp || data.generatedOtp || '123456');
        setAuthModalMode('otp');
        return { success: true, data };
      }
      return { success: false, error: data.error || 'Failed to send OTP' };
    } catch (err) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  // 2. Verify OTP
  const verifyOtp = async (identifier, otp, name = '') => {
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp, name })
      });
      const data = await res.json();
      if (data.success && data.user) {
        const authToken = data.token || `pk_${Date.now()}`;
        localStorage.setItem('pulsekart_auth_token', authToken);
        localStorage.removeItem('pulsekart_auth_logged_out');
        setUser(data.user);
        setToken(authToken);
        closeAuthModal();

        showToast(`Welcome, ${data.user.name || 'Shopper'}!`, 'success');

        if (redirectUrl) {
          router.push(redirectUrl);
          setRedirectUrl(null);
        }
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Verification failed' };
    } catch (err) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  // 3. User Sign Up
  const signup = async (name, identifier, password, otp = '') => {
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, identifier, password, otp })
      });
      const data = await res.json();
      if (data.success && data.user) {
        const authToken = data.token || `pk_${Date.now()}`;
        localStorage.setItem('pulsekart_auth_token', authToken);
        localStorage.removeItem('pulsekart_auth_logged_out');
        setUser(data.user);
        setToken(authToken);
        closeAuthModal();

        showToast(`Welcome to PulseKart, ${data.user.name || 'Shopper'}!`, 'success');

        if (redirectUrl) {
          router.push(redirectUrl);
          setRedirectUrl(null);
        }
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Registration failed' };
    } catch (err) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  // 4. Forgot Password - Send OTP
  const forgotPassword = async (identifier) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      const data = await res.json();
      if (data.success) {
        setActiveIdentifier(identifier);
        setDemoOtpHint(data.demoOtp || data.generatedOtp || '123456');
        return { success: true, data };
      }
      return { success: false, error: data.error || 'Failed to send reset code' };
    } catch (err) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  // 5. Reset Password
  const resetPassword = async (identifier, otp, newPassword, confirmPassword) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp, newPassword, confirmPassword })
      });
      const data = await res.json();
      if (data.success && data.user) {
        const authToken = data.token || `pk_${Date.now()}`;
        localStorage.setItem('pulsekart_auth_token', authToken);
        localStorage.removeItem('pulsekart_auth_logged_out');
        setUser(data.user);
        setToken(authToken);
        closeAuthModal();

        showToast('Password updated! You are logged in.', 'success');

        if (redirectUrl) {
          router.push(redirectUrl);
          setRedirectUrl(null);
        }
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Failed to reset password' };
    } catch (err) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  // 6. Login with Password
  const loginWithPassword = async (identifier, password) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();
      if (data.success && data.user) {
        const authToken = data.token || `pk_${Date.now()}`;
        localStorage.setItem('pulsekart_auth_token', authToken);
        localStorage.removeItem('pulsekart_auth_logged_out');
        setUser(data.user);
        setToken(authToken);
        closeAuthModal();

        showToast(`Welcome back, ${data.user.name || 'Shopper'}!`, 'success');

        if (redirectUrl) {
          router.push(redirectUrl);
          setRedirectUrl(null);
        }
        return { success: true, user: data.user };
      }
      return {
        success: false,
        error: data.error || 'Invalid credentials',
        canLoginWithOtp: data.canLoginWithOtp
      };
    } catch (err) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  // 7. Quick Demo Login
  const quickDemoLogin = async () => {
    return await verifyOtp('9876543210', '123456', 'Rahul Sharma');
  };

  // 8. Logout
  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('pulsekart_auth_token');
      localStorage.setItem('pulsekart_auth_logged_out', 'true');
      setUser(null);
      setToken(null);
      showToast('Logged out of PulseKart', 'info');
      router.push('/');
    }
  };

  // 9. Update User profile locally
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    isAuthModalOpen,
    authModalMode,
    activeIdentifier,
    demoOtpHint,
    toast,
    showToast,
    openAuthModal,
    closeAuthModal,
    setAuthModalMode,
    setActiveIdentifier,
    requestOtp,
    verifyOtp,
    signup,
    forgotPassword,
    resetPassword,
    loginWithPassword,
    quickDemoLogin,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Flipkart Global Auth Notification Toast */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: toast.type === 'success' ? '#1e293b' : '#334155',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '24px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 10000,
            animation: 'fadeIn 0.2s ease-out',
            pointerEvents: 'none'
          }}
        >
          <span>{toast.type === 'success' ? '✓' : 'ℹ️'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
