import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function AuthPage({ 
  initialMode = 'signin', 
  onAuthSuccess, 
  onNavigate, 
  promptMessage = '', 
  isAdminPortal = false 
}) {
  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup' | 'forgot' | 'reset' | 'otp'
  const { signIn, signUp, verify2FA, sendResetCode, resetPassword, authNotice, clearNotice, currentUser, signOut } = useAuth();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [legalConsent, setLegalConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [sampleOtpHint, setSampleOtpHint] = useState('');

  // Password reset new password state
  const [newPassword, setNewPassword] = useState('');

  // OTP State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpCountdown, setOtpCountdown] = useState(60);

  useEffect(() => {
    setMode(initialMode);
    setErrorMsg('');
  }, [initialMode]);

  // Countdown timer for OTP
  useEffect(() => {
    let timer;
    if (mode === 'otp' && otpCountdown > 0) {
      timer = setInterval(() => setOtpCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [mode, otpCountdown]);

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: 'Empty', colorClass: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score: 1, text: 'Weak', colorClass: 'weak' };
    if (score === 2 || score === 3) return { score: 2, text: 'Medium', colorClass: 'medium' };
    return { score: 3, text: 'Strong', colorClass: 'strong' };
  };

  const pwdStrength = getPasswordStrength(password);

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Submit Sign In to Backend
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signIn({ email, password });
      if (res.success) {
        if (isAdminPortal && res.user.role !== 'admin' && res.user.role !== 'investigator') {
          setErrorMsg('Access Denied: Administrator or Investigator clearance required. This account does not possess administrative permissions.');
          return;
        }
        if (onAuthSuccess) {
          onAuthSuccess(res.user);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Sign Up to Backend
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please provide your full legal name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (!legalConsent) {
      setErrorMsg('You must acknowledge that US.ClaimBack does not guarantee recovery.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signUp({
        fullName,
        email,
        phone,
        password,
        legalConsentAgreed: legalConsent
      });

      if (res.success) {
        setSampleOtpHint(res.sampleTestOtp);
        setMode('otp');
        setOtpCountdown(60);
        setSuccessMsg(`Account created on backend. Security verification code: ${res.sampleTestOtp}`);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error registering account.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP via Backend
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const code = otpDigits.join('');
    if (code.length < 6) {
      setErrorMsg('Please enter the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await verify2FA({ email, code });
      if (res.success && onAuthSuccess) {
        onAuthSuccess(res.user);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid or expired 6-digit verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Forgot Password to Backend
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await sendResetCode({ email });
      if (res.sampleTestOtp) {
        setSampleOtpHint(res.sampleTestOtp);
      }
      setSuccessMsg(res.message);
      setMode('reset');
    } catch (err) {
      setErrorMsg(err.message || 'Error processing reset request.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Reset Password to Backend
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const code = otpDigits.join('');
    if (code.length < 6) {
      setErrorMsg('Please enter the 6-digit reset code.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPassword({ email, code, newPassword });
      setSuccessMsg(res.message);
      setTimeout(() => {
        setMode('signin');
        setPassword('');
        setErrorMsg('');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        {/* Left Form Section */}
        <div className="auth-form-section">
          {/* Header Title & Subtitle */}
          <div className="auth-header-block">
            {isAdminPortal ? (
              <>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '5px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  marginBottom: '0.75rem',
                  textTransform: 'uppercase'
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><Lock size={12} strokeWidth={2.4} /> RESTRICTED GATEWAY</span>
                  <span>•</span>
                  <span>ADMINISTRATOR CLEARANCE</span>
                </div>
                <h1 className="auth-title">Admin <em>Authentication</em></h1>
                <p className="auth-subtitle">
                  Single Gateway: Enter verified administrator credentials to access the Dispute Operations Control Panel.
                </p>
              </>
            ) : mode === 'signin' ? (
              <>
                <h1 className="auth-title">Sign <em>In</em></h1>
                <p className="auth-subtitle">
                  Access your dispute cases and tracked milestones.
                </p>
              </>
            ) : mode === 'signup' ? (
              <>
                <h1 className="auth-title">Create <em>Account</em></h1>
                <p className="auth-subtitle">
                  Organize and prepare your dispute evidence securely.
                </p>
              </>
            ) : mode === 'forgot' ? (
              <>
                <h1 className="auth-title">Reset <em>Password</em></h1>
                <p className="auth-subtitle">
                  Enter your email to receive a 6-digit verification code.
                </p>
              </>
            ) : mode === 'reset' ? (
              <>
                <h1 className="auth-title">New <em>Password</em></h1>
                <p className="auth-subtitle">
                  Enter the 6-digit code sent to <strong>{email}</strong>.
                </p>
              </>
            ) : mode === 'otp' ? (
              <>
                <h1 className="auth-title">Security <em>Code</em></h1>
                <p className="auth-subtitle">
                  Enter the 6-digit code sent to <strong>{email}</strong>.
                </p>
              </>
            ) : null}
          </div>

          {/* Action Prompt Banner (e.g. redirected from Start a Case or Admin Gate) */}
          {promptMessage && (mode === 'signin' || mode === 'signup') && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              backgroundColor: isAdminPortal ? '#fff1f2' : 'var(--lime-soft)',
              border: isAdminPortal ? '1px solid #fecdd3' : '1px solid rgba(15, 93, 75, 0.2)',
              borderRadius: 'var(--radius-md, 8px)',
              marginBottom: '1.25rem'
            }}>
              <Lock size={18} strokeWidth={2.2} style={{ flexShrink: 0, color: isAdminPortal ? '#9f1239' : 'var(--navy-primary)' }} />
              <span style={{ fontSize: '0.85rem', color: isAdminPortal ? '#9f1239' : 'var(--navy-primary)', fontWeight: 600, lineHeight: 1.4 }}>
                {promptMessage}
              </span>
            </div>
          )}

          {/* Current Claimant Session Notice if accessing Admin Gateway */}
          {isAdminPortal && currentUser && currentUser.role !== 'admin' && currentUser.role !== 'investigator' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#fff1f2',
              border: '1px solid #fda4af',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              fontSize: '0.82rem',
              color: '#9f1239'
            }}>
              <div>
                Logged in as <strong>{currentUser.email}</strong> (Role: {currentUser.role}). Admin clearance required.
              </div>
              <button
                type="button"
                onClick={() => {
                  signOut();
                  setErrorMsg('');
                  setSuccessMsg('Signed out of claimant account. Please enter administrator credentials.');
                }}
                style={{
                  background: '#be123c',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                Sign Out
              </button>
            </div>
          )}

          {/* Tab Switcher for SignIn / SignUp or Restricted Banner */}
          {isAdminPortal ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 0.85rem',
              backgroundColor: '#f1f3ec',
              borderRadius: '6px',
              marginBottom: '1.25rem',
              fontSize: '0.8rem',
              color: '#3d4f4a',
              fontWeight: 600
            }}>
              <ShieldCheck size={16} strokeWidth={2.2} style={{ flexShrink: 0 }} />
              <span>Single Authentication Gateway • Administrator / Operations Specialist Clearance</span>
            </div>
          ) : (
            (mode === 'signin' || mode === 'signup') && (
              <div className="auth-tabs">
                <button 
                  type="button"
                  className={`auth-tab-btn ${mode === 'signin' ? 'active' : ''}`}
                  onClick={() => { setMode('signin'); setErrorMsg(''); setSuccessMsg(''); clearNotice(); }}
                >
                  Sign In
                </button>
                <button 
                  type="button"
                  className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
                  onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); clearNotice(); }}
                >
                  Create Account
                </button>
              </div>
            )
          )}

          {/* Feedback Banners */}
          {errorMsg && (
            <div className="auth-alert-banner error">
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="auth-alert-banner success">
              <span>{successMsg}</span>
            </div>
          )}

          {/* ================= SIGN IN FORM ================= */}
          {mode === 'signin' && (
            <form onSubmit={handleSignInSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="signin-email">
                  Email Address
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="signin-email"
                    type="email"
                    className="form-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signin-password">
                  <span>Password</span>
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input has-action-right"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="form-toggle-password-text"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="form-options-row">
                <label className="form-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Keep me signed in</span>
                </label>

                <button
                  type="button"
                  className="link-forgot"
                  onClick={() => { setMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                style={{ padding: '0.85rem' }}
                disabled={isLoading}
              >
                {isLoading ? 'Verifying with Server...' : (isAdminPortal ? 'Authorize & Enter Admin Desk →' : 'Sign In to Case Portal')}
              </button>

              {isAdminPortal && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.85rem',
                  backgroundColor: '#f7f8f3',
                  border: '1px dashed #d5dcd6',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7773', fontWeight: 600, marginBottom: '0.45rem' }}>
                    Authorized Seed Admin Credentials:
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@refundguard.org');
                      setPassword('Password123!');
                      setErrorMsg('');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 0.9rem',
                      background: '#0b2b26',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <KeyRound size={14} strokeWidth={2.2} style={{ verticalAlign: '-2px', marginRight: '0.35rem' }} /> Fill Admin Credentials (admin@refundguard.org)
                  </button>
                </div>
              )}

              {isAdminPortal && (
                <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('home')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6b7773',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    ← Return to Public Website
                  </button>
                </div>
              )}
            </form>
          )}

          {/* ================= SIGN UP FORM ================= */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUpSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="signup-name">
                  Full Legal Name
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="signup-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. David Vance"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signup-email">
                  Email Address
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="signup-email"
                    type="email"
                    className="form-input"
                    placeholder="e.g. david.vance@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signup-phone">
                  Phone Number (For Case SMS/WhatsApp Updates)
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="signup-phone"
                    type="tel"
                    className="form-input"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="signup-password">
                  <span>Create Password</span>
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input has-action-right"
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="form-toggle-password-text"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                {password && (
                  <div className="password-meter">
                    <div className="meter-bars">
                      <div className={`meter-bar-segment ${pwdStrength.score >= 1 ? pwdStrength.colorClass : ''}`} />
                      <div className={`meter-bar-segment ${pwdStrength.score >= 2 ? pwdStrength.colorClass : ''}`} />
                      <div className={`meter-bar-segment ${pwdStrength.score >= 3 ? pwdStrength.colorClass : ''}`} />
                    </div>
                    <div className="meter-label-text">
                      <span>Password strength: <strong>{pwdStrength.text}</strong></span>
                      <span>Min 8 characters</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ margin: '1.2rem 0' }}>
                <label className="form-checkbox-label">
                  <input
                    type="checkbox"
                    checked={legalConsent}
                    onChange={(e) => setLegalConsent(e.target.checked)}
                    required
                  />
                  <span>
                    I understand and agree that <strong>US.ClaimBack is an evidence preparation and dispute routing platform</strong> and does NOT promise or guarantee recovery of lost funds.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                style={{ padding: '0.85rem' }}
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account on Server...' : 'Continue to Security Verification'}
              </button>
            </form>
          )}

          {/* ================= FORGOT PASSWORD ================= */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">
                  Registered Email Address
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="forgot-email"
                    type="email"
                    className="form-input"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                style={{ padding: '0.85rem', marginBottom: '1rem' }}
                disabled={isLoading}
              >
                {isLoading ? 'Requesting Code...' : 'Send 6-Digit Reset Code'}
              </button>

              <button
                type="button"
                className="btn btn-outline btn-full"
                onClick={() => { setMode('signin'); setErrorMsg(''); }}
              >
                <span>Back to Sign In</span>
              </button>
            </form>
          )}

          {/* ================= RESET PASSWORD FORM ================= */}
          {mode === 'reset' && (
            <form onSubmit={handleResetPasswordSubmit}>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                  Enter the 6-digit code sent for <strong>{email}</strong>
                </span>
                {sampleOtpHint && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--blue-accent)', marginTop: '0.35rem' }}>
                    Server Generated Code: <strong>{sampleOtpHint}</strong> (or enter 123456)
                  </div>
                )}
              </div>

              <div className="otp-container">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    className="otp-input"
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  />
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">New Secure Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                style={{ padding: '0.85rem', marginBottom: '1rem' }}
                disabled={isLoading}
              >
                {isLoading ? 'Updating Password...' : 'Save New Password & Sign In'}
              </button>

              <button
                type="button"
                className="btn btn-outline btn-full"
                onClick={() => { setMode('signin'); setErrorMsg(''); }}
              >
                <span>Cancel</span>
              </button>
            </form>
          )}

          {/* ================= 2FA / OTP VERIFICATION ================= */}
          {mode === 'otp' && (
            <form onSubmit={handleVerifyOtp}>
              {sampleOtpHint && (
                <div style={{ textAlign: 'center', marginBottom: '0.75rem', fontSize: '0.82rem', color: 'var(--blue-accent)' }}>
                  Server Generated Security Code: <strong>{sampleOtpHint}</strong>
                </div>
              )}

              <div className="otp-container">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    className="otp-input"
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              <div style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {otpCountdown > 0 ? (
                  <span>Code expires in <strong>{otpCountdown}s</strong></span>
                ) : (
                  <button 
                    type="button" 
                    className="link-forgot"
                    onClick={() => { setOtpCountdown(60); setSuccessMsg('New security code generated.'); }}
                  >
                    Resend code
                  </button>
                )}
                <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                  (Tip: Enter <strong>{sampleOtpHint || '123456'}</strong> for instant verification)
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                style={{ padding: '0.85rem', marginBottom: '1rem' }}
                disabled={isLoading}
              >
                {isLoading ? 'Verifying with Server...' : 'Verify & Sign In'}
              </button>

              <button
                type="button"
                className="btn btn-outline btn-full"
                onClick={() => { setMode('signup'); setErrorMsg(''); }}
              >
                <span>Back to Registration</span>
              </button>
            </form>
          )}

          {/* Bottom Security Note */}
          <div className="auth-security-footer">
            <span>End-to-end encrypted for victim case protection</span>
          </div>
        </div>

        {/* Right Side Trust & Transparency Panel */}
        <div className="auth-trust-panel">
          {isAdminPortal ? (
            <div>
              <div className="trust-panel-badge" style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                <span>Restricted Operations Console</span>
              </div>

              <h2 className="trust-panel-title">
                Case Operations & Dossier Management.
              </h2>

              <p className="trust-panel-lead">
                Internal management portal for reviewing victim claims, updating investigation milestones, verifying sworn affidavits, and dispatching communication.
              </p>

              <ul className="trust-features-list">
                <li className="trust-feature-item">
                  <div className="trust-feature-index">01</div>
                  <div>
                    <h4>Case Lifecycle Control</h4>
                    <p>Update case stages from Submitted through to Settled or Closed.</p>
                  </div>
                </li>

                <li className="trust-feature-item">
                  <div className="trust-feature-index">02</div>
                  <div>
                    <h4>Milestone Progression</h4>
                    <p>Activate or complete the 4 standardized dispute tracking milestones.</p>
                  </div>
                </li>

                <li className="trust-feature-item">
                  <div className="trust-feature-index">03</div>
                  <div>
                    <h4>Direct Specialist Messaging</h4>
                    <p>Communicate directly with claimants and answer inquiries in real-time.</p>
                  </div>
                </li>
              </ul>
            </div>
          ) : (
            <div>
              <div className="trust-panel-badge">
                <span>Consumer Protection Standard</span>
              </div>

              <h2 className="trust-panel-title">
                Structured dispute filings.
              </h2>

              <p className="trust-panel-lead">
                Compile bank-ready evidence dossiers for official dispute channels without false recovery promises.
              </p>

              <ul className="trust-features-list">
                <li className="trust-feature-item">
                  <div className="trust-feature-index">01</div>
                  <div>
                    <h4>Bank-Ready Dossiers</h4>
                    <p>Organize statements and chats into admissible dispute records.</p>
                  </div>
                </li>

                <li className="trust-feature-item">
                  <div className="trust-feature-index">02</div>
                  <div>
                    <h4>Official Routing</h4>
                    <p>Target specific card chargeback or bank ombudsman channels.</p>
                  </div>
                </li>

                <li className="trust-feature-item">
                  <div className="trust-feature-index">03</div>
                  <div>
                    <h4>Milestone Tracking</h4>
                    <p>Follow investigation updates directly in your portal.</p>
                  </div>
                </li>
              </ul>
            </div>
          )}

          <div className="trust-panel-footer">
            <p>
              US.ClaimBack is an evidence preparation service. We do not guarantee fund recovery. Final outcomes rest with financial institutions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
