import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

export default function HomePage({ onStartCase, onOpenAuth, onNavigate }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [faqSearch, setFaqSearch] = useState('');
  const { currentUser, isAuthenticated, signOut } = useAuth();

  const stepsData = [
    {
      num: 1,
      title: "1. Report Incident",
      desc: "Enter transaction details, amount, and recipient information.",
      image: "/images/step1_report.jpg",
      badgeText: "Incident Details"
    },
    {
      num: 2,
      title: "2. Submit Evidence",
      desc: "Upload bank statements, receipts, and chat screenshots.",
      image: "/images/step2_evidence.jpg",
      badgeText: "Evidence Vault"
    },
    {
      num: 3,
      title: "3. Build Dossier",
      desc: "We organize records into a formal bank dispute filing.",
      image: "/images/step3_dossier.jpg",
      badgeText: "Dispute Package"
    },
    {
      num: 4,
      title: "4. Track Progress",
      desc: "Monitor case milestones and bank responses in real time.",
      image: "/images/step4_tracking.jpg",
      badgeText: "Live Milestones"
    }
  ];

  const scamTypes = [
    { id: 'online-shopping', title: 'Online Shopping', desc: 'Undelivered goods or fake merchant storefronts.' },
    { id: 'fake-website', title: 'Phishing & Spoofing', desc: 'Cloned bank portals and fake payment pages.' },
    { id: 'bank-transfer', title: 'Bank Wire Fraud', desc: 'Authorized push payment and rogue accounts.' },
    { id: 'card-payment', title: 'Card Fraud', desc: 'Unauthorized charges and subscription traps.' },
    { id: 'investment-scam', title: 'Investment Scams', desc: 'Unregulated brokers and fake trading platforms.' },
    { id: 'social-media', title: 'Social Media Fraud', desc: 'Impersonation and marketplace deception.' },
    { id: 'service-scam', title: 'Service Scams', desc: 'Unfulfilled upfront contracts and ghost services.' },
    { id: 'other', title: 'Other Transactions', desc: 'Complex disputes involving multiple intermediaries.' },
  ];

  const faqs = [
    {
      q: "How does dispute assistance work?",
      a: "We organize your transaction statements and correspondence into a structured dispute dossier ready to submit to your bank or card issuer."
    },
    {
      q: "What evidence should I provide?",
      a: "Bank or card statements, payment receipts, and screenshots of seller communications."
    },
    {
      q: "How long does a dispute take?",
      a: "Card disputes typically take 30–60 days, while bank wire recalls depend on institutional review times."
    },
    {
      q: "Is fund recovery guaranteed?",
      a: "No. Determinations rest solely with financial institutions and regulatory authorities. We do not make false guarantees."
    }
  ];

  const reviewsData = [
    {
      id: 1,
      name: "Marcus T.",
      location: "Chicago, IL",
      avatar: "MT",
      incident: "Brokerage Wire Fraud",
      disputed: "$6,200 USD",
      resolution: "Interbank Recall",
      rating: "5.0",
      caseNumber: "RG-09418",
      quote: "Organized my SWIFT confirmations and wire receipts into a clear filing—bank returned funds in 45 days."
    },
    {
      id: 2,
      name: "Clara N.",
      location: "London, UK",
      avatar: "CN",
      incident: "Shopping Non-Delivery",
      disputed: "£850 GBP",
      resolution: "Visa Chargeback",
      rating: "5.0",
      caseNumber: "RG-10255",
      quote: "The dossier clearly established seller non-delivery; my card issuer credited the full chargeback in 3 weeks."
    },
    {
      id: 3,
      name: "Daniel K.",
      location: "Sydney, Australia",
      avatar: "DK",
      incident: "Recurring Billing Trap",
      disputed: "$1,420 AUD",
      resolution: "Merchant Refund",
      rating: "5.0",
      caseNumber: "RG-08972",
      quote: "Documented unauthorized repeat billing patterns, leading to a prompt merchant refund for all 5 cycles."
    },
    {
      id: 4,
      name: "Julian B.",
      location: "Austin, TX",
      avatar: "JB",
      incident: "Phishing Clone Portal",
      disputed: "$3,800 USD",
      resolution: "Credit Union Refund",
      rating: "5.0",
      caseNumber: "RG-09841",
      quote: "Clean chronological dossier of the cloned phishing portal that expedited my credit union's claim approval."
    }
  ];

  const filteredFaqs = faqs.filter(f => 
    f.q.toLowerCase().includes(faqSearch.toLowerCase()) || 
    f.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div>
      {/* ================= AUTHENTICATED SESSION BANNER ================= */}
      {isAuthenticated && currentUser && (
        <div style={{ backgroundColor: 'rgba(236, 253, 245, 0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #a7f3d0', padding: '0.85rem 1rem' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '0.88rem', color: '#065f46', fontWeight: 500 }}>
                Logged in as <strong>{currentUser.fullName || currentUser.name}</strong> ({currentUser.email}) &bull; Active Session
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                onClick={() => onNavigate && onNavigate('dashboard')}
              >
                Go to Member Dashboard &rarr;
              </button>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', borderColor: '#a7f3d0', color: '#065f46', backgroundColor: '#ffffff' }}
                onClick={signOut}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= HERO SECTION (NO AI SHIELD LOGOS) ================= */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-content">
              <div className="hero-trust-badge">
                <span>Dispute Preparation & Dossier Routing</span>
              </div>

              <h1 className="hero-title">
                Report Scams.<br />
                Build Your Dispute.
              </h1>

              <p className="hero-lead">
                We organize your evidence and prepare formal dispute dossiers for your bank or card issuer.
              </p>

              <div className="hero-cta-group">
                <button 
                  className="btn btn-primary" 
                  onClick={onStartCase}
                >
                  Start a Case
                </button>

                <button 
                  className="btn btn-glass" 
                  onClick={() => {
                    const el = document.getElementById('how-it-works');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  See How It Works
                </button>

                {!isAuthenticated && (
                  <button 
                    className="btn btn-outline hero-signin-btn" 
                    onClick={() => onOpenAuth('signin')}
                  >
                    Sign In
                  </button>
                )}
              </div>

              {!isAuthenticated && (
                <div className="hero-member-login-banner">
                  <span className="hero-member-login-text">Existing claimant?</span>
                  <button 
                    type="button" 
                    className="hero-member-login-link"
                    onClick={() => onOpenAuth('signin')}
                  >
                    Sign in to your dispute account &rarr;
                  </button>
                </div>
              )}

              <div className="hero-trust-statement">
                <span>Independent dispute preparation &bull; Non-guarantee policy</span>
              </div>
            </div>

            {/* Right Financial Record Graphic */}
            <div className="hero-graphic-wrap">
              <div className="hero-graphic-card">
                <div className="graphic-card-header">
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>Active Case</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy-primary)' }}>#RG-10482</div>
                  </div>
                  <span className="graphic-pill-status">
                    Under Review
                  </span>
                </div>

                <div className="graphic-milestone-row completed">
                  <div className="graphic-milestone-tag">01</div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-primary)' }}>Evidence Dossier Compiled</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Wire receipts & chat records verified</div>
                  </div>
                </div>

                <div className="graphic-milestone-row completed">
                  <div className="graphic-milestone-tag">02</div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-primary)' }}>Dispute Channel Identified</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Interbank Recall & Ombudsman Route</div>
                  </div>
                </div>

                <div className="graphic-milestone-row" style={{ backgroundColor: 'rgba(255, 251, 235, 0.85)', borderColor: 'rgba(253, 230, 138, 0.7)' }}>
                  <div className="graphic-milestone-tag pending">03</div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-primary)' }}>Review in Progress</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Correspondent bank filing submitted</div>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Reported Sum:</span>
                  <strong style={{ color: 'var(--navy-primary)' }}>$4,850.00 USD</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS: 4-STEP EXPLANATION BOXES ================= */}
      <section id="how-it-works" className="home-section subtle-bg">
        <div className="container">
          <div className="section-header-center">
            <div className="section-tag">Process</div>
            <h2 className="section-title">How It Works</h2>
          </div>

          <div className="steps-grid">
            {stepsData.map(step => (
              <div key={step.num} className="step-card">
                <div className="step-image-container">
                  <img 
                    src={step.image} 
                    alt={step.title}
                    className="step-image-asset" 
                    loading="lazy"
                  />
                  <div className="step-badge-number-overlay">
                    {step.num}
                  </div>
                </div>

                <div className="step-content-body">
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--blue-accent)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                    {step.badgeText}
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SCAM TYPES (CLEAN TYPOGRAPHY CARDS) ================= */}
      <section id="scam-types" className="home-section">
        <div className="container">
          <div className="section-header-center">
            <div className="section-tag">Categories</div>
            <h2 className="section-title">Dispute Categories</h2>
          </div>

          <div className="scams-grid">
            {scamTypes.map(item => (
              <div key={item.id} className="scam-card" onClick={onStartCase}>
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--blue-accent)', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Category
                  </div>
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
                <span className="scam-link-action">
                  Select →
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CASE DASHBOARD PREVIEW ================= */}
      <section className="home-section subtle-bg">
        <div className="container">
          <div className="section-header-center">
            <div className="section-tag">Tracking</div>
            <h2 className="section-title">Case Portal Preview</h2>
          </div>

          <div className="preview-glass-container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase' }}>Sample View</span>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--navy-primary)', fontWeight: 700 }}>Case #RG-10482</h3>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button className="btn btn-outline" style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }} onClick={() => onOpenAuth('signin')}>Sign In</button>
                <button className="btn btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }} onClick={onStartCase}>New Case</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem', background: 'rgba(248, 250, 252, 0.85)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Disputed Sum</span>
                <div style={{ fontWeight: 700, color: 'var(--navy-primary)', fontSize: '0.98rem' }}>$4,850.00 USD</div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Date</span>
                <div style={{ fontWeight: 600, color: 'var(--navy-primary)', fontSize: '0.88rem' }}>Jan 14, 2026</div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Method</span>
                <div style={{ fontWeight: 600, color: 'var(--navy-primary)', fontSize: '0.88rem' }}>Bank Wire</div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Status</span>
                <div style={{ fontWeight: 600, color: 'var(--status-warning-text)', fontSize: '0.88rem' }}>Under Review</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CLIENT REVIEWS & EXPERIENCES ================= */}
      <section id="reviews" className="home-section">
        <div className="container">
          <div className="section-header-center">
            <div className="section-tag">Feedback</div>
            <h2 className="section-title">Verified Case Outcomes</h2>
          </div>

          <div className="reviews-aggregate-wrap">
            <div className="reviews-aggregate-bar">
              <span style={{ color: '#d97706', fontWeight: 700 }}>★★★★★</span>
              <span className="aggregate-text">4.9/5 Rating</span>
              <span className="aggregate-sub">&bull; Verified Claimant Submissions</span>
            </div>
          </div>

          <div className="reviews-grid">
            {reviewsData.map(rev => (
              <div key={rev.id} className="review-card">
                <div>
                  <div className="review-card-top">
                    <div style={{ color: '#d97706', fontSize: '0.82rem', letterSpacing: '1px' }}>
                      ★★★★★
                    </div>
                    <span className="review-verified-tag">
                      {rev.caseNumber}
                    </span>
                  </div>

                  <div className="review-incident-type">{rev.incident}</div>
                  <p className="review-quote">"{rev.quote}"</p>
                </div>

                <div className="review-meta-box">
                  <div className="reviewer-profile">
                    <div className="reviewer-avatar">{rev.avatar}</div>
                    <div>
                      <div className="reviewer-name">{rev.name}</div>
                      <div className="reviewer-location">{rev.location}</div>
                    </div>
                  </div>

                  <div className="review-outcome-pill">
                    <span className="review-dispute-amt">{rev.disputed}</span>
                    <span className="review-resolution-tag">{rev.resolution}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HELP CENTER & FAQS ================= */}
      <section id="help-center" className="home-section">
        <div className="container">
          <div className="section-header-center">
            <div className="section-tag">FAQ</div>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>

          <div className="faq-container">
            <div className="faq-search-box">
              <input 
                type="text" 
                placeholder="Search questions..." 
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
              />
            </div>

            {filteredFaqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="faq-item">
                  <button 
                    className="faq-question-btn"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                  >
                    <span>{faq.q}</span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-subtle)' }}>{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="faq-answer-box">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
