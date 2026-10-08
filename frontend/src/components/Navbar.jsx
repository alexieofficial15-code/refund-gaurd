import React, { useState, useEffect } from 'react';
import { Menu, X, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BrandMark from './BrandMark';
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

  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'investigator';

  return (
    <header className="navbar-header">
      <div className="container">
        <div className={`navbar-pill ${isAuthenticated ? 'is-member' : ''}`}>
          {/* Brand */}
          <div className="brand-logo" onClick={() => { setActivePage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <BrandMark size={34} />
            <div className="brand-name">
              US.<span>ClaimBack</span>
            </div>
          </div>

          {isAuthenticated ? (
            /* ================= LOGGED IN MEMBER HEADER ================= */
            <div className="navbar-member-group">
              <button
                type="button"
                className={`nav-link-item ${activePage === 'home' ? 'active' : ''}`}
                onClick={() => { setActivePage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                Home
              </button>

              <button
                type="button"
                className={`nav-link-item ${activePage === 'dashboard' ? 'active' : ''}`}
                onClick={() => { setActivePage('dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                Dashboard
              </button>

              {isStaff && (
                <button
                  type="button"
                  className={`nav-admin-chip ${activePage === 'admin' ? 'active' : ''}`}
                  onClick={() => setActivePage('admin')}
                >
                  <ShieldCheck size={14} strokeWidth={2.4} />
                  Admin Desk
                </button>
              )}

              <div
                className="member-avatar-circle"
                title={`Logged in as ${currentUser?.fullName || currentUser?.name || 'Claimant'}`}
              >
                {currentUser?.avatar || (currentUser?.fullName ? currentUser.fullName[0].toUpperCase() : 'B')}
              </div>

              <button
                type="button"
                className="nav-cta-btn"
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
              <nav className="desktop-nav-links">
                <button className="nav-link-item" onClick={() => handleNavSection('how-it-works')}>
                  How It Works
                </button>
                <button className="nav-link-item" onClick={() => handleNavSection('scam-types')}>
                  Scam Types
                </button>
                <button className="nav-link-item" onClick={() => handleNavSection('reviews')}>
                  Case Reviews
                </button>
                <button
                  className="nav-link-item"
                  onClick={() => { setActivePage('track'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  Track Case
                </button>
                <button className="nav-link-item" onClick={() => handleNavSection('help-center')}>
                  Help Center
                </button>
              </nav>

              <div className="desktop-nav-actions">
                <button className="nav-signin-btn" onClick={() => onOpenAuth('signin')}>
                  Sign In
                </button>
                <button className="nav-cta-btn nav-start-case-btn" onClick={handleStartCaseClick}>
                  Start a Case
                </button>

                <button
                  className="mobile-toggle-btn"
                  onClick={() => setIsDrawerOpen(true)}
                  aria-label="Open mobile menu"
                >
                  <Menu size={18} strokeWidth={2.2} />
                  <span className="mobile-toggle-text">Menu</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Drawer (public visitors only) */}
      {!isAuthenticated && (
        <>
          <div
            className={`drawer-backdrop ${isDrawerOpen ? 'is-open' : ''}`}
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className={`mobile-nav-panel ${isDrawerOpen ? 'is-open' : ''}`}>
            <div className="drawer-content-inner">
              <div className="drawer-header">
                <div className="drawer-header-left">
                  <BrandMark size={32} />
                  <span className="drawer-title">US.ClaimBack</span>
                </div>
                <button
                  className="drawer-close-btn"
                  onClick={() => setIsDrawerOpen(false)}
                  aria-label="Close navigation"
                >
                  <X size={20} strokeWidth={2.2} />
                </button>
              </div>

              <div className="drawer-top-auth-box">
                <div>
                  <div className="drawer-top-auth-title">Existing Claimant?</div>
                  <div className="drawer-top-auth-sub">Access your live dispute dashboard</div>
                </div>
                <button type="button" className="drawer-top-signin-btn" onClick={handleAuthClick}>
                  Sign In <ArrowRight size={14} strokeWidth={2.4} />
                </button>
              </div>

              <ul className="drawer-nav-list">
                <li>
                  <button className="drawer-nav-link" onClick={() => handleNavSection('how-it-works')}>
                    <span>How It Works</span>
                  </button>
                </li>
                <li>
                  <button className="drawer-nav-link" onClick={() => handleNavSection('scam-types')}>
                    <span>Scam Types</span>
                  </button>
                </li>
                <li>
                  <button className="drawer-nav-link" onClick={() => handleNavSection('reviews')}>
                    <span>Case Reviews</span>
                  </button>
                </li>
                <li>
                  <button className="drawer-nav-link" onClick={handleStartCaseClick}>
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
                  <button className="drawer-nav-link" onClick={() => handleNavSection('help-center')}>
                    <span>Help Center</span>
                  </button>
                </li>
              </ul>

              <button className="drawer-auth-btn" onClick={handleAuthClick}>
                Sign In / Sign Up
              </button>

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
