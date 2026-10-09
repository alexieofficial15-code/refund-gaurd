import React from 'react';
import { BrandLockup } from './BrandMark';
import './Footer.css';

export default function Footer({ onNavigate }) {
  return (
    <footer className="footer-section">
      <div className="container">
        {/* Main Grid */}
        <div className="footer-grid">
          {/* Col 1: Brand & Mission */}
          <div className="footer-brand-col">
            <div className="brand-logo" onClick={() => onNavigate && onNavigate('home')}>
              <BrandLockup markSize={92} />
            </div>
            <p className="footer-brand-desc">
              Evidence preparation and dispute documentation platform for consumers and merchants.
            </p>
          </div>

          {/* Col 2: Platform Navigation */}
          <div>
            <h4 className="footer-col-title">Platform</h4>
            <ul className="footer-links-list">
              <li>
                <button className="footer-link-btn" onClick={() => onNavigate && onNavigate('how-it-works')}>
                  How It Works
                </button>
              </li>
              <li>
                <button className="footer-link-btn" onClick={() => onNavigate && onNavigate('scam-types')}>
                  Dispute Types
                </button>
              </li>
              <li>
                <button className="footer-link-btn" onClick={() => onNavigate && onNavigate('reviews')}>
                  Case Outcomes
                </button>
              </li>
              <li>
                <button className="footer-link-btn" onClick={() => onNavigate && onNavigate('help-center')}>
                  Help Center
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Resources & Safety */}
          <div>
            <h4 className="footer-col-title">Assistance</h4>
            <ul className="footer-links-list">
              <li>
                <button className="footer-link-btn" onClick={() => onNavigate && onNavigate('help-center')}>
                  Help Center & FAQs
                </button>
              </li>
              <li>
                <button className="footer-link-btn" onClick={() => onNavigate && onNavigate('help-center')}>
                  Evidence Guide
                </button>
              </li>
              <li>
                <button className="footer-link-btn" onClick={() => onNavigate && onNavigate('scam-types')}>
                  Scam Prevention
                </button>
              </li>
              <li>
                <button className="footer-link-btn" onClick={() => onNavigate && onNavigate('help-center')}>
                  Ombudsman Directory
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & Transparency */}
          <div>
            <h4 className="footer-col-title">Compliance</h4>
            <ul className="footer-links-list">
              <li>
                <button className="footer-link-btn" onClick={() => onNavigate && onNavigate('help-center')}>
                  Terms of Service
                </button>
              </li>
              <li>
                <button className="footer-link-btn" onClick={() => onNavigate && onNavigate('help-center')}>
                  Privacy & Data Security
                </button>
              </li>
              <li>
                <button className="footer-link-btn" onClick={() => onNavigate && onNavigate('help-center')}>
                  Non-Guarantee Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Highlighted Mandatory Transparency Disclaimer */}
        <div className="footer-disclaimer-wrapper">
          <div className="footer-disclaimer-title">
            <span>Regulatory & Non-Guarantee Notice</span>
          </div>
          <p className="footer-disclaimer-text">
            US.ClaimBack is an evidence preparation service and does not guarantee fund recovery. Final dispute outcomes rest solely with financial institutions, card networks, and regulatory authorities.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <div>
            &copy; {new Date().getFullYear()} US.ClaimBack Inc. All rights reserved.
          </div>
          <div className="footer-cert-badges">
            <div className="cert-item">
              <span>Evidence Integrity Hashed</span>
            </div>
            <div className="cert-item">
              <span>Standardized Dossier Formats</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
