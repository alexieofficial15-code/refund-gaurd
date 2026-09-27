import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import './CheckoutModal.css';

export default function CheckoutModal({ 
  isOpen, 
  onClose, 
  isPage = false,
  walletBalance = 4850,
  activeCase = null,
  currentUser = null,
  token = null,
  onWithdrawSuccess = () => {}
}) {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  // Start with NO payment method selected so it starts by ONLY listing the methods
  const [paymentMethod, setPaymentMethod] = useState(''); 
  const [country, setCountry] = useState('Cameroon');
  const [isChangingCountry, setIsChangingCountry] = useState(false);

  // Form states for the payment methods
  // 1. Card
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  // 2. Bank Wire
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');

  // 3. PayPal
  const [paypalEmail, setPaypalEmail] = useState('');

  // 4. Crypto
  const [cryptoNetwork, setCryptoNetwork] = useState('USDT (TRC-20)');
  const [walletAddress, setWalletAddress] = useState('');

  // Submission & feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [completedTx, setCompletedTx] = useState(null);

  const balanceNumber = Number(walletBalance || 0);

  // Initialize withdraw amount to available balance
  useEffect(() => {
    if (balanceNumber > 0) {
      setWithdrawAmount(balanceNumber.toFixed(2));
    }
    if (currentUser?.fullName && !cardholderName) {
      setCardholderName(currentUser.fullName);
      setAccountHolder(currentUser.fullName);
    }
    if (currentUser?.email && !paypalEmail) {
      setPaypalEmail(currentUser.email);
    }
  }, [balanceNumber, activeCase?.caseNumber, isOpen, currentUser]);

  if (!isOpen && !isPage) return null;

  const currentAmount = parseFloat(withdrawAmount) > 0 ? parseFloat(withdrawAmount) : balanceNumber;
  const formattedAmount = currentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const userInitial = currentUser?.fullName?.[0]?.toUpperCase() || currentUser?.name?.[0]?.toUpperCase() || 'M';
  const caseNumber = activeCase?.caseNumber || 'RG-10482';

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 16);
    val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(val);
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)} / ${val.slice(2)}`;
    }
    setCardExpiry(val);
  };

  const handleCvvChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCvv(val);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setPaymentError(null);

    if (!paymentMethod) {
      setPaymentError('Please select your preferred payment method above.');
      setIsSubmitting(false);
      return;
    }

    if (currentAmount <= 0) {
      setPaymentError('Please enter a valid payout amount.');
      setIsSubmitting(false);
      return;
    }

    if (currentAmount > balanceNumber) {
      setPaymentError(`Amount exceeds your available balance ($${balanceNumber.toLocaleString('en-US', { minimumFractionDigits: 2 })}).`);
      setIsSubmitting(false);
      return;
    }

    // Validation per selected method
    let destinationStr = '';
    let detailsObj = {};

    if (paymentMethod === 'card') {
      const cleanNum = cardNumber.replace(/\s/g, '');
      if (cleanNum.length < 15) {
        setPaymentError('Please enter a valid 16-digit debit or credit card number.');
        setIsSubmitting(false);
        return;
      }
      if (cardExpiry.length < 5) {
        setPaymentError('Please enter a valid expiry date (MM / YY).');
        setIsSubmitting(false);
        return;
      }
      if (cardCvv.length < 3) {
        setPaymentError('Please enter your card CVV / security code.');
        setIsSubmitting(false);
        return;
      }
      destinationStr = `Card ending in ${cleanNum.slice(-4)} (${cardholderName || 'Claimant'})`;
      detailsObj = {
        cardNumberMasked: `•••• •••• •••• ${cleanNum.slice(-4)}`,
        cardExpiry,
        cardholderName: cardholderName || 'Claimant',
        destination: destinationStr
      };
    } else if (paymentMethod === 'bank_wire') {
      if (!bankName.trim() || !accountNumber.trim()) {
        setPaymentError('Please enter your receiving bank name and account/IBAN number.');
        setIsSubmitting(false);
        return;
      }
      destinationStr = `${bankName} (Acct ending in ${accountNumber.slice(-4)})`;
      detailsObj = {
        bankName,
        accountHolder: accountHolder || currentUser?.fullName || 'Claimant',
        accountNumber,
        routingNumber,
        destination: destinationStr
      };
    } else if (paymentMethod === 'paypal') {
      if (!paypalEmail.trim() || !paypalEmail.includes('@')) {
        setPaymentError('Please enter a valid PayPal account email address.');
        setIsSubmitting(false);
        return;
      }
      destinationStr = `PayPal: ${paypalEmail}`;
      detailsObj = {
        paypalEmail,
        destination: destinationStr
      };
    } else if (paymentMethod === 'crypto') {
      if (!walletAddress.trim()) {
        setPaymentError('Please enter your destination cryptocurrency wallet address.');
        setIsSubmitting(false);
        return;
      }
      destinationStr = `${cryptoNetwork}: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
      detailsObj = {
        cryptoNetwork,
        walletAddress,
        destination: destinationStr
      };
    }

    try {
      const activeToken = token || localStorage.getItem('refundguard_token');
      if (activeToken) {
        const res = await fetch('/api/cases/wallet/withdraw', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}`
          },
          body: JSON.stringify({
            amount: currentAmount,
            method: paymentMethod,
            details: detailsObj,
            caseNumber: caseNumber
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          onWithdrawSuccess(data.walletBalance, data.transaction);
          setCompletedTx(data.transaction || {
            amount: currentAmount,
            description: destinationStr,
            createdAt: new Date()
          });
          setPaymentSuccess(true);
        } else {
          setPaymentError(data.message || 'Error processing payout dispatch.');
        }
      } else {
        // Standalone or preview mode
        setCompletedTx({
          amount: currentAmount,
          description: destinationStr,
          createdAt: new Date()
        });
        setPaymentSuccess(true);
      }
    } catch (err) {
      setPaymentError(err.message || 'Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const countries = ['Cameroon', 'United States', 'United Kingdom', 'Canada', 'France', 'Germany', 'Nigeria', 'South Africa', 'Australia', 'Switzerland'];

  const modalBody = (
    <div className={`sp-checkout-container ${isPage ? 'is-page' : 'is-modal'}`}>
      {/* 1. Header with Site Logo & User Initial Avatar */}
      <div className="sp-checkout-header">
        <div className="sp-logo-wrap">
          <div className="rg-site-logo">
            <img src="/logo.png" alt="US.ClaimBack Emblem" className="rg-modal-logo-img" />
            <span className="rg-logo-text">US.<span>ClaimBack</span></span>
          </div>
        </div>
        <div className="sp-header-right">
          <div className="sp-avatar-pill" title={currentUser?.fullName || 'Claimant'}>
            {userInitial}
          </div>
          {!isPage && onClose && (
            <button className="sp-close-btn" onClick={onClose} aria-label="Close Checkout">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {paymentSuccess ? (
        <div className="sp-success-view">
          <div className="sp-success-icon">
            <CheckCircle2 size={54} color="#10b981" />
          </div>
          <h2 className="sp-success-title">Withdrawal Dispatched</h2>
          <p className="sp-success-subtext">
            Your restitution payout of <strong>${formattedAmount} USD</strong> has been authorized and queued for instant clearing.
          </p>
          <div className="sp-receipt-box">
            <div className="sp-receipt-row">
              <span>Payout Method:</span>
              <strong>{completedTx?.description || paymentMethod.replace('_', ' ').toUpperCase()}</strong>
            </div>
            <div className="sp-receipt-row">
              <span>Dispute Vault:</span>
              <strong className="sp-mono">#{caseNumber}</strong>
            </div>
            <div className="sp-receipt-row">
              <span>Status:</span>
              <span className="sp-badge-green">Authorized &bull; 0% Fee</span>
            </div>
            <div className="sp-receipt-row">
              <span>Execution Speed:</span>
              <strong>Instant Interbank Clearing (11ms)</strong>
            </div>
          </div>
          <button 
            type="button"
            className="sp-btn-submit" 
            onClick={() => {
              setPaymentSuccess(false);
              if (onClose) onClose();
            }}
          >
            Done
          </button>
        </div>
      ) : (
        <>
          {/* 2. Info / Eligibility Alert Notice */}
          <div className="sp-alert-callout">
            <div className="sp-alert-icon">
              <Info size={18} />
            </div>
            <div className="sp-alert-text">
              Dispute recovery funds are available for disbursement. Select your preferred payout method below to receive your restitution.
            </div>
          </div>

          {/* 3. Section Title & Change Amount */}
          <div className="sp-checkout-title-row">
            <h1 className="sp-section-title">Checkout</h1>
            <button 
              type="button" 
              className="sp-change-plan-btn"
              onClick={() => setIsEditingAmount(!isEditingAmount)}
            >
              {isEditingAmount ? 'Done editing' : `Change amount`}
            </button>
          </div>

          {/* Optional Amount Modifier Box */}
          {isEditingAmount && (
            <div className="sp-amount-modifier-box">
              <label>Withdrawal Amount (USD):</label>
              <div className="sp-amount-input-wrap">
                <span className="sp-amount-symbol">$</span>
                <input 
                  type="number" 
                  step="0.01" 
                  max={balanceNumber} 
                  min="1"
                  value={withdrawAmount} 
                  onChange={(e) => setWithdrawAmount(e.target.value)} 
                  placeholder={balanceNumber.toFixed(2)}
                />
                <button 
                  type="button" 
                  className="sp-max-btn"
                  onClick={() => setWithdrawAmount(balanceNumber.toFixed(2))}
                >
                  MAX
                </button>
              </div>
            </div>
          )}

          {/* 4. Selected Plan / Item Card */}
          <div className="sp-plan-card">
            <div className="sp-plan-card-main">
              <div className="sp-plan-badge" style={{ background: '#10b981' }}>
                <ShieldCheck size={24} color="#ffffff" />
              </div>
              <div className="sp-plan-details">
                <h3 className="sp-plan-name">Dispute Restitution Settlement Payout</h3>
                <span className="sp-plan-sub">1 Verified Beneficiary Account &bull; Case #{caseNumber}</span>
              </div>
              <div className="sp-plan-price-wrap">
                <span className="sp-price-amount">${formattedAmount}</span>
                <span className="sp-price-period">/ payout</span>
              </div>
            </div>

            <ul className="sp-plan-bullets">
              <li>&bull; Direct transfer to your designated beneficiary account starting today.</li>
              <li>&bull; 100% Zero withdrawal fees covered under US.ClaimBack Settlement Guarantee. <span style={{ textDecoration: 'underline' }}>Terms apply</span></li>
            </ul>
          </div>

          {/* 5. Payment Method Section */}
          <div className="sp-payment-section">
            <h2 className="sp-section-title">Payment method</h2>

            <form onSubmit={handleFormSubmit} className="sp-payment-methods-box">
              {/* Option 1: Credit or debit card */}
              <div className={`sp-method-item ${paymentMethod === 'card' ? 'selected' : ''}`}>
                <label className="sp-method-header" onClick={() => setPaymentMethod('card')}>
                  <div className="sp-radio-col">
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="card" 
                      checked={paymentMethod === 'card'} 
                      onChange={() => setPaymentMethod('card')} 
                    />
                    <span className="sp-custom-radio"></span>
                  </div>

                  <div className="sp-method-content">
                    <span className="sp-method-label">Credit or debit card</span>
                    <div className="sp-card-brand-logos">
                      <span className="sp-card-logo visa-logo" title="Visa">
                        <svg viewBox="0 0 36 24" width="32" height="20">
                          <rect width="36" height="24" rx="3" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                          <text x="18" y="15" fill="#1434CB" fontSize="10" fontWeight="900" textAnchor="middle" fontStyle="italic" fontFamily="sans-serif">VISA</text>
                        </svg>
                      </span>
                      <span className="sp-card-logo mastercard-logo" title="Mastercard">
                        <svg viewBox="0 0 36 24" width="32" height="20">
                          <rect width="36" height="24" rx="3" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                          <circle cx="14" cy="12" r="6" fill="#EB001B" />
                          <circle cx="22" cy="12" r="6" fill="#F79E1B" fillOpacity="0.85" />
                        </svg>
                      </span>
                      <span className="sp-card-logo amex-logo" title="American Express">
                        <svg viewBox="0 0 36 24" width="32" height="20">
                          <rect width="36" height="24" rx="3" fill="#006FCF" />
                          <text x="18" y="15" fill="#ffffff" fontSize="8" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">AMEX</text>
                        </svg>
                      </span>
                    </div>
                  </div>
                </label>

                {paymentMethod === 'card' && (
                  <div className="sp-card-inputs-panel">
                    <div className="sp-input-field">
                      <label>Card number</label>
                      <div className="sp-input-icon-wrap">
                        <input 
                          type="text" 
                          placeholder="0000 0000 0000 0000" 
                          value={cardNumber} 
                          onChange={handleCardNumberChange} 
                          required 
                        />
                        <Lock size={14} className="sp-input-lock" />
                      </div>
                    </div>

                    <div className="sp-input-grid">
                      <div className="sp-input-field">
                        <label>Expiry date</label>
                        <input 
                          type="text" 
                          placeholder="MM / YY" 
                          value={cardExpiry} 
                          onChange={handleExpiryChange} 
                          required 
                        />
                      </div>
                      <div className="sp-input-field">
                        <label>Security code (CVV)</label>
                        <input 
                          type="password" 
                          placeholder="123" 
                          value={cardCvv} 
                          onChange={handleCvvChange} 
                          required 
                        />
                      </div>
                    </div>

                    <div className="sp-input-field">
                      <label>Cardholder name</label>
                      <input 
                        type="text" 
                        placeholder="Full name on card" 
                        value={cardholderName} 
                        onChange={(e) => setCardholderName(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Option 2: Bank wire or direct deposit */}
              <div className={`sp-method-item ${paymentMethod === 'bank_wire' ? 'selected' : ''}`}>
                <label className="sp-method-header" onClick={() => setPaymentMethod('bank_wire')}>
                  <div className="sp-radio-col">
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="bank_wire" 
                      checked={paymentMethod === 'bank_wire'} 
                      onChange={() => setPaymentMethod('bank_wire')} 
                    />
                    <span className="sp-custom-radio"></span>
                  </div>

                  <div className="sp-method-content">
                    <span className="sp-method-label">Bank wire or direct deposit</span>
                    <div className="sp-bank-badges">
                      <span className="sp-bank-tag">SWIFT &bull; FedWire &bull; SEPA Direct</span>
                    </div>
                  </div>
                </label>

                {paymentMethod === 'bank_wire' && (
                  <div className="sp-card-inputs-panel">
                    <div className="sp-input-field">
                      <label>Receiving Bank Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Chase, Bank of America, Barclays, UBS..." 
                        value={bankName} 
                        onChange={(e) => setBankName(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="sp-input-field">
                      <label>Account Holder Legal Name</label>
                      <input 
                        type="text" 
                        placeholder="Full name as registered on bank account" 
                        value={accountHolder} 
                        onChange={(e) => setAccountHolder(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="sp-input-grid">
                      <div className="sp-input-field">
                        <label>Account / IBAN Number</label>
                        <input 
                          type="text" 
                          placeholder="Account or IBAN Number" 
                          value={accountNumber} 
                          onChange={(e) => setAccountNumber(e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="sp-input-field">
                        <label>Routing / SWIFT BIC</label>
                        <input 
                          type="text" 
                          placeholder="Routing or SWIFT code" 
                          value={routingNumber} 
                          onChange={(e) => setRoutingNumber(e.target.value)} 
                          required 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Option 3: PayPal */}
              <div className={`sp-method-item ${paymentMethod === 'paypal' ? 'selected' : ''}`}>
                <label className="sp-method-header" onClick={() => setPaymentMethod('paypal')}>
                  <div className="sp-radio-col">
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="paypal" 
                      checked={paymentMethod === 'paypal'} 
                      onChange={() => setPaymentMethod('paypal')} 
                    />
                    <span className="sp-custom-radio"></span>
                  </div>

                  <div className="sp-method-content">
                    <span className="sp-method-label">PayPal</span>
                    <div className="sp-paypal-logo">
                      <svg width="68" height="18" viewBox="0 0 100 28" fill="none">
                        <path d="M12 4.5H23C27 4.5 29.5 7.5 28.5 12C27.5 16.5 24 19 20 19H15L13 27H7L12 4.5Z" fill="#003087"/>
                        <path d="M16 9.5H27C31 9.5 33.5 12.5 32.5 17C31.5 21.5 28 24 24 24H19L17.5 29H12L16 9.5Z" fill="#0079C1"/>
                        <text x="36" y="21" fill="#003087" fontSize="16" fontWeight="800" fontStyle="italic" fontFamily="sans-serif">PayPal</text>
                      </svg>
                    </div>
                  </div>
                </label>

                {paymentMethod === 'paypal' && (
                  <div className="sp-card-inputs-panel">
                    <div className="sp-input-field">
                      <label>PayPal Account Email</label>
                      <input 
                        type="email" 
                        placeholder={currentUser?.email || 'name@example.com'} 
                        value={paypalEmail} 
                        onChange={(e) => setPaypalEmail(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Option 4: Cryptocurrency (USDT / Bitcoin) */}
              <div className={`sp-method-item ${paymentMethod === 'crypto' ? 'selected' : ''}`}>
                <label className="sp-method-header" onClick={() => setPaymentMethod('crypto')}>
                  <div className="sp-radio-col">
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="crypto" 
                      checked={paymentMethod === 'crypto'} 
                      onChange={() => setPaymentMethod('crypto')} 
                    />
                    <span className="sp-custom-radio"></span>
                  </div>

                  <div className="sp-method-content">
                    <span className="sp-method-label">Cryptocurrency</span>
                    <div className="sp-crypto-badges">
                      <span className="sp-crypto-tag usdt">USDT</span>
                      <span className="sp-crypto-tag btc">BTC</span>
                      <span className="sp-crypto-tag fast">Instant Settlement</span>
                    </div>
                  </div>
                </label>

                {paymentMethod === 'crypto' && (
                  <div className="sp-card-inputs-panel">
                    <div className="sp-input-field">
                      <label>Select Network</label>
                      <select 
                        value={cryptoNetwork} 
                        onChange={(e) => setCryptoNetwork(e.target.value)}
                        className="sp-select-input"
                      >
                        <option value="USDT (TRC-20)">Tether USDT (TRC-20 - Tron Network)</option>
                        <option value="USDT (ERC-20)">Tether USDT (ERC-20 - Ethereum Network)</option>
                        <option value="Bitcoin (BTC)">Bitcoin (BTC - Native SegWit)</option>
                      </select>
                    </div>
                    <div className="sp-input-field">
                      <label>Destination Wallet Address</label>
                      <input 
                        type="text" 
                        placeholder="Paste your recipient wallet address" 
                        value={walletAddress} 
                        onChange={(e) => setWalletAddress(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>
                )}
              </div>

              {paymentError && (
                <div className="sp-form-error" style={{ margin: '0.85rem 1rem 0' }}>
                  <AlertCircle size={15} />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* 6. Summary Section */}
              <div className="sp-summary-section">
                <h2 className="sp-summary-title">Summary</h2>
                <div className="sp-summary-body">
                  <div className="sp-summary-line">
                    <span>Dispute Settlement Payout</span>
                    <span>${formattedAmount}</span>
                  </div>
                  <div className="sp-summary-line muted">
                    <span>Transfer Processing Fee</span>
                    <span>$0.00 (Zero Fee)</span>
                  </div>
                  <div className="sp-summary-divider" />
                  <div className="sp-summary-line total">
                    <span>Total Disbursed</span>
                    <span>${formattedAmount} USD</span>
                  </div>
                </div>
              </div>

              {/* Submit Action Button */}
              <div className="sp-submit-container">
                <button 
                  type="submit" 
                  className="sp-btn-submit"
                  disabled={isSubmitting || balanceNumber <= 0 || !paymentMethod}
                >
                  {isSubmitting 
                    ? 'Authorizing Payout...' 
                    : !paymentMethod 
                      ? 'Select payment method to proceed' 
                      : `Confirm Payout & Withdraw $${formattedAmount}`}
                </button>
              </div>
            </form>
          </div>

          {/* 7. Footer: Country selection & Cookies */}
          <div className="sp-checkout-footer">
            <div className="sp-country-row">
              <span className="sp-country-name">{country}</span>
              <button 
                type="button" 
                className="sp-change-country-link"
                onClick={() => setIsChangingCountry(!isChangingCountry)}
              >
                Change country
              </button>
            </div>

            {isChangingCountry && (
              <div className="sp-country-dropdown">
                {countries.map((c) => (
                  <div 
                    key={c} 
                    className={`sp-country-item ${country === c ? 'active' : ''}`}
                    onClick={() => {
                      setCountry(c);
                      setIsChangingCountry(false);
                    }}
                  >
                    {c}
                  </div>
                ))}
              </div>
            )}

            <div className="sp-cookie-row">
              <button type="button" className="sp-cookie-link">Cookies Settings</button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (isPage) {
    return <div className="sp-page-wrapper">{modalBody}</div>;
  }

  return (
    <div className="sp-modal-backdrop" onClick={onClose}>
      <div className="sp-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {modalBody}
      </div>
    </div>
  );
}
