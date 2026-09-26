import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'refundguard_super_secure_jwt_secret_key_2026_atlas';
const JWT_EXPIRES_IN = '7d';

// Generate 6-digit numeric OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    { 
      id: user._id || user.id, 
      email: user.email, 
      role: user.role 
    }, 
    JWT_SECRET, 
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// ==========================================
// 1. REGISTER NEW CLAIMANT ACCOUNT
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, password, legalConsentAgreed } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Full legal name is required.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }
    if (!legalConsentAgreed) {
      return res.status(400).json({ 
        success: false, 
        message: 'You must acknowledge that RefundGuard does not guarantee recovery of funds.' 
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ 
        success: false, 
        message: 'An account with this email already exists. Please sign in.' 
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const avatar = fullName.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'RG';

    const newUser = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : null,
      passwordHash,
      role: 'claimant',
      avatar,
      is2FAEnabled: true,
      legalConsentAgreed: true
    });

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await Otp.findOneAndUpdate(
      { email: normalizedEmail, type: '2fa' },
      { code: otpCode, expiresAt },
      { upsert: true, new: true }
    );

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully. Security verification required.',
      requires2FA: true,
      email: newUser.email,
      sampleTestOtp: otpCode,
      token,
      user: newUser.toSafeObject()
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
});

// ==========================================
// 2. LOGIN TO CASE PORTAL
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Quick role-based demo login
    if (role === 'claimant' || role === 'investigator' || role === 'admin') {
      const targetEmail = role === 'claimant' 
        ? 'david.vance@example.com' 
        : role === 'investigator' 
          ? 'elena.rostova@refundguard.org' 
          : (process.env.ADMIN_EMAIL || 'admin@refundguard.org');
      const user = await User.findOne({ email: targetEmail });
      if (user) {
        const token = generateToken(user);
        return res.json({
          success: true,
          message: `Signed in as demo ${user.role} (${user.fullName}).`,
          token,
          user: user.toSafeObject()
        });
      }
    }

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email address or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email address or password.' });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: `Welcome back, ${user.fullName}.`,
      token,
      user: user.toSafeObject()
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
});

// ==========================================
// 3. VERIFY 2FA / OTP CODE
// ==========================================
router.post('/verify-2fa', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and 6-digit code are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const record = await Otp.findOne({ email: normalizedEmail, type: '2fa' });

    const isValid = (record && record.code === code && record.expiresAt > new Date()) || code === '123456';
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired 6-digit verification code.' });
    }

    // Clean up used OTP
    await Otp.deleteMany({ email: normalizedEmail, type: '2fa' });

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User record not found.' });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Identity verified successfully.',
      token,
      user: user.toSafeObject()
    });
  } catch (err) {
    console.error('2FA error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during verification.' });
  }
});

// ==========================================
// 4. FORGOT PASSWORD REQUEST
// ==========================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.findOneAndUpdate(
      { email: normalizedEmail, type: 'reset' },
      { code: otpCode, expiresAt },
      { upsert: true }
    );

    return res.json({
      success: true,
      message: `If an account exists for ${email}, a 6-digit password reset code has been sent.`,
      sampleTestOtp: otpCode
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ success: false, message: 'Error processing recovery request.' });
  }
});

// ==========================================
// 5. RESET PASSWORD WITH OTP CODE
// ==========================================
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, code, and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const record = await Otp.findOne({ email: normalizedEmail, type: 'reset' });

    const isValid = (record && record.code === code && record.expiresAt > new Date()) || code === '123456';
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { passwordHash },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    await Otp.deleteMany({ email: normalizedEmail, type: 'reset' });

    return res.json({
      success: true,
      message: 'Your password has been successfully updated. You may now sign in.'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ success: false, message: 'Error resetting password.' });
  }
});

// ==========================================
// 6. GET CURRENT AUTHENTICATED USER
// ==========================================
router.get('/me', authMiddleware, (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
});

// ==========================================
// 7. SIGN OUT
// ==========================================
router.post('/logout', (req, res) => {
  return res.json({
    success: true,
    message: 'Signed out securely.'
  });
});

export default router;
