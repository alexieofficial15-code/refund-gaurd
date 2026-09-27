import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar({ activePage, setActivePage, onOpenAuth, onStartCase }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { currentUser, signOut, isAuthenticated } = useAuth();

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isDrawerOpen]);

  // Close drawer whenever page or auth state changes
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [activePage, isAuthenticated]);

  const handleNavSection = (sectionId) => {
    setIsDrawerOpen(false);
    if (activePage !== 'home') {
      setActivePage('home');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartCaseClick = () => {
    setIsDrawerOpen(false);
    if (onStartCase) {
      onStartCase();
    } else if (!isAuthenticated) {
      onOpenAuth('signup', 'Please sign in or create an account to file and track your dispute dossier.');
    } else {
      setActivePage('start');
    }
  };

  const handleAuthClick = () => {
    setIsDrawerOpen(false);
    if (isAuthenticated) {
      signOut();
    } else {
      onOpenAuth('signin');
    }
  };

  return (
    <header className="navbar-header">
      <div className="container">
        <div className="navbar-inner">
          {/* Brand Logo with Official Emblem */}
          <div className="brand-logo" onClick={() => { setActivePage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <img src="/logo.png" alt="US.ClaimBack Emblem" className="brand-logo-img" />
            <div className="brand-name">
              US.<span>ClaimBack</span>
            </div>
          </div>

          {/* Conditional Navigation based on Auth status */}
          {isAuthenticated ? (
            /* ================= LOGGED IN MEMBER HEADER (No Navigation Drawer) ================= */
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                type="button"
                className="nav-link-item"
                onClick={() => { setActivePage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--navy-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.35rem 0.6rem' }}
              >
                Home
              </button>

              {(currentUser?.role === 'admin' || currentUser?.role === 'investigator') && (
                <button 
                  type="button" 
                  className={`nav-link-item ${activePage === 'admin' ? 'active' : ''}`}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background: activePage === 'admin' ? '#eff6ff' : '#f8fafc',
                    color: activePage === 'admin' ? '#1d4ed8' : '#2563eb',
                    border: '1px solid #bfdbfe',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setActivePage('admin')}
                >
                  ⚡ Admin Desk
                </button>
              )}

              <div 
                className="member-avatar-circle"
                title={`Logged in as ${currentUser?.fullName || currentUser?.name || 'Claimant'}`}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  border: '1.5px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
                }}
              >
                {currentUser?.avatar || (currentUser?.fullName ? currentUser.fullName[0].toUpperCase() : 'B')}
              </div>

              <button 
                type="button"
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem', borderRadius: '6px' }}
                onClick={() => {
                  signOut();
                  setActivePage('home');
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            /* ================= PUBLIC LANDING PAGE HEADER ================= */
            <>
              {/* Desktop Navigation */}
              <nav className="desktop-nav-links">
                <button 
                  className="nav-link-item"
                  onClick={() => handleNavSection('how-it-works')}
                >
                  How It Works
                </button>
                <button 
                  className="nav-link-item"
                  onClick={() => handleNavSection('scam-types')}
                >
                  Scam Types
                </button>
                <button 
                  className="nav-link-item"
                  onClick={() => handleNavSection('reviews')}
                >
                  Case Reviews
                </button>
                <button 
                  className="nav-link-item"
                  onClick={() => { setActivePage('track'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  Track Case
                </button>
                <button 
                  className="nav-link-item"
                  onClick={() => handleNavSection('help-center')}
                >
                  Help Center
                </button>
              </nav>

              {/* Desktop & Mobile Actions */}
              <div className="desktop-nav-actions">
                <button 
                  className="btn btn-outline nav-signin-btn" 
                  onClick={() => onOpenAuth('signin')}
                >
                  Sign In
                </button>
                <button 
                  className="btn btn-primary nav-start-case-btn" 
                  onClick={handleStartCaseClick}
                >
                  Start a Case
                </button>

                {/* Mobile Menu Button */}
                <button 
                  className="mobile-toggle-btn"
                  onClick={() => setIsDrawerOpen(true)}
                  aria-label="Open mobile menu"
                >
                  <span className="mobile-toggle-icon">☰</span>
                  <span className="mobile-toggle-text">Menu</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Drawer (Only for public landing page visitors; removed completely for logged-in members) */}
      {!isAuthenticated && (
        <>
          <div 
            className={`drawer-backdrop ${isDrawerOpen ? 'is-open' : ''}`}
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className={`mobile-nav-panel ${isDrawerOpen ? 'is-open' : ''}`}>
            <div className="drawer-content-inner">
              {/* Header */}
              <div className="drawer-header">
                <div className="drawer-header-left">
                  <span className="drawer-title">US.ClaimBack</span>
                </div>
                <button 
                  className="drawer-close-btn"
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="Close navigation"
                >
                  ✕
                </button>
              </div>

              {/* Top Quick Sign-in Callout inside Drawer */}
              <div className="drawer-top-auth-box">
                <div>
                  <div className="drawer-top-auth-title">Existing Claimant?</div>
                  <div className="drawer-top-auth-sub">Access your live dispute dashboard</div>
                </div>
                <button 
                  type="button"
                  className="drawer-top-signin-btn"
                  onClick={handleAuthClick}
                >
                  Sign In &rarr;
                </button>
              </div>

              {/* Public Visitor Navigation Links */}
              <ul className="drawer-nav-list">
                <li>
                  <button 
                    className="drawer-nav-link"
                    onClick={() => handleNavSection('how-it-works')}
                  >
                    <span>How It Works</span>
                  </button>
                </li>
                <li>
                  <button 
                    className="drawer-nav-link"
                    onClick={() => handleNavSection('scam-types')}
                  >
                    <span>Scam Types</span>
                  </button>
                </li>
                <li>
                  <button 
                    className="drawer-nav-link"
                    onClick={() => handleNavSection('reviews')}
                  >
                    <span>Case Reviews</span>
                  </button>
                </li>
                <li>
                  <button 
                    className="drawer-nav-link"
                    onClick={handleStartCaseClick}
                  >
                    <span>Start a Case</span>
                  </button>
                </li>
                <li>
                  <button 
                    className="drawer-nav-link"
                    onClick={() => { setIsDrawerOpen(false); setActivePage('track'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    <span>Track Case</span>
                  </button>
                </li>
                <li>
                  <button 
                    className="drawer-nav-link"
                    onClick={() => handleNavSection('help-center')}
                  >
                    <span>Help Center</span>
                  </button>
                </li>
              </ul>

              {/* Action Button: Sign In / Sign Up */}
              <button 
                className="drawer-auth-btn"
                onClick={handleAuthClick}
              >
                Sign In / Sign Up
              </button>

              {/* Footer Disclaimer Card */}
              <div className="drawer-disclaimer-card">
                <p>
                  US.ClaimBack is an evidence preparation and dispute assistance service. We do not guarantee fund recovery. Final determinations rest with the respective financial institutions or regulatory authorities.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
