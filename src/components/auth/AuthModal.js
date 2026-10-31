'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './AuthModal.module.css';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    setAuthModalMode,
    activeIdentifier,
    setActiveIdentifier,
    demoOtpHint,
    requestOtp,
    verifyOtp,
    signup,
    forgotPassword,
    resetPassword,
    loginWithPassword,
    quickDemoLogin,
  } = useAuth();

  // Local Form States
  const [identifier, setIdentifier] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [verifiedOtpCode, setVerifiedOtpCode] = useState('');
  const [isResetFlow, setIsResetFlow] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  const otpInputRefs = useRef([]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  // Reset form when modal opens or mode changes
  useEffect(() => {
    if (isAuthModalOpen) {
      setErrorMessage('');
      setFieldError('');
      setIsSubmitting(false);
      if (activeIdentifier && !identifier) {
        setIdentifier(activeIdentifier);
      }
      if (authModalMode === 'otp') {
        setResendTimer(30);
        setTimeout(() => {
          if (otpInputRefs.current[0]) {
            otpInputRefs.current[0].focus();
          }
        }, 150);
      }
    }
  }, [isAuthModalOpen, authModalMode, activeIdentifier, identifier]);

  // Resend Countdown
  useEffect(() => {
    let interval = null;
    if (isAuthModalOpen && authModalMode === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isAuthModalOpen, authModalMode, resendTimer]);

  // Client validation helper (Flipkart spec)
  const validateTarget = (val) => {
    const clean = val.trim();
    if (!clean) return 'Please enter your mobile number or email ID';
    if (/^\d+$/.test(clean)) {
      if (clean.length !== 10) return 'Please enter a valid 10-digit mobile number';
    } else if (clean.includes('@')) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return 'Please enter a valid email address';
    } else {
      return 'Please enter a valid 10-digit mobile number or email address';
    }
    return '';
  };

  // Password strength helper
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass) && pass.length >= 8) score += 1;
    return score; // 0, 1, 2, 3
  };

  // Direct OTP verification helper
  const handleVerifyOtpDirect = useCallback(async (code) => {
    setErrorMessage('');
    setIsSubmitting(true);
    const target = activeIdentifier || identifier;

    // If in password reset flow, advance to reset password screen with verified code
    if (isResetFlow) {
      setVerifiedOtpCode(code);
      setIsSubmitting(false);
      setAuthModalMode('reset');
      return;
    }

    const res = await verifyOtp(target, code, fullName);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Verification failed');
    }
  }, [activeIdentifier, identifier, fullName, isResetFlow, verifyOtp, setAuthModalMode]);

  if (!isAuthModalOpen) return null;

  // 1. Request OTP (Login or Signup or Forgot Password)
  const handleRequestOtp = async (e, purpose = 'login') => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setFieldError('');

    const target = identifier.trim() || activeIdentifier.trim();
    const err = validateTarget(target);
    if (err) {
      setFieldError(err);
      return;
    }

    if (authModalMode === 'signup' && !fullName.trim()) {
      setFieldError('Please enter your full name');
      return;
    }

    setIsSubmitting(true);
    const res = await requestOtp(target, purpose);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to send OTP');
    } else {
      setOtpDigits(['', '', '', '', '', '']);
      setResendTimer(30);
    }
  };

  // 2. Handle User Sign Up
  const handleSignUpSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setFieldError('');

    const target = identifier.trim();
    const err = validateTarget(target);
    if (err) {
      setFieldError(err);
      return;
    }
    if (!fullName.trim() || fullName.trim().length < 2) {
      setFieldError('Please enter your full name (at least 2 characters)');
      return;
    }
    if (!password || password.length < 4) {
      setFieldError('Please create a password of at least 4 characters');
      return;
    }

    setIsSubmitting(true);
    // Request OTP to confirm mobile/email
    const res = await requestOtp(target, 'signup');
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to initiate signup OTP');
    } else {
      setOtpDigits(['', '', '', '', '', '']);
      setResendTimer(30);
    }
  };

  // 3. Handle Forgot Password - Route 1: Instant OTP Login
  const handleForgotLoginDirectly = async () => {
    setErrorMessage('');
    setFieldError('');
    const target = identifier.trim() || activeIdentifier.trim();
    const err = validateTarget(target);
    if (err) {
      setFieldError(err);
      return;
    }

    setIsResetFlow(false);
    setIsSubmitting(true);
    const res = await requestOtp(target, 'login');
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to send OTP for direct login');
    }
  };

  // 4. Handle Forgot Password - Route 2: Proceed to Reset Password
  const handleForgotResetPassword = async () => {
    setErrorMessage('');
    setFieldError('');
    const target = identifier.trim() || activeIdentifier.trim();
    const err = validateTarget(target);
    if (err) {
      setFieldError(err);
      return;
    }

    setIsResetFlow(true);
    setIsSubmitting(true);
    const res = await forgotPassword(target);
    setIsSubmitting(false);

    if (res.success) {
      setAuthModalMode('otp');
      setOtpDigits(['', '', '', '', '', '']);
      setResendTimer(30);
    } else {
      setErrorMessage(res.error || 'Failed to request password reset code');
    }
  };

  // 5. Handle Reset Password Submission
  const handleResetPasswordSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setFieldError('');

    if (!newPassword || newPassword.length < 4) {
      setFieldError('New password must be at least 4 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFieldError('New password and confirm password do not match');
      return;
    }

    const target = activeIdentifier || identifier;
    const otpCode = verifiedOtpCode || otpDigits.join('') || '123456';

    setIsSubmitting(true);
    const res = await resetPassword(target, otpCode, newPassword, confirmPassword);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to reset password');
    }
  };

  // Handle OTP Input Change & Auto-Advance / Auto-Submit
  const handleOtpChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (cleanVal.length > 1) {
      // Pasted full OTP (e.g. 123456)
      const pasted = cleanVal.slice(0, 6).split('');
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setOtpDigits(newDigits);

      if (newDigits.every((d) => d !== '')) {
        handleVerifyOtpDirect(newDigits.join(''));
      }
      return;
    }

    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    // Auto focus next box if typed
    if (cleanVal && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1].focus();
    }

    // Auto-submit when all 6 boxes are filled
    if (cleanVal && newDigits.every((d) => d !== '')) {
      setTimeout(() => {
        handleVerifyOtpDirect(newDigits.join(''));
      }, 150);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      if (otpInputRefs.current[index - 1]) {
        otpInputRefs.current[index - 1].focus();
      }
    }
  };

  // Auto-fill Test OTP
  const handleAutoFillOtp = () => {
    const code = demoOtpHint || '123456';
    const split = code.slice(0, 6).split('');
    setOtpDigits(split);
    setErrorMessage('');
    setTimeout(() => {
      handleVerifyOtpDirect(code);
    }, 200);
  };

  // Handle Verify OTP Button Click
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const entered = otpDigits.join('');
    if (entered.length < 6) {
      setErrorMessage('Please enter all 6 digits of the OTP');
      return;
    }
    handleVerifyOtpDirect(entered);
  };

  // Handle Password Login
  const handlePasswordLogin = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setFieldError('');

    const err = validateTarget(identifier);
    if (err) {
      setFieldError(err);
      return;
    }
    if (!password) {
      setFieldError('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    const res = await loginWithPassword(identifier.trim(), password);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Invalid credentials');
    }
  };

  // Handle Quick Demo Login
  const handleQuickDemo = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    const res = await quickDemoLogin();
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed demo login');
    }
  };

  // Dynamic Titles based on Mode
  const getBannerInfo = () => {
    switch (authModalMode) {
      case 'signup':
        return {
          title: "Looks like you're new here!",
          subtitle: 'Sign up with your mobile number to get started'
        };
      case 'otp':
        return {
          title: isResetFlow ? 'Reset Verification' : 'Two-Step Verification',
          subtitle: isResetFlow
            ? 'Enter the 6-digit code sent to verify identity before setting a new password'
            : 'Enter the verification code sent to your mobile or email'
        };
      case 'password':
        return {
          title: 'Welcome Back!',
          subtitle: 'Sign in with your account password'
        };
      case 'forgot':
        return {
          title: 'Forgot Password?',
          subtitle: 'Choose to login directly via OTP or set a new password'
        };
      case 'reset':
        return {
          title: 'Set New Password',
          subtitle: 'Create a new secure password for your PulseKart account'
        };
      case 'login':
      default:
        return {
          title: 'Login',
          subtitle: 'Get access to your Orders, Wishlist and Recommendations'
        };
    }
  };

  const banner = getBannerInfo();
  const strengthScore = getPasswordStrength(newPassword || password);

  return (
    <div className={styles.modalOverlay} onClick={closeAuthModal}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        {/* Left Blue Banner */}
        <div className={styles.leftBanner}>
          <div>
            <h2 className={styles.bannerTitle}>{banner.title}</h2>
            <p className={styles.bannerSubtitle}>{banner.subtitle}</p>
          </div>

          <div className={styles.bannerGraphic}>
            <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="25" y="45" width="150" height="95" rx="12" fill="#1E5BC6" opacity="0.8" />
              <path
                d="M60 45V32C60 21 69 12 80 12H120C131 12 140 21 140 32V45"
                stroke="#FFFFFF"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <circle cx="100" cy="90" r="28" fill="#FFE11B" />
              <path
                d="M100 74L105 84H116L107 91L110 102L100 95L90 102L93 91L84 84H95L100 74Z"
                fill="#2874F0"
              />
              <rect x="42" y="118" width="116" height="6" rx="3" fill="#ffffff" opacity="0.4" />
            </svg>
          </div>
        </div>

        {/* Right Content Area */}
        <div className={styles.rightContent}>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={closeAuthModal}
            aria-label="Close auth dialog"
          >
            ✕
          </button>

          {errorMessage && (
            <div className={styles.errorBanner}>
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. LOGIN MODE */}
          {authModalMode === 'login' && (
            <form onSubmit={(e) => handleRequestOtp(e, 'login')} className={styles.formBody}>
              <div className={styles.floatingFieldGroup}>
                <input
                  type="text"
                  className={styles.floatingInput}
                  placeholder=" "
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (fieldError) setFieldError('');
                  }}
                  autoFocus
                  required
                />
                <label className={styles.floatingLabel}>Enter Email/Mobile number</label>
                {fieldError && (
                  <div className={styles.fieldErrorText}>
                    <span>⚠️</span> {fieldError}
                  </div>
                )}
              </div>

              <div className={styles.termsNotice}>
                By continuing, you agree to PulseKart&apos;s{' '}
                <a href="/help" className={styles.termsLink}>
                  Terms of Use
                </a>{' '}
                and{' '}
                <a href="/help" className={styles.termsLink}>
                  Privacy Policy
                </a>
                .
              </div>

              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={isSubmitting || !identifier.trim()}
              >
                {isSubmitting ? 'Requesting OTP...' : 'Request OTP'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className={styles.textLinkBtn}
                  onClick={() => {
                    setAuthModalMode('password');
                    setFieldError('');
                    setErrorMessage('');
                  }}
                >
                  Use Password instead
                </button>

                <button
                  type="button"
                  className={styles.textLinkBtn}
                  onClick={() => {
                    setAuthModalMode('forgot');
                    setFieldError('');
                    setErrorMessage('');
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              <div className={styles.orDivider}>
                <span>OR</span>
              </div>

              <button
                type="button"
                className={styles.demoQuickBtn}
                onClick={handleQuickDemo}
                disabled={isSubmitting}
              >
                <span>⚡</span>
                <span>Instant Demo Login (Rahul Sharma)</span>
              </button>

              <div className={styles.bottomSwitch}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => {
                    setAuthModalMode('signup');
                    setFieldError('');
                    setErrorMessage('');
                  }}
                >
                  New to PulseKart? Create an account
                </button>
              </div>
            </form>
          )}

          {/* 2. SIGNUP MODE */}
          {authModalMode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className={styles.formBody}>
              <div className={styles.floatingFieldGroup}>
                <input
                  type="text"
                  className={styles.floatingInput}
                  placeholder=" "
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (fieldError) setFieldError('');
                  }}
                  autoFocus
                  required
                />
                <label className={styles.floatingLabel}>Mobile Number or Email</label>
              </div>

              <div className={styles.floatingFieldGroup}>
                <input
                  type="text"
                  className={styles.floatingInput}
                  placeholder=" "
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fieldError) setFieldError('');
                  }}
                  required
                />
                <label className={styles.floatingLabel}>Full Name</label>
              </div>

              <div className={styles.floatingFieldGroup}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={styles.floatingInput}
                  placeholder=" "
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldError) setFieldError('');
                  }}
                  required
                />
                <label className={styles.floatingLabel}>Create Password</label>
                <button
                  type="button"
                  className={styles.passwordEyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
                {fieldError && (
                  <div className={styles.fieldErrorText}>
                    <span>⚠️</span> {fieldError}
                  </div>
                )}
              </div>

              <div className={styles.termsNotice}>
                By continuing, you agree to PulseKart&apos;s{' '}
                <a href="/help" className={styles.termsLink}>
                  Terms of Use
                </a>{' '}
                and{' '}
                <a href="/help" className={styles.termsLink}>
                  Privacy Policy
                </a>
                .
              </div>

              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={isSubmitting || !identifier.trim() || !fullName.trim()}
              >
                {isSubmitting ? 'Sending Verification Code...' : 'Continue'}
              </button>

              <div className={styles.bottomSwitch}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => {
                    setAuthModalMode('login');
                    setFieldError('');
                    setErrorMessage('');
                  }}
                >
                  Existing User? Log in
                </button>
              </div>
            </form>
          )}

          {/* 3. PASSWORD LOGIN MODE */}
          {authModalMode === 'password' && (
            <form onSubmit={handlePasswordLogin} className={styles.formBody}>
              <div className={styles.floatingFieldGroup}>
                <input
                  type="text"
                  className={styles.floatingInput}
                  placeholder=" "
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (fieldError) setFieldError('');
                  }}
                  autoFocus
                  required
                />
                <label className={styles.floatingLabel}>Enter Email/Mobile number</label>
              </div>

              <div className={styles.floatingFieldGroup}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={styles.floatingInput}
                  placeholder=" "
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldError) setFieldError('');
                  }}
                  required
                />
                <label className={styles.floatingLabel}>Password</label>
                <button
                  type="button"
                  className={styles.passwordEyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
                {fieldError && (
                  <div className={styles.fieldErrorText}>
                    <span>⚠️</span> {fieldError}
                  </div>
                )}
              </div>

              <div className={styles.forgotPasswordRow}>
                <button
                  type="button"
                  className={styles.forgotPasswordLink}
                  onClick={() => {
                    setAuthModalMode('forgot');
                    setFieldError('');
                    setErrorMessage('');
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={isSubmitting || !identifier.trim() || !password}
              >
                {isSubmitting ? 'Signing in...' : 'Login'}
              </button>

              {/* Flipkart Standard: Prominent Request OTP fallback button */}
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => {
                  handleRequestOtp(null, 'login');
                }}
                disabled={isSubmitting || !identifier.trim()}
              >
                Request OTP to Login instead
              </button>

              <div className={styles.bottomSwitch}>
                <button
                  type="button"
                  className={styles.textLinkBtn}
                  onClick={() => {
                    setAuthModalMode('signup');
                    setFieldError('');
                    setErrorMessage('');
                  }}
                >
                  New to PulseKart? Create an account
                </button>
              </div>
            </form>
          )}

          {/* 4. FORGOT PASSWORD MODE (Direct OTP Login OR Reset Password) */}
          {authModalMode === 'forgot' && (
            <div className={styles.formBody}>
              <div className={styles.purposeNotice}>
                <span>💡</span>
                <div>
                  <strong>Forgot your password?</strong> No problem! Choose whether you want to
                  log in immediately using an OTP or set a new password.
                </div>
              </div>

              <div className={styles.floatingFieldGroup}>
                <input
                  type="text"
                  className={styles.floatingInput}
                  placeholder=" "
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (fieldError) setFieldError('');
                  }}
                  autoFocus
                  required
                />
                <label className={styles.floatingLabel}>Registered Email or Mobile Number</label>
                {fieldError && (
                  <div className={styles.fieldErrorText}>
                    <span>⚠️</span> {fieldError}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
                {/* Option 1: Direct Instant OTP Login */}
                <div
                  className={styles.choiceCard}
                  onClick={handleForgotLoginDirectly}
                >
                  <div className={styles.choiceCardTitle}>
                    <span>⚡</span> Login directly via OTP (Recommended)
                  </div>
                  <div className={styles.choiceCardSubtitle}>
                    Bypass password and log in immediately using a 6-digit code.
                  </div>
                </div>

                {/* Option 2: Reset Password with OTP */}
                <div
                  className={styles.choiceCard}
                  onClick={handleForgotResetPassword}
                >
                  <div className={styles.choiceCardTitle}>
                    <span>🔑</span> Reset Password
                  </div>
                  <div className={styles.choiceCardSubtitle}>
                    Receive a code to create a brand new password for your account.
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <button
                  type="button"
                  className={styles.textLinkBtn}
                  onClick={() => {
                    setAuthModalMode('login');
                    setFieldError('');
                    setErrorMessage('');
                  }}
                >
                  ← Back to Login
                </button>
              </div>
            </div>
          )}

          {/* 5. OTP VERIFICATION MODE */}
          {authModalMode === 'otp' && (
            <form onSubmit={handleVerifyOtp} className={styles.formBody}>
              <div className={styles.otpHeaderRow}>
                <div>
                  OTP sent to{' '}
                  <span className={styles.otpTargetText}>{activeIdentifier || identifier}</span>
                </div>
                <button
                  type="button"
                  className={styles.changeTargetBtn}
                  onClick={() => setAuthModalMode(isResetFlow ? 'forgot' : 'login')}
                >
                  Change
                </button>
              </div>

              {isResetFlow && (
                <div className={styles.purposeNotice}>
                  <span>🔒</span>
                  <span>Enter the code below to verify your identity and set a new password.</span>
                </div>
              )}

              <div>
                <label className={styles.inputLabel} style={{ textAlign: 'center', display: 'block' }}>
                  Enter 6-digit OTP
                </label>
                <div className={styles.otpInputsContainer}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className={styles.otpDigitInput}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    />
                  ))}
                </div>
              </div>

              {/* Demo Test OTP Auto-fill Banner */}
              <div className={styles.otpHintBanner}>
                <span>
                  💡 Test OTP: <strong>{demoOtpHint || '123456'}</strong>
                </span>
                <button
                  type="button"
                  className={styles.autoFillBadge}
                  onClick={handleAutoFillOtp}
                >
                  Auto-fill & Proceed
                </button>
              </div>

              <div className={styles.resendRow}>
                <span>Didn&apos;t receive code?</span>
                {resendTimer > 0 ? (
                  <span>Resend in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    className={styles.textLinkBtn}
                    onClick={() => handleRequestOtp(null, isResetFlow ? 'forgot' : 'login')}
                    disabled={isSubmitting}
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={isSubmitting || otpDigits.join('').length < 6}
              >
                {isSubmitting
                  ? 'Verifying...'
                  : isResetFlow
                  ? 'Verify & Set New Password'
                  : 'Verify & Proceed'}
              </button>

              {/* If user is in reset flow, allow fallback instant login without resetting */}
              {isResetFlow && (
                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    className={styles.textLinkBtn}
                    onClick={() => {
                      setIsResetFlow(false);
                      handleVerifyOtpDirect(otpDigits.join('') || '123456');
                    }}
                  >
                    ⚡ Or skip password reset and log in directly
                  </button>
                </div>
              )}
            </form>
          )}

          {/* 6. RESET PASSWORD MODE */}
          {authModalMode === 'reset' && (
            <form onSubmit={handleResetPasswordSubmit} className={styles.formBody}>
              <div className={styles.purposeNotice}>
                <span>✓</span>
                <span>OTP verified! Please create your new account password.</span>
              </div>

              <div className={styles.floatingFieldGroup}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={styles.floatingInput}
                  placeholder=" "
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (fieldError) setFieldError('');
                  }}
                  autoFocus
                  required
                />
                <label className={styles.floatingLabel}>New Password (min 4 chars)</label>
                <button
                  type="button"
                  className={styles.passwordEyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Strength Meter */}
              {newPassword && (
                <div className={styles.passwordStrengthMeter}>
                  <div
                    className={`${styles.strengthSegment} ${
                      strengthScore >= 1 ? styles.strengthWeak : ''
                    }`}
                  />
                  <div
                    className={`${styles.strengthSegment} ${
                      strengthScore >= 2 ? styles.strengthMedium : ''
                    }`}
                  />
                  <div
                    className={`${styles.strengthSegment} ${
                      strengthScore >= 3 ? styles.strengthStrong : ''
                    }`}
                  />
                </div>
              )}

              <div className={styles.floatingFieldGroup}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={styles.floatingInput}
                  placeholder=" "
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldError) setFieldError('');
                  }}
                  required
                />
                <label className={styles.floatingLabel}>Confirm New Password</label>
                <button
                  type="button"
                  className={styles.passwordEyeBtn}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
                {fieldError && (
                  <div className={styles.fieldErrorText}>
                    <span>⚠️</span> {fieldError}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={isSubmitting || !newPassword || !confirmPassword}
              >
                {isSubmitting ? 'Updating Password...' : 'Update Password & Log In'}
              </button>

              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  className={styles.textLinkBtn}
                  onClick={() => {
                    setAuthModalMode('login');
                    setFieldError('');
                    setErrorMessage('');
                  }}
                >
                  Cancel & Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
