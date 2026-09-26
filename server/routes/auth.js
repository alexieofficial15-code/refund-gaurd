import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
  findUserByEmail, 
  createUser, 
  updateUserPassword, 
  saveOtp, 
  verifyOtp 
} from '../db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'refundguard_super_secure_jwt_secret_key_2026';
const JWT_EXPIRES_IN = '7d';

// Generate 6-digit numeric OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
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

    // Validations
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

    // Check if user already exists
    const existing = findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ 
        success: false, 
        message: 'An account with this email already exists. Please sign in.' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = createUser({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      password: hashedPassword,
      legalConsentAgreed: true,
      is2FAEnabled: true
    });

    // Generate 2FA security OTP
    const otpCode = generateOtp();
    saveOtp(newUser.email, otpCode, '2fa');

    // Generate token
    const token = generateToken(newUser);

    const { password: _, ...safeUser } = newUser;

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully. Security verification required.',
      requires2FA: true,
      email: newUser.email,
      sampleTestOtp: otpCode,
      token,
      user: safeUser
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

    // Quick demo login support
    if (role === 'claimant' || role === 'investigator') {
      const targetEmail = role === 'claimant' ? 'david.vance@example.com' : 'elena.rostova@refundguard.org';
      const user = findUserByEmail(targetEmail);
      if (user) {
        const token = generateToken(user);
        const { password: _, ...safeUser } = user;
        return res.json({
          success: true,
          message: `Signed in as demo ${user.role} (${user.fullName}).`,
          token,
          user: safeUser
        });
      }
    }

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email address or password.' });
    }

    // Compare bcrypt password against stored passwordHash
    const isMatch = await bcrypt.compare(password, user.passwordHash || user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email address or password.' });
    }

    // Generate token
    const token = generateToken(user);
    const { passwordHash: _, password: __, ...safeUser } = user;

    return res.json({
      success: true,
      message: `Welcome back, ${user.fullName}.`,
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
});

// ==========================================
// 3. VERIFY 2FA / OTP CODE
// ==========================================
router.post('/verify-2fa', (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and 6-digit code are required.' });
    }

    const isValid = verifyOtp(email, code);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired 6-digit verification code.' });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User record not found.' });
    }

    const token = generateToken(user);
    const { password: _, ...safeUser } = user;

    return res.json({
      success: true,
      message: 'Identity verified successfully.',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('2FA error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during verification.' });
  }
});

// ==========================================
// 4. FORGOT PASSWORD REQUEST
// ==========================================
router.post('/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const user = findUserByEmail(email);
    const otpCode = generateOtp();
    saveOtp(email, otpCode, 'reset');

    // Always respond with success to avoid email enumeration
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

    const isValid = verifyOtp(email, code);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    const updated = updateUserPassword(email, hashedPassword);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

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
// 6. GET CURRENT AUTHENTICATED USER PROFILE
// ==========================================
router.get('/me', authMiddleware, (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
});

// ==========================================
// 7. SIGN OUT (Client side clears token)
// ==========================================
router.post('/logout', (req, res) => {
  return res.json({
    success: true,
    message: 'Signed out securely.'
  });
});

export default router;
