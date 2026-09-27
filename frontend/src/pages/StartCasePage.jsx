import React, { useState } from 'react';
import { 
  Shield, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  UploadCloud, 
  FileText, 
  X, 
  Lock, 
  CreditCard, 
  Landmark, 
  Smartphone, 
  Globe, 
  ShoppingBag, 
  Layers, 
  AlertCircle,
  Copy,
  Check,
  Download,
  Compass,
  PhoneCall,
  Clock,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './StartCasePage.css';

export default function StartCasePage({ onCaseSubmitted, onTrackCase, onOpenAuth, onCancel }) {
  const { currentUser, token, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [copiedReference, setCopiedReference] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Case Form State
  const [caseData, setCaseData] = useState({
    scamType: 'Online Shopping Scam',
    amount: '1850.00',
    currency: 'USD',
    transactionDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Wire / Transfer',
    recipientName: 'Apex Global Trade Ltd',
    recipientAccountOrHandle: 'GB89 BARC 2004 1538 9012',
    recipientWebsite: 'https://bogus-trader-node.io',
    evidenceFiles: [],
    acknowledgedLegal: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCaseId, setSubmittedCaseId] = useState(null);

  // 1-Click Copy Helper
  const handleCopy = (text, type = 'ref') => {
    navigator.clipboard.writeText(text);
    if (type === 'ref') {
      setCopiedReference(true);
      setTimeout(() => setCopiedReference(false), 2200);
    } else {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2200);
    }
  };

  // Generate and Download Official PDF / Print Docket
  const downloadDossierSummaryPDF = () => {
    const caseId = submittedCaseId || 'RG-10482';
    const claimantName = currentUser?.fullName || currentUser?.name || 'Verified Claimant';
    const claimantEmail = currentUser?.email || 'Registered Member';
    const dateFormatted = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const amountFormatted = parseFloat(caseData.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>US.ClaimBack Dispute Dossier - ${caseId}</title>
  <style>
    @media print {
      @page { margin: 15mm; }
      body { -webkit-print-color-adjust: exact; }
    }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 30px; color: #0b192e; line-height: 1.5; font-size: 13px; }
    .header { border-bottom: 2px solid #0b192e; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    .brand-name { font-size: 24px; font-weight: 800; color: #0b192e; }
    .brand-name span { color: #10b981; }
    .header-tag { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .badge { background: #e0f2fe; color: #0369a1; padding: 5px 12px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; border: 1px solid #bae6fd; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .meta-table th, .meta-table td { padding: 9px 12px; border: 1px solid #e2e8f0; text-align: left; }
    .meta-table th { background-color: #f8fafc; font-weight: 600; width: 28%; color: #475569; }
    .section-title { font-size: 13px; font-weight: 700; margin-top: 18px; margin-bottom: 8px; color: #0b192e; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .narrative-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; white-space: pre-wrap; margin-bottom: 15px; font-size: 12px; }
    .footer { margin-top: 35px; border-top: 1px solid #cbd5e1; padding-top: 12px; font-size: 10px; color: #64748b; text-align: center; }
    .watermark { font-size: 10px; color: #059669; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-name">US.<span>ClaimBack</span></div>
      <div class="header-tag">Official Dispute Intake Dossier & Evidence Record</div>
    </div>
    <div style="text-align: right;">
      <span class="badge">Intake Reference: ${caseId}</span>
      <div style="margin-top: 5px;" class="watermark">✓ Cryptographically Logged in MongoDB Atlas</div>
    </div>
  </div>

  <table class="meta-table">
    <tr><th>Case Reference</th><td><strong>#${caseId}</strong></td></tr>
    <tr><th>Filing Date</th><td>${dateFormatted}</td></tr>
    <tr><th>Claimant Legal Name</th><td><strong>${claimantName}</strong></td></tr>
    <tr><th>Claimant Verified Email</th><td>${claimantEmail}</td></tr>
    <tr><th>Dispute Category</th><td>${caseData.scamType}</td></tr>
    <tr><th>Reported Disputed Sum</th><td><strong style="font-size: 14px; color: #0f172a;">$${amountFormatted} ${caseData.currency}</strong></td></tr>
    <tr><th>Incident / Transfer Date</th><td>${caseData.transactionDate}</td></tr>
    <tr><th>Payment Route / Channel</th><td>${caseData.paymentMethod}</td></tr>
    <tr><th>Counterparty Recipient</th><td><strong>${caseData.recipientName || 'Unverified Merchant'}</strong></td></tr>
    <tr><th>Counterparty Account / Handle</th><td>${caseData.recipientAccountOrHandle || 'N/A'}</td></tr>
    <tr><th>Counterparty Website / Node</th><td>${caseData.recipientWebsite || 'N/A'}</td></tr>
    <tr><th>Assigned Desk</th><td>Tier-1 Financial Fraud Intake Desk (Analyst Review Pending)</td></tr>
  </table>

  <div class="section-title">Claimant Statement & Narrative of Incident</div>
  <div class="narrative-box">${caseData.description || 'No additional narrative provided.'}</div>

  <div class="section-title">Cataloged Evidence Attachments (${caseData.evidenceFiles.length} records)</div>
  ${caseData.evidenceFiles.length === 0 ? `
    <div class="narrative-box" style="font-style: italic; color: #64748b; font-size: 11px;">
      No electronic evidence files attached during initial intake. Claimant may upload supporting files later via the Evidence Vault in their Member Dashboard.
    </div>
  ` : `
    <table class="meta-table">
      <tr><th style="width: 8%;">#</th><th>File Name</th><th style="width: 20%;">Size</th><th style="width: 28%;">Verification Status</th></tr>
      ${caseData.evidenceFiles.map((f, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${f.name}</strong></td>
          <td>${f.size}</td>
          <td><span style="color: #059669; font-weight: 600;">✓ Encrypted & Queued</span></td>
        </tr>
      `).join('')}
    </table>
  `}

  <div class="footer">
    US.ClaimBack Independent Dispute Preparation Services &bull; Secure Record Intake &bull; This document is an evidentiary intake compilation prepared for bank dispute filing and ombudsman review. US.ClaimBack does not guarantee financial recovery.
  </div>
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (!printWindow) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `US_ClaimBack_Dossier_${caseId}.html`;
      a.click();
    }
  };

  const steps = [
    { num: 1, title: 'What Happened?' },
    { num: 2, title: 'Transaction Details' },
    { num: 3, title: 'Payment Method' },
    { num: 4, title: 'Recipient Info' },
    { num: 5, title: 'Upload Evidence' },
    { num: 6, title: 'Review Case' },
    { num: 7, title: 'Submission' }
  ];

  const scamTypes = [
    'Online Shopping Scam',
    'Fake Website / Phishing',
    'Bank Transfer Fraud',
    'Card Payment Fraud',
    'Investment / Crypto Scam',
    'Social Media Scam',
    'Service Scam',
    'Other Suspicious Transaction'
  ];

  const paymentMethods = [
    { title: 'Bank Transfer / Wire', desc: 'Direct wire, SWIFT, SEPA, ACH or Fedwire' },
    { title: 'Credit or Debit Card', desc: 'Visa, Mastercard, American Express' },
    { title: 'Peer-to-Peer / Digital Wallet', desc: 'Apple Pay, Google Pay, Zelle, Venmo, CashApp' },
    { title: 'Cryptocurrency / Web3', desc: 'Bitcoin, USDT, Ethereum wallet transfer' },
    { title: 'Online Payment Gateway', desc: 'PayPal, Stripe, or checkout portal' },
    { title: 'Gift Cards / Voucher', desc: 'Steam, Apple, Amazon gift card redemption' }
  ];

  const [submitError, setSubmitError] = useState('');

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newItems = files.map((file, idx) => ({
      id: Date.now() + idx,
      name: file.name,
      size: file.size < 1024 * 1024 
        ? `${(file.size / 1024).toFixed(1)} KB` 
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      rawFile: file
    }));
    setCaseData(prev => ({
      ...prev,
      evidenceFiles: [...prev.evidenceFiles, ...newItems]
    }));
    e.target.value = '';
  };

  const removeFile = (id) => {
    setCaseData(prev => ({
      ...prev,
      evidenceFiles: prev.evidenceFiles.filter(f => f.id !== id)
    }));
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const token = localStorage.getItem('refundguard_token');
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const casePayload = {
        title: `${caseData.scamType} - ${caseData.recipientName || 'Disputed Transaction'}`,
        scamType: caseData.scamType,
        disputedAmount: parseFloat(caseData.amount) || 0,
        currency: caseData.currency,
        incidentDate: caseData.transactionDate,
        paymentMethod: caseData.paymentMethod,
        counterpartyInfo: {
          recipientName: caseData.recipientName,
          accountOrHandle: caseData.recipientAccountOrHandle,
          website: caseData.recipientWebsite
        },
        description: caseData.description
      };

      const res = await fetch('/api/cases', {
        method: 'POST',
        headers,
        body: JSON.stringify(casePayload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit case to dispute database.');
      }

      const createdCaseNumber = data.case.caseNumber;
      setSubmittedCaseId(createdCaseNumber);

      // Upload any real attached files
      const realFiles = caseData.evidenceFiles.filter(f => f.rawFile);
      for (const item of realFiles) {
        const formData = new FormData();
        formData.append('file', item.rawFile);
        formData.append('category', 'claimant_upload');
        formData.append('notes', `Evidence submitted during initial case registration.`);

        try {
          await fetch(`/api/evidence/cases/${createdCaseNumber}/evidence`, {
            method: 'POST',
            body: formData
          });
        } catch (uploadErr) {
          console.warn('Evidence file upload warning:', uploadErr);
        }
      }

      setCurrentStep(7);
    } catch (err) {
      console.error('Case submission error:', err);
      setSubmitError(err.message || 'Error communicating with dispute intake API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If unauthenticated, display the official authentication requirement gate
  if (!isAuthenticated) {
    return (
      <div className="start-case-page">
        <div className="container">
          <div className="wizard-container start-case-auth-gate">
            <div className="auth-gate-icon-circle">
              <Lock size={36} />
            </div>

            <h1 className="auth-gate-title">Claimant Authentication Required</h1>
            <p className="auth-gate-desc">
              To officially register an evidentiary dispute dossier, assign a dedicated financial fraud specialist, and receive real-time case tracking updates, you must sign in or create an account before filing.
            </p>

            <div className="auth-gate-btn-group">
              <button 
                className="btn btn-primary" 
                style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}
                onClick={() => onOpenAuth && onOpenAuth('signin', 'Please sign in to file and track your dispute dossier.')}
              >
                Sign In to File Case
              </button>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}
                onClick={() => onOpenAuth && onOpenAuth('signup', 'Create your claimant account to file and track your dispute dossier.')}
              >
                Create Claimant Account
              </button>
              <button 
                className="btn btn-glass" 
                style={{ padding: '0.85rem 1.5rem', fontSize: '0.95rem' }}
                onClick={onCancel}
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="start-case-page">
      <div className="container">
        <div className="wizard-container">
          {/* Authenticated Claimant Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.7rem 1rem',
            backgroundColor: 'rgba(236, 253, 245, 0.9)',
            border: '1px solid #a7f3d0',
            borderRadius: 'var(--radius-md, 8px)',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={16} color="#059669" />
              <span style={{ fontSize: '0.82rem', color: '#065f46', fontWeight: 600 }}>
                Verified Claimant: <strong>{currentUser?.fullName || currentUser?.name || 'Claimant Member'}</strong> ({currentUser?.email})
              </span>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700, textTransform: 'uppercase' }}>
              ● Cryptographic Vault
            </span>
          </div>

          {/* Progress Indicator */}
          <div className="wizard-progress-header">
            <div className="wizard-steps-indicator">
              <div className="wizard-step-bar-line" />
              {steps.map(s => {
                let statusClass = '';
                if (s.num === currentStep) statusClass = 'active';
                else if (s.num < currentStep) statusClass = 'done';
                return (
                  <div key={s.num} className={`wizard-step-bubble ${statusClass}`}>
                    {s.num < currentStep ? '✓' : s.num}
                  </div>
                );
              })}
            </div>

            <div className="wizard-current-step-label">
              <span>Step <strong>{currentStep}</strong> of 7</span>
              <strong>{steps[currentStep - 1].title}</strong>
            </div>
          </div>

          {/* ================= STEP 1: WHAT HAPPENED? ================= */}
          {currentStep === 1 && (
            <div>
              <h2 className="wizard-step-title">What type of incident occurred?</h2>
              <p className="wizard-step-lead">
                Choose the primary category that best describes how the fraudulent transaction took place.
              </p>

              <div className="selectable-grid">
                {scamTypes.map(type => (
                  <div 
                    key={type}
                    className={`selectable-card ${caseData.scamType === type ? 'selected' : ''}`}
                    onClick={() => setCaseData({ ...caseData, scamType: type })}
                  >
                    <div className="selectable-card-radio" />
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--navy-primary)' }}>{type}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= STEP 2: TRANSACTION DETAILS ================= */}
          {currentStep === 2 && (
            <div>
              <h2 className="wizard-step-title">Transaction Details</h2>
              <p className="wizard-step-lead">
                Specify the exact amount lost and when the transaction was executed.
              </p>

              <div className="form-group">
                <label className="form-label">Approximate Amount Lost</label>
                <div className="form-input-wrapper">
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="0.00"
                    value={caseData.amount}
                    onChange={(e) => setCaseData({ ...caseData, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Transaction Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={caseData.transactionDate}
                  onChange={(e) => setCaseData({ ...caseData, transactionDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Summary of the Incident</label>
                <textarea
                  className="form-input"
                  rows="4"
                  placeholder="Describe how contact was initiated and what transpired..."
                  value={caseData.description}
                  onChange={(e) => setCaseData({ ...caseData, description: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* ================= STEP 3: PAYMENT METHOD ================= */}
          {currentStep === 3 && (
            <div>
              <h2 className="wizard-step-title">How was the money paid?</h2>
              <p className="wizard-step-lead">
                Dispute rules differ significantly between card chargebacks, wire recalls, and P2P transfers.
              </p>

              <div className="selectable-grid">
                {paymentMethods.map(pm => (
                  <div 
                    key={pm.title}
                    className={`selectable-card ${caseData.paymentMethod === pm.title ? 'selected' : ''}`}
                    onClick={() => setCaseData({ ...caseData, paymentMethod: pm.title })}
                  >
                    <div className="selectable-card-radio" />
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--navy-primary)' }}>{pm.title}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pm.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= STEP 4: RECIPIENT INFO ================= */}
          {currentStep === 4 && (
            <div>
              <h2 className="wizard-step-title">Who received the money?</h2>
              <p className="wizard-step-lead">
                Enter any identifying information about the counterparty, merchant, or beneficiary account.
              </p>

              <div className="form-group">
                <label className="form-label">Recipient or Business Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Apex Trading Corp or individual account name"
                  value={caseData.recipientName}
                  onChange={(e) => setCaseData({ ...caseData, recipientName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Number / IBAN / Wallet Address / Tag</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Bank IBAN, routing number, or handle"
                  value={caseData.recipientAccountOrHandle}
                  onChange={(e) => setCaseData({ ...caseData, recipientAccountOrHandle: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Website URL or Social Media Profile Link</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://..."
                  value={caseData.recipientWebsite}
                  onChange={(e) => setCaseData({ ...caseData, recipientWebsite: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* ================= STEP 5: UPLOAD EVIDENCE ================= */}
          {currentStep === 5 && (
            <div>
              <h2 className="wizard-step-title">Secure Evidence Upload</h2>
              <p className="wizard-step-lead">
                Upload receipts, statements, chat screenshots, and invoices to support your dispute dossier.
              </p>

              <label className="dropzone-area">
                <UploadCloud size={38} color="var(--blue-accent)" style={{ margin: '0 auto 0.75rem' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--navy-primary)', marginBottom: '0.25rem' }}>
                  Click or drag files here to upload
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Accepts PDF receipts, PNG/JPG screenshots, bank statements, and zip archives (up to 50MB)
                </p>
                <input type="file" multiple style={{ display: 'none' }} onChange={handleFileUpload} />
              </label>

              {/* Uploaded Files List */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-primary)', marginBottom: '0.6rem' }}>
                  Attached Documents ({caseData.evidenceFiles.length})
                </h5>
                {caseData.evidenceFiles.length === 0 ? (
                  <div style={{
                    padding: '1.25rem',
                    textAlign: 'center',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px dashed #cbd5e1',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem'
                  }}>
                    No documents attached yet. Click the upload box above to attach receipts, bank statements, or chat logs.
                  </div>
                ) : (
                  caseData.evidenceFiles.map(file => (
                    <div key={file.id} className="card-clean" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FileText size={18} color="var(--blue-accent)" />
                        <div>
                          <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--navy-primary)' }}>{file.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginLeft: '0.5rem' }}>({file.size})</span>
                        </div>
                      </div>
                      <button type="button" className="btn-outline" style={{ padding: '0.25rem' }} onClick={() => removeFile(file.id)}>
                        <X size={15} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="disclaimer-box">
                <Lock size={14} style={{ display: 'inline', marginRight: '5px' }} />
                <strong>Evidence Privacy:</strong> All submitted files are hashed and stored in encrypted storage exclusively for case preparation and submission to dispute authorities.
              </div>
            </div>
          )}

          {/* ================= STEP 6: REVIEW YOUR CASE ================= */}
          {currentStep === 6 && (
            <div>
              <h2 className="wizard-step-title">Review Case Summary</h2>
              <p className="wizard-step-lead">
                Ensure all transaction data and evidence attachments are accurate before dossier generation.
              </p>

              <div className="card-clean" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Incident Category</label>
                    <div style={{ fontWeight: 600, color: 'var(--navy-primary)' }}>{caseData.scamType}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Reported Amount</label>
                    <div style={{ fontWeight: 700, color: 'var(--navy-primary)', fontSize: '1.1rem' }}>${caseData.amount} USD</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Payment Route</label>
                    <div style={{ fontWeight: 600, color: 'var(--navy-primary)' }}>{caseData.paymentMethod}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Recipient Entity</label>
                    <div style={{ fontWeight: 600, color: 'var(--navy-primary)' }}>{caseData.recipientName}</div>
                  </div>
                </div>

                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Attached Evidence Proof</label>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {caseData.evidenceFiles.length === 0 
                      ? 'No evidence files attached (optional)' 
                      : `${caseData.evidenceFiles.length} file(s) attached: ${caseData.evidenceFiles.map(f => f.name).join(', ')}`}
                  </div>
                </div>
              </div>

              {/* Mandatory Legal Acknowledgment */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-checkbox-label">
                  <input
                    type="checkbox"
                    checked={caseData.acknowledgedLegal}
                    onChange={(e) => setCaseData({ ...caseData, acknowledgedLegal: e.target.checked })}
                  />
                  <span>
                    I acknowledge that <strong>US.ClaimBack is an evidence preparation and dispute routing platform</strong> and does NOT promise or guarantee recovery of lost funds.
                  </span>
                </label>
              </div>

              {submitError && (
                <div className="auth-alert-banner error" style={{ padding: '0.85rem 1rem', marginBottom: '1rem' }}>
                  <AlertCircle size={16} />
                  <span>{submitError}</span>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 7: SUBMISSION CONFIRMATION HUB ================= */}
          {currentStep === 7 && (
            <div className="confirmation-hub-container">
              {/* Top Header */}
              <div className="confirmation-header-block">
                <div className="confirmation-check-badge">
                  <CheckCircle2 size={38} />
                </div>

                <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--navy-primary)', marginBottom: '0.5rem' }}>
                  Case Dossier Successfully Initialized
                </h2>

                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto', lineHeight: 1.6 }}>
                  Your dispute dossier has been cryptographically cataloged in MongoDB Atlas. A lead intake specialist has been assigned to audit your evidence and prepare your formal bank dispute packet.
                </p>
              </div>

              {/* Official Case Reference Box with 1-Click Copy */}
              <div className="confirmation-case-ref-box">
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-blue-accent)', fontWeight: 700, letterSpacing: '0.06em' }}>
                  Official Case Dossier Reference
                </span>
                <div className="case-ref-number-row">
                  <span className="case-ref-large">#{submittedCaseId || 'RG-10482'}</span>
                  <button 
                    className="case-ref-copy-btn"
                    onClick={() => handleCopy(submittedCaseId || 'RG-10482', 'ref')}
                    title="Copy Reference Number"
                  >
                    {copiedReference ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                    <span>{copiedReference ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', fontSize: '0.78rem', color: 'var(--text-subtle)', flexWrap: 'wrap' }}>
                  <span>Status: <strong style={{ color: 'var(--navy-primary)' }}>Assigned to Intake Desk</strong></span>
                  <span>&bull;</span>
                  <span>Ledger: <strong style={{ color: '#059669' }}>Cryptographic Hash Verified</strong></span>
                </div>
              </div>

              {/* Primary Action Buttons Grid */}
              <div className="confirmation-actions-grid">
                <button 
                  className="btn btn-primary btn-track-action"
                  onClick={() => onTrackCase && onTrackCase(submittedCaseId || 'RG-10482')}
                >
                  <Compass size={18} />
                  <span>Track Live Case Progress</span>
                  <ArrowRight size={16} />
                </button>

                <button 
                  className="btn btn-outline btn-track-action"
                  onClick={downloadDossierSummaryPDF}
                >
                  <Download size={18} />
                  <span>Download Dossier Summary (PDF)</span>
                </button>

                <button 
                  className="btn btn-glass btn-track-action"
                  onClick={() => onCaseSubmitted && onCaseSubmitted(submittedCaseId || 'RG-10482')}
                >
                  <Layers size={18} />
                  <span>Access Member Dashboard</span>
                </button>
              </div>

              {/* 3-Step Claimant Guidance Checklist Card */}
              <div className="guidance-checklist-card">
                <div className="guidance-card-header">
                  <h3 className="guidance-title">
                    <ShieldAlert size={20} color="var(--blue-accent)" />
                    <span>Claimant Action Checklist &amp; What To Do Next</span>
                  </h3>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '3px 8px', borderRadius: '4px' }}>
                    Active Guidance Protocol
                  </span>
                </div>

                {/* Step 1: Notify Bank Fraud Desk */}
                <div className="guidance-step-item">
                  <div className="guidance-step-badge">1</div>
                  <div className="guidance-step-content">
                    <h4 className="guidance-step-heading">Notify Your Financial Institution's Fraud Desk</h4>
                    <p className="guidance-step-desc">
                      Contact your bank or credit card fraud department immediately and quote your case reference number. Use the verified call script below:
                    </p>

                    <div className="script-interactive-box">
                      <div className="script-text">
                        &ldquo;Hello, I am reporting an unauthorized/fraudulent transaction of ${parseFloat(caseData.amount || 0).toLocaleString()} to {caseData.recipientName || 'unverified merchant'} on {caseData.transactionDate}. I have registered an official dispute dossier (Reference: #{submittedCaseId || 'RG-10482'}) through US.ClaimBack and am requesting an immediate recall / chargeback arbitration review.&rdquo;
                      </div>
                      <button 
                        className="script-copy-btn"
                        onClick={() => handleCopy(`Hello, I am reporting an unauthorized/fraudulent transaction of $${parseFloat(caseData.amount || 0).toLocaleString()} to ${caseData.recipientName || 'unverified merchant'} on ${caseData.transactionDate}. I have registered an official dispute dossier (Reference: #${submittedCaseId || 'RG-10482'}) through US.ClaimBack and am requesting an immediate recall / chargeback arbitration review.`, 'script')}
                      >
                        {copiedScript ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                        <span>{copiedScript ? 'Script Copied to Clipboard!' : 'Copy Bank Call Script'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 2: Cease Direct Contact */}
                <div className="guidance-step-item">
                  <div className="guidance-step-badge">2</div>
                  <div className="guidance-step-content">
                    <h4 className="guidance-step-heading">Cease All Direct Contact With The Counterparty</h4>
                    <p className="guidance-step-desc">
                      Do not reply to follow-up emails, Telegram/WhatsApp chats, or requests from the merchant demanding "withdrawal tax fees", "anti-money laundering clearance bonds", or remote desktop access (e.g., AnyDesk or TeamViewer).
                    </p>
                  </div>
                </div>

                {/* Step 3: 48-Hour Roadmap */}
                <div className="guidance-step-item">
                  <div className="guidance-step-badge">3</div>
                  <div className="guidance-step-content">
                    <h4 className="guidance-step-heading">What to Expect in the First 48 Hours</h4>
                    <p className="guidance-step-desc">
                      Our intake specialist team processes your evidentiary records through strict institutional dispute standards:
                    </p>

                    <div className="timeline-pill-row">
                      <div className="timeline-pill">
                        <div className="timeline-pill-time">0 &ndash; 24 Hours</div>
                        <div className="timeline-pill-text">Evidence audit &amp; admissibility review by assigned specialist.</div>
                      </div>
                      <div className="timeline-pill">
                        <div className="timeline-pill-time">24 &ndash; 48 Hours</div>
                        <div className="timeline-pill-text">Formal SWIFT recall or card network dispute packet compiled.</div>
                      </div>
                      <div className="timeline-pill">
                        <div className="timeline-pill-time">Ongoing Radar</div>
                        <div className="timeline-pill-text">Instant milestone updates reflected in your Live Case Radar.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Navigation Controls */}
          {currentStep < 7 && (
            <div className="wizard-footer-nav">
              {currentStep > 1 ? (
                <button className="btn btn-outline" onClick={() => setCurrentStep(prev => prev - 1)}>
                  <ArrowLeft size={16} />
                  <span>Previous Step</span>
                </button>
              ) : (
                <button className="btn btn-outline" onClick={onCancel}>
                  Cancel
                </button>
              )}

              {currentStep < 6 && (
                <button className="btn btn-primary" onClick={() => setCurrentStep(prev => prev + 1)}>
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              )}

              {currentStep === 6 && (
                <button 
                  className="btn btn-primary" 
                  disabled={!caseData.acknowledgedLegal || isSubmitting}
                  onClick={handleFinalSubmit}
                >
                  {isSubmitting ? 'Submitting Case Dossier...' : 'Submit Case Dossier'}
                  {!isSubmitting && <ArrowRight size={16} />}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
