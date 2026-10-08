import React, { useState, useEffect } from 'react';
import {
  Search, Plus, Minus, Star, ArrowRight, ArrowUpRight,
  FileText, FolderLock, PackageCheck, Activity,
  ShoppingBag, Globe, Landmark, CreditCard, TrendingUp, Users, Wrench, Layers,
  LayoutDashboard, CheckCircle2, Clock3, Share2, Copy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Reveal, RollingNumber } from '../components/Motion';
import './HomePage.css';

const STEP_ICONS = [FileText, FolderLock, PackageCheck, Activity];

const SCAM_ICONS = {
  'online-shopping': ShoppingBag,
  'fake-website': Globe,
  'bank-transfer': Landmark,
  'card-payment': CreditCard,
  'investment-scam': TrendingUp,
  'social-media': Users,
  'service-scam': Wrench,
  other: Layers,
};

const MOCK_TABS = ['Incident Details', 'Evidence Vault', 'Dispute Package', 'Live Milestones'];

function StarRow({ size = 14 }) {
  return (
    <span className="star-row" aria-label="5 out of 5 stars">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={size} strokeWidth={0} fill="currentColor" />
      ))}
    </span>
  );
}

export default function HomePage({ onStartCase, onOpenAuth, onNavigate }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [faqSearch, setFaqSearch] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const { currentUser, isAuthenticated, signOut } = useAuth();

  // Cycle the highlighted tab in the hero dashboard preview
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return undefined;
    const id = setInterval(() => setActiveTab((t) => (t + 1) % MOCK_TABS.length), 2600);
    return () => clearInterval(id);
  }, []);

  const stepsData = [
    {
      num: 1,
      title: "1. Report Incident",
      desc: "Enter transaction details, amount, and recipient information.",
      badgeText: "Incident Details"
    },
    {
      num: 2,
      title: "2. Submit Evidence",
      desc: "Upload bank statements, receipts, and chat screenshots.",
      badgeText: "Evidence Vault"
    },
    {
      num: 3,
      title: "3. Build Dossier",
      desc: "We organize records into a formal bank dispute filing.",
      badgeText: "Dispute Package"
    },
    {
      num: 4,
      title: "4. Track Progress",
      desc: "Monitor case milestones and bank responses in real time.",
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
    <div className="home-page">
      {/* ================= AUTHENTICATED SESSION BANNER ================= */}
      {isAuthenticated && currentUser && (
        <div className="session-banner">
          <div className="container session-banner-inner">
            <span className="session-banner-text">
              Logged in as <strong>{currentUser.fullName || currentUser.name}</strong> ({currentUser.email}) &bull; Active Session
            </span>
            <div className="session-banner-actions">
              <button
                className="btn btn-primary session-btn"
                onClick={() => onNavigate && onNavigate('dashboard')}
              >
                Go to Member Dashboard <ArrowRight size={14} strokeWidth={2.4} />
              </button>
              <button className="btn btn-glass session-btn" onClick={signOut}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= HERO ================= */}
      <section className={`hero-section ${isAuthenticated && currentUser ? '' : 'under-nav'}`}>
        <div className="hero-frame">
        <div className="hero-bg" aria-hidden="true" />
        <div className="container hero-inner">
          <div className="hero-center">
            <Reveal className="hero-trust-badge">
              <span className="hero-badge-dot" />
              <span>Dispute Preparation & Dossier Routing</span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="hero-title">
                Report Scams.<br />
                <em>Build Your Dispute.</em>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="hero-lead">
                We organize your evidence and prepare formal dispute dossiers for your bank or card issuer.
              </p>
            </Reveal>

            <Reveal delay={240} className="hero-cta-group">
              <button className="btn btn-lime" onClick={onStartCase}>
                Start a Case <ArrowUpRight size={16} strokeWidth={2.2} />
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
                <button className="btn btn-outline-light hero-signin-btn" onClick={() => onOpenAuth('signin')}>
                  Sign In
                </button>
              )}
            </Reveal>

            {!isAuthenticated && (
              <Reveal delay={300} className="hero-member-login-banner">
                <span className="hero-member-login-text">Existing claimant?</span>
                <button type="button" className="hero-member-login-link" onClick={() => onOpenAuth('signin')}>
                  Sign in to your dispute account <ArrowRight size={13} strokeWidth={2.4} />
                </button>
              </Reveal>
            )}

            <Reveal delay={340} className="hero-trust-statement">
              <span>Independent dispute preparation &bull; Non-guarantee policy</span>
            </Reveal>
          </div>

          {/* Dashboard preview inside a browser frame */}
          <Reveal delay={200} className="hero-mock-wrap">
            <div className="mock-browser">
              <div className="mock-chrome">
                <div className="mock-dots"><i /><i /><i /></div>
                <div className="mock-url">usclaimback.com</div>
                <div className="mock-chrome-icons"><Share2 size={14} /><Copy size={14} /></div>
              </div>

              <div className="mock-body">
                <div className="mock-tabs" role="tablist">
                  {MOCK_TABS.map((tab, i) => (
                    <span key={tab} className={`mock-tab ${activeTab === i ? 'active' : ''}`}>
                      {activeTab === i && <span className="mock-tab-dot" />}
                      {tab}
                    </span>
                  ))}
                </div>

                <div className="mock-layout">
                  <aside className="mock-sidebar">
                    <div className="mock-side-item active"><LayoutDashboard size={15} /> Active Case</div>
                    <div className="mock-side-item"><FolderLock size={15} /> Evidence Vault</div>
                    <div className="mock-side-item"><PackageCheck size={15} /> Dispute Package</div>
                    <div className="mock-side-item"><Activity size={15} /> Live Milestones</div>
                  </aside>

                  <div className="mock-main">
                    <div className="mock-stats">
                      <div className="mock-stat">
                        <span className="mock-stat-label">Active Case</span>
                        <span className="mock-stat-value">#RG-<RollingNumber value="10482" /></span>
                        <span className="mock-chip">Under Review</span>
                      </div>
                      <div className="mock-stat">
                        <span className="mock-stat-label">Reported Sum:</span>
                        <span className="mock-stat-value"><RollingNumber value="$4,850.00" /></span>
                        <span className="mock-chip lime">USD</span>
                      </div>
                      <div className="mock-stat">
                        <span className="mock-stat-label">Live Milestones</span>
                        <span className="mock-stat-value"><RollingNumber value="03" /></span>
                        <span className="mock-chip">Review in Progress</span>
                      </div>
                    </div>

                    <div className="mock-panels">
                      <div className="mock-panel">
                        <div className="mock-panel-title">Active Case</div>
                        <div className="mock-milestone done">
                          <CheckCircle2 size={16} />
                          <div>
                            <strong>Evidence Dossier Compiled</strong>
                            <span>Wire receipts & chat records verified</span>
                          </div>
                        </div>
                        <div className="mock-milestone done">
                          <CheckCircle2 size={16} />
                          <div>
                            <strong>Dispute Channel Identified</strong>
                            <span>Interbank Recall & Ombudsman Route</span>
                          </div>
                        </div>
                        <div className="mock-milestone pending">
                          <Clock3 size={16} />
                          <div>
                            <strong>Review in Progress</strong>
                            <span>Correspondent bank filing submitted</span>
                          </div>
                        </div>
                      </div>

                      <div className="mock-panel mock-chart-panel">
                        <div className="mock-panel-title">Reported Sum:</div>
                        <div className="mock-bars" aria-hidden="true">
                          {[38, 52, 46, 68, 60, 82, 74].map((h, i) => (
                            <span key={i} style={{ '--bar-h': `${h}%`, '--bar-delay': `${i * 90}ms` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="how-it-works" className="home-section">
        <div className="container">
          <Reveal className="section-header-center">
            <div className="section-tag">Process</div>
            <h2 className="section-title">How It Works</h2>
          </Reveal>

          <div className="steps-grid">
            {stepsData.map((step, idx) => {
              const Icon = STEP_ICONS[idx];
              return (
                <Reveal key={step.num} delay={idx * 90} className="step-card">
                  <div className="step-visual">
                    <div className="step-visual-icon">
                      <Icon size={30} strokeWidth={1.8} />
                    </div>
                    <div className="step-visual-lines" aria-hidden="true">
                      <span /><span /><span />
                    </div>
                    <div className="step-badge-number-overlay">{step.num}</div>
                  </div>

                  <div className="step-content-body">
                    <div className="step-kicker">{step.badgeText}</div>
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= SCAM TYPES ================= */}
      <section id="scam-types" className="home-section">
        <div className="container">
          <Reveal className="section-header-center">
            <div className="section-tag">Categories</div>
            <h2 className="section-title">Dispute Categories</h2>
          </Reveal>

          <div className="scams-grid">
            {scamTypes.map((item, idx) => {
              const Icon = SCAM_ICONS[item.id] || Layers;
              return (
                <Reveal key={item.id} delay={(idx % 4) * 80} className="scam-card" onClick={onStartCase}>
                  <div>
                    <div className="scam-icon-wrap">
                      <Icon size={20} strokeWidth={1.9} />
                    </div>
                    <div className="scam-kicker">Category</div>
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                  <span className="scam-link-action">
                    Select <ArrowRight size={14} strokeWidth={2.4} />
                  </span>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= CASE PORTAL PREVIEW ================= */}
      <section className="home-section">
        <div className="container">
          <Reveal className="section-header-center">
            <div className="section-tag">Tracking</div>
            <h2 className="section-title">Case Portal Preview</h2>
          </Reveal>

          <Reveal className="preview-glass-container">
            <div className="preview-head">
              <div>
                <span className="preview-eyebrow">Sample View</span>
                <h3 className="preview-title">Case #RG-10482</h3>
              </div>
              <div className="preview-actions">
                <button className="btn btn-outline-light preview-btn" onClick={() => onOpenAuth('signin')}>Sign In</button>
                <button className="btn btn-lime preview-btn" onClick={onStartCase}>New Case</button>
              </div>
            </div>

            <div className="preview-stats">
              <div className="preview-stat">
                <span>Disputed Sum</span>
                <strong><RollingNumber value="$4,850.00" /> USD</strong>
              </div>
              <div className="preview-stat">
                <span>Date</span>
                <strong>Jan 14, 2026</strong>
              </div>
              <div className="preview-stat">
                <span>Method</span>
                <strong>Bank Wire</strong>
              </div>
              <div className="preview-stat">
                <span>Status</span>
                <strong className="preview-status">Under Review</strong>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= CLIENT REVIEWS ================= */}
      <section id="reviews" className="home-section">
        <div className="container">
          <Reveal className="section-header-center">
            <div className="section-tag">Feedback</div>
            <h2 className="section-title">Verified Case Outcomes</h2>
          </Reveal>

          <Reveal className="reviews-aggregate-wrap">
            <div className="reviews-aggregate-bar">
              <StarRow size={15} />
              <span className="aggregate-text"><RollingNumber value="4.9" />/5 Rating</span>
              <span className="aggregate-sub">&bull; Verified Claimant Submissions</span>
            </div>
          </Reveal>

          <div className="reviews-grid">
            {reviewsData.map((rev, idx) => (
              <Reveal key={rev.id} delay={(idx % 2) * 100} className="review-card">
                <div>
                  <div className="review-card-top">
                    <StarRow size={14} />
                    <span className="review-verified-tag">{rev.caseNumber}</span>
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
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HELP CENTER & FAQS ================= */}
      <section id="help-center" className="home-section">
        <div className="container">
          <Reveal className="section-header-center">
            <div className="section-tag">FAQ</div>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </Reveal>

          <Reveal className="faq-container">
            <div className="faq-search-box">
              <Search size={16} className="faq-search-icon" />
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
                <div key={index} className={`faq-item ${isOpen ? 'open' : ''}`}>
                  <button
                    className="faq-question-btn"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                  >
                    <span>{faq.q}</span>
                    <span className="faq-toggle-icon">
                      {isOpen ? <Minus size={16} strokeWidth={2.2} /> : <Plus size={16} strokeWidth={2.2} />}
                    </span>
                  </button>
                  <div className="faq-answer-wrap">
                    <div className="faq-answer-box">{faq.a}</div>
                  </div>
                </div>
              );
            })}
          </Reveal>
        </div>
      </section>
    </div>
  );
}
