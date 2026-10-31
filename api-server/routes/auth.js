const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const userFilePath = path.join(__dirname, '../data/user.json');

// In-memory store for active OTPs and sessions
const otpStore = new Map();
const activeSessions = new Map();

function getUserData() {
  try {
    if (fs.existsSync(userFilePath)) {
      return JSON.parse(fs.readFileSync(userFilePath, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading user.json:', err);
  }
  return require('../data/user.json');
}

function saveUserData(user) {
  try {
    fs.writeFileSync(userFilePath, JSON.stringify(user, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving user data:', err);
  }
}

// Normalize phone or email identifier
function normalizeIdentifier(raw) {
  if (!raw) return '';
  const trimmed = String(raw).trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  // Remove non-digit chars
  const digitsOnly = trimmed.replace(/\D/g, '');
  // Extract last 10 digits if standard Indian mobile
  if (digitsOnly.length > 10) {
    return digitsOnly.slice(-10);
  }
  return digitsOnly || trimmed;
}

// 1. Send OTP (Supports login, signup, forgot-password, reset)
router.post('/send-otp', (req, res) => {
  try {
    const { identifier, purpose = 'login' } = req.body;
    if (!identifier || !String(identifier).trim()) {
      return res.status(400).json({ success: false, error: 'Please enter a valid mobile number or email' });
    }

    const norm = normalizeIdentifier(identifier);
    const currentUser = getUserData();
    const userPhoneNorm = normalizeIdentifier(currentUser.phone);
    const userEmailNorm = (currentUser.email || '').toLowerCase();

    const isExistingUser = norm === userPhoneNorm || norm === userEmailNorm;

    // Generate 6-digit OTP (demo friendly: '123456' is always accepted)
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

    otpStore.set(norm, {
      otp: generatedOtp,
      expiresAt,
      identifier,
      purpose
    });

    console.log(`[PulseKart Auth] OTP requested [${purpose}] for ${identifier} (${norm}): ${generatedOtp} / 123456`);

    return res.json({
      success: true,
      message: `OTP sent successfully to ${identifier}`,
      identifier,
      normalizedIdentifier: norm,
      isNewUser: !isExistingUser,
      purpose,
      demoOtp: '123456',
      generatedOtp,
      expiresInSeconds: 300
    });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ success: false, error: 'Failed to send OTP. Please try again.' });
  }
});

// 2. Verify OTP & Log In / Sign Up
router.post('/verify-otp', (req, res) => {
  try {
    const { identifier, otp, name } = req.body;
    if (!identifier || !otp) {
      return res.status(400).json({ success: false, error: 'Identifier and OTP are required' });
    }

    const norm = normalizeIdentifier(identifier);
    const enteredOtp = String(otp).trim();

    // Verify OTP: Allow demo '123456' or match generated OTP from store
    const stored = otpStore.get(norm);
    const isMasterOtp = enteredOtp === '123456';
    const isStoreOtp = stored && stored.otp === enteredOtp && Date.now() < stored.expiresAt;

    if (!isMasterOtp && !isStoreOtp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP. Please use code 123456 or request a new OTP.'
      });
    }

    // Clear used OTP
    otpStore.delete(norm);

    let user = getUserData();
    const userPhoneNorm = normalizeIdentifier(user.phone);
    const userEmailNorm = (user.email || '').toLowerCase();
    const isExisting = norm === userPhoneNorm || norm === userEmailNorm;

    if (!isExisting) {
      // Create or update current user profile with new info
      user.name = name && name.trim() ? name.trim() : 'PulseKart Shopper';
      if (norm.includes('@')) {
        user.email = norm;
      } else {
        user.phone = '+91 ' + norm;
      }
      user.isPlusMember = false;
      user.superCoins = user.superCoins || { balance: 100, value: 100 };
      saveUserData(user);
    } else if (name && name.trim() && user.name !== name.trim()) {
      user.name = name.trim();
      saveUserData(user);
    }

    // Generate secure session token
    const token = `pk_token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    activeSessions.set(token, {
      userId: user.id || 1,
      createdAt: Date.now()
    });

    return res.json({
      success: true,
      message: isExisting ? 'Logged in successfully' : 'Account created & logged in successfully',
      token,
      user
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ success: false, error: 'Authentication failed. Please try again.' });
  }
});

// 3. User Sign Up with Name, Identifier & Password
router.post('/signup', (req, res) => {
  try {
    const { name, identifier, password, otp } = req.body;

    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Please enter your full name (at least 2 characters)' });
    }
    if (!identifier || !String(identifier).trim()) {
      return res.status(400).json({ success: false, error: 'Please enter a valid mobile number or email address' });
    }
    if (!password || String(password).length < 4) {
      return res.status(400).json({ success: false, error: 'Password must be at least 4 characters long' });
    }

    const norm = normalizeIdentifier(identifier);

    // If OTP is provided, verify it
    if (otp) {
      const enteredOtp = String(otp).trim();
      const stored = otpStore.get(norm);
      const isMasterOtp = enteredOtp === '123456';
      const isStoreOtp = stored && stored.otp === enteredOtp && Date.now() < stored.expiresAt;

      if (!isMasterOtp && !isStoreOtp) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired OTP. Please use code 123456 or request a new OTP.'
        });
      }
      otpStore.delete(norm);
    }

    let user = getUserData();
    user.name = name.trim();
    user.password = password;
    if (norm.includes('@')) {
      user.email = norm;
    } else {
      user.phone = '+91 ' + norm;
    }
    user.isPlusMember = user.isPlusMember ?? false;
    user.superCoins = user.superCoins || { balance: 100, value: 100 };
    saveUserData(user);

    const token = `pk_token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    activeSessions.set(token, {
      userId: user.id || 1,
      createdAt: Date.now()
    });

    console.log(`[PulseKart Auth] User registered successfully: ${name} (${identifier})`);

    return res.json({
      success: true,
      message: 'Account created and logged in successfully!',
      token,
      user
    });
  } catch (err) {
    console.error('Sign up error:', err);
    res.status(500).json({ success: false, error: 'Failed to create account. Please try again.' });
  }
});

// 4. Forgot Password - Request OTP & Enable Fallback Direct Login
router.post('/forgot-password', (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier || !String(identifier).trim()) {
      return res.status(400).json({ success: false, error: 'Please enter your registered mobile number or email' });
    }

    const norm = normalizeIdentifier(identifier);
    const currentUser = getUserData();
    const userPhoneNorm = normalizeIdentifier(currentUser.phone);
    const userEmailNorm = (currentUser.email || '').toLowerCase();

    const isKnown = norm === userPhoneNorm || norm === userEmailNorm;

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    otpStore.set(norm, {
      otp: generatedOtp,
      expiresAt,
      identifier,
      purpose: 'forgot'
    });

    console.log(`[PulseKart Auth] Forgot Password OTP for ${identifier} (${norm}): ${generatedOtp} / 123456`);

    return res.json({
      success: true,
      message: `Password reset code sent to ${identifier}`,
      identifier,
      normalizedIdentifier: norm,
      isKnownUser: isKnown,
      canLoginDirectlyWithOtp: true,
      demoOtp: '123456',
      generatedOtp,
      expiresInSeconds: 300
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, error: 'Failed to process request. Please try again.' });
  }
});

// 5. Reset Password with OTP & New Password Confirmation
router.post('/reset-password', (req, res) => {
  try {
    const { identifier, otp, newPassword, confirmPassword } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ success: false, error: 'Identifier and OTP code are required' });
    }
    if (!newPassword || String(newPassword).length < 4) {
      return res.status(400).json({ success: false, error: 'New password must be at least 4 characters long' });
    }
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'New password and confirm password do not match' });
    }

    const norm = normalizeIdentifier(identifier);
    const enteredOtp = String(otp).trim();

    const stored = otpStore.get(norm);
    const isMasterOtp = enteredOtp === '123456';
    const isStoreOtp = stored && stored.otp === enteredOtp && Date.now() < stored.expiresAt;

    if (!isMasterOtp && !isStoreOtp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP. Please use code 123456 or request a new OTP.'
      });
    }

    // Clear used OTP
    otpStore.delete(norm);

    let user = getUserData();
    user.password = newPassword;
    saveUserData(user);

    const token = `pk_token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    activeSessions.set(token, {
      userId: user.id || 1,
      createdAt: Date.now()
    });

    console.log(`[PulseKart Auth] Password successfully reset for user ${user.name}`);

    return res.json({
      success: true,
      message: 'Password reset successfully! You are now logged in.',
      token,
      user
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, error: 'Failed to reset password. Please try again.' });
  }
});

// 6. Login with Password (with explicit OTP fallback support)
router.post('/login-password', (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: 'Identifier and password are required' });
    }

    const norm = normalizeIdentifier(identifier);
    let user = getUserData();
    const userPhoneNorm = normalizeIdentifier(user.phone);
    const userEmailNorm = (user.email || '').toLowerCase();

    // Check saved password or master password
    const savedPassword = user.password || 'pulsekart123';
    const isPasswordMatch = password === savedPassword || password === 'pulsekart123';

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password. Try again or login using OTP instead.',
        canLoginWithOtp: true,
        canResetPassword: true
      });
    }

    if (norm !== userPhoneNorm && norm !== userEmailNorm) {
      // Associate identifier with session
      user.name = norm.includes('@') ? norm.split('@')[0] : 'PulseKart Shopper';
      if (norm.includes('@')) {
        user.email = norm;
      } else {
        user.phone = '+91 ' + norm;
      }
      saveUserData(user);
    }

    const token = `pk_token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    activeSessions.set(token, {
      userId: user.id || 1,
      createdAt: Date.now()
    });

    return res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user
    });
  } catch (err) {
    console.error('Password login error:', err);
    res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
  }
});

// 7. Get Current Auth State
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const user = getUserData();
  if (!token) {
    return res.json({
      isAuthenticated: false,
      user: null
    });
  }

  return res.json({
    isAuthenticated: true,
    user
  });
});

// 8. Logout
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    activeSessions.delete(token);
  }

  return res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
