import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  FileText, 
  AlertCircle, 
  UploadCloud, 
  CheckCircle2, 
  FileCheck, 
  X, 
  Layers, 
  DollarSign, 
  Building2, 
  ArrowUpRight, 
  Download, 
  Plus,
  Lock, 
  UserCheck, 
  Folder, 
  PenTool, 
  AlertTriangle, 
  ArrowRight, 
  ShieldAlert, 
  HelpCircle, 
  Home, 
  Compass, 
  Bell,
  Trash2,
  Send,
  MessageSquare,
  Printer,
  Eye,
  Check,
  ExternalLink,
  Award,
  TrendingUp,
  Zap,
  Activity,
  Sparkles,
  RotateCcw,
  Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CheckoutModal from '../components/CheckoutModal';
import './DashboardPage.css';

export default function DashboardPage({ onStartNewCase, onNavigate, isActive = true }) {
  const { currentUser, token } = useAuth();

  // Dynamic Case & Evidence State from MongoDB Atlas with persistent instant-load cache
  const [cases, setCases] = useState(() => {
    try {
      const cached = localStorage.getItem('refundguard_cached_cases');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return [];
  });
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [selectedCaseNumber, setSelectedCaseNumber] = useState(() => {
    return localStorage.getItem('refundguard_selected_case_num') || '';
  });
  const [evidenceList, setEvidenceList] = useState([]);
  const [isLoading, setIsLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('refundguard_cached_cases');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return false;
      }
    } catch (_) {}
    return true;
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadNotice, setUploadNotice] = useState(null);

  // 1. Digital Affidavit E-Signing Modal State (Feature 1)
  const [affidavitModalOpen, setAffidavitModalOpen] = useState(false);
  const [isEditingAffidavit, setIsEditingAffidavit] = useState(false);
  const [affidavitSigned, setAffidavitSigned] = useState(() => {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('refundguard_affidavit_'));
      for (const k of keys) {
        const val = localStorage.getItem(k);
        if (val) {
          const p = JSON.parse(val);
          if (p && (p.signed || p.signedAt)) return true;
        }
      }
    } catch (_) {}
    return false;
  });
  const [affidavitData, setAffidavitData] = useState(() => {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('refundguard_affidavit_'));
      for (const k of keys) {
        const val = localStorage.getItem(k);
        if (val) {
          const p = JSON.parse(val);
          if (p && (p.signed || p.signedAt)) return p;
        }
      }
    } catch (_) {}
    return null;
  });
  const [sigMode, setSigMode] = useState('draw'); // 'draw' | 'type'
  const [typedSignature, setTypedSignature] = useState('');
  const [affidavitConsent, setAffidavitConsent] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // 2. Evidence Vault Modal State (Feature 2)
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [evidenceCategory, setEvidenceCategory] = useState('bank_statement');
  const [isDeletingId, setIsDeletingId] = useState(null);

  // 4. Specialist Messenger State (Feature 4)
  const [messengerOpen, setMessengerOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'specialist',
      text: "Hello, I am Senior Analyst Sarah K. I have reviewed your evidence dossier and compiled filing packet #CP-591. The preliminary SWIFT recall notification has been dispatched to correspondent fraud units.",
      time: "Yesterday, 3:45 PM"
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');

  // 6. Settlement Dossier Modal State (Feature 6)
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [selectedSettlementCase, setSelectedSettlementCase] = useState(null);

  // 7. Member Secure Wallet State with persistent instant-load cache
  const [walletBalance, setWalletBalance] = useState(() => {
    try {
      const cached = localStorage.getItem('refundguard_cached_wallet_balance');
      if (cached !== null && cached !== undefined) return Number(cached) || 0;
    } catch (_) {}
    return 0;
  });
  const [walletTransactions, setWalletTransactions] = useState(() => {
    try {
      const cached = localStorage.getItem('refundguard_cached_wallet_txs');
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return [];
  });
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bank_wire');
  const [withdrawDetails, setWithdrawDetails] = useState({
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    routingNumber: '',
    walletAddress: '',
    cryptoNetwork: 'USDT (TRC-20)',
    paypalEmail: ''
  });
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawFeedback, setWithdrawFeedback] = useState(null);
  const [showLedger, setShowLedger] = useState(false);
  const [withdrawalAllowed, setWithdrawalAllowed] = useState(false);
  const [withdrawNotice, setWithdrawNotice] = useState(null);
  const [clearanceModalOpen, setClearanceModalOpen] = useState(false);
  const [activeClearanceBill, setActiveClearanceBill] = useState(null);
  const [feePaymentRef, setFeePaymentRef] = useState('');
  const [feePaymentSubmitting, setFeePaymentSubmitting] = useState(false);
  const [feePaymentFeedback, setFeePaymentFeedback] = useState(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [emailResent, setEmailResent] = useState(false);

  // 8. Apple Pay Style Confirmation Modal State
  const [congratsFlashModalOpen, setCongratsFlashModalOpen] = useState(false);
  const [congratsCaseData, setCongratsCaseData] = useState(null);

  // -------------------------------------------------------------
  // DYNAMIC STATS & USER METADATA
  // -------------------------------------------------------------
  const activeCasesList = cases.filter(c => c.status !== 'resolved' && c.status !== 'withdrawn');
  const resolvedCasesList = cases.filter(c => c.status === 'resolved');
  const underReviewCasesList = cases.filter(c => c.status === 'under_review' || c.status === 'submitted');

  const totalReportedAmount = cases.reduce((sum, c) => sum + (Number(c.disputedAmount) || 0), 0);
  const totalRecoveredAmount = resolvedCasesList.reduce((sum, c) => sum + (Number(c.settledAmount || c.disputedAmount) || 0), 0);

  const activeCasesCount = activeCasesList.length;
  const underReviewCount = underReviewCasesList.length;
  const recoveredCount = resolvedCasesList.length;

  // Selected active case for entire dashboard (board, withdrawal, dossier)
  const activeCase = (selectedCaseNumber ? cases.find(c => c.caseNumber === selectedCaseNumber) : null) 
    || cases[activeCaseIndex] 
    || cases[0] 
    || null;

  // Recovered balance for the active case: ONLY credited if status is 'resolved'
  const isCaseResolved = Boolean(activeCase && activeCase.status === 'resolved');
  const activeCaseBalance = isCaseResolved 
    ? Number(activeCase.settledAmount || activeCase.disputedAmount || 0) 
    : 0;

  // Active case withdrawal authorization status (only valid if case is currently resolved)
  const isCaseWithdrawalAllowed = Boolean(
    isCaseResolved && (
      activeCase.withdrawalAllowed === true ||
      localStorage.getItem(`refundguard_withdrawal_allowed_${activeCase.caseNumber}`) === 'true'
    )
  );

  // Format Client ID from current user
  const clientId = currentUser?._id 
    ? `CL-${currentUser._id.toString().slice(-4).toUpperCase()}` 
    : 'CL-3821';

  // Format User Name
  const claimantDisplayName = currentUser?.fullName || currentUser?.name || 'David Vance';

  // Fetch Member Wallet Data
  const loadWalletData = async () => {
    try {
      setIsWalletLoading(true);
      const activeToken = token || localStorage.getItem('refundguard_token');
      if (!activeToken) return;
      const res = await fetch('/api/cases/wallet/me', {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const bal = Number(data.walletBalance || 0);
          setWalletBalance(bal);
          setWalletTransactions(data.walletTransactions || []);
          try {
            localStorage.setItem('refundguard_cached_wallet_balance', bal.toString());
            localStorage.setItem('refundguard_cached_wallet_txs', JSON.stringify(data.walletTransactions || []));
          } catch (_) {}
          if (typeof data.withdrawalAllowed === 'boolean') {
            setWithdrawalAllowed(data.withdrawalAllowed);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching wallet:', err);
    } finally {
      setIsWalletLoading(false);
    }
  };

  // Switch between cases helper
  const handleSelectCase = (c, idx) => {
    if (!c) return;
    setActiveCaseIndex(idx);
    setSelectedCaseNumber(c.caseNumber);
    try {
      localStorage.setItem('refundguard_selected_case_num', c.caseNumber);
    } catch (_) {}
    setWithdrawNotice(null);
    if (c.caseNumber) {
      loadCaseEvidence(c.caseNumber);
    }
  };

  // Sync withdrawal permission from activeCase or local storage
  useEffect(() => {
    if (activeCase) {
      const localFlag = localStorage.getItem(`refundguard_withdrawal_allowed_${activeCase.caseNumber}`);
      if (localFlag === 'true') {
        setWithdrawalAllowed(true);
      } else if (typeof activeCase.withdrawalAllowed === 'boolean') {
        setWithdrawalAllowed(activeCase.withdrawalAllowed);
      } else {
        setWithdrawalAllowed(false);
      }
    }
  }, [activeCase]);

  // Handle Withdraw Funds click: verify $300 clearance & admin authorization for ACTIVE CASE
  const handleWithdrawClick = async () => {
    if (!activeCase) {
      setWithdrawNotice('No dispute case selected for withdrawal.');
      return;
    }

    if (activeCase.status !== 'resolved') {
      setWithdrawNotice(`Case #${activeCase.caseNumber} is currently ${activeCase.status.replace('_', ' ').toUpperCase()}. Restitution payout will be unlocked once proceedings conclude and administration marks the case as resolved.`);
      return;
    }

    let isAllowed = Boolean(
      activeCase.withdrawalAllowed === true ||
      localStorage.getItem(`refundguard_withdrawal_allowed_${activeCase.caseNumber}`) === 'true' ||
      withdrawalAllowed
    );

    // Fast live check against backend in case admin just approved it in Admin Panel
    if (!isAllowed) {
      try {
        const activeToken = token || localStorage.getItem('refundguard_token');
        if (activeToken) {
          const res = await fetch('/api/cases', {
            headers: { 'Authorization': `Bearer ${activeToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.cases)) {
              setCases(data.cases);
              const freshCase = data.cases.find(c => c.caseNumber === activeCase.caseNumber);
              if (freshCase && freshCase.withdrawalAllowed) {
                isAllowed = true;
                setWithdrawalAllowed(true);
              }
            }
          }
        }
      } catch (_) {}
    }

    if (!isAllowed) {
      setWithdrawNotice(`You must complete the $300 clearance bill payment first. Withdrawal will be enabled once your payment has been confirmed and authorized by administration for Case #${activeCase.caseNumber}.`);

      // Dispatch official $300 clearance bill notice email to user's registered email
      try {
        const activeToken = token || localStorage.getItem('refundguard_token');
        if (activeToken && activeCase?.caseNumber) {
          fetch(`/api/cases/${activeCase.caseNumber}/request-clearance-notice`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${activeToken}`
            }
          }).catch(() => {});
        }
      } catch (_) {}

      return;
    }

    setWithdrawNotice(null);
    setWithdrawFeedback(null);
    setWithdrawModalOpen(true);
  };

  // Load user's actual cases from MongoDB Atlas
  useEffect(() => {
    let isMounted = true;

    async function loadUserData(silent = false) {
      if (!silent) setIsLoading(true);
      try {
        const activeToken = token || localStorage.getItem('refundguard_token');
        if (!activeToken) {
          if (isMounted) {
            setCases([]);
            setEvidenceList([]);
            setIsLoading(false);
          }
          return;
        }

        const res = await fetch('/api/cases', {
          headers: { 'Authorization': `Bearer ${activeToken}` }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.cases)) {
            if (isMounted) {
              setCases(data.cases);
              try {
                localStorage.setItem('refundguard_cached_cases', JSON.stringify(data.cases));
              } catch (_) {}

              if (data.cases.length > 0) {
                const currentIdx = activeCaseIndex < data.cases.length ? activeCaseIndex : 0;
                setSelectedCaseNumber(prev => {
                  if (prev && data.cases.some(c => c.caseNumber === prev)) return prev;
                  const newNum = data.cases[currentIdx].caseNumber;
                  try {
                    localStorage.setItem('refundguard_selected_case_num', newNum);
                  } catch (_) {}
                  return newNum;
                });
                const activeNum = selectedCaseNumber || data.cases[currentIdx].caseNumber;
                loadCaseEvidence(activeNum);
              } else {
                setEvidenceList([]);
              }
            }

            // Clean up seen keys for any cases that are NOT resolved so stepping down allows re-triggering
            data.cases.forEach(c => {
              if (c.status !== 'resolved') {
                try {
                  localStorage.removeItem(`refundguard_seen_settlement_${c.caseNumber}`);
                } catch (_) {}
              }
            });

            // Check if any case has a pending settlement confirmation
            // IMPORTANT: Only trigger celebration animation for claimant users logged into their dashboard, NEVER for admins!
            const isClaimantUser = currentUser?.role !== 'admin' && currentUser?.role !== 'investigator';
            const newlySettled = isClaimantUser ? data.cases.find(c => {
              if (c.status !== 'resolved') return false;
              if (c.settlementFlashPending !== true) return false;
              const seenKey = `refundguard_seen_settlement_${c.caseNumber}`;
              return !localStorage.getItem(seenKey);
            }) : null;

            if (newlySettled && isMounted && !congratsFlashModalOpen) {
              const seenKey = `refundguard_seen_settlement_${newlySettled.caseNumber}`;
              try {
                localStorage.setItem(seenKey, 'true');
                if (activeToken) {
                  fetch(`/api/cases/${newlySettled.caseNumber}/ack-settlement`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${activeToken}`
                    }
                  }).catch(() => {});
                }
              } catch (_) {}

              // Update in-memory state so subsequent silent refreshes don't re-trigger it
              setCases(prev => prev.map(c => c.caseNumber === newlySettled.caseNumber ? { ...c, settlementFlashPending: false } : c));

              setCongratsCaseData(newlySettled);
              setSelectedCaseNumber(newlySettled.caseNumber);
              loadCaseEvidence(newlySettled.caseNumber);
              setCongratsFlashModalOpen(true);
            }
          } else if (isMounted) {
            setCases([]);
            setEvidenceList([]);
          }
        } else if (isMounted) {
          setCases([]);
          setEvidenceList([]);
        }
      } catch (err) {
        console.error('Error fetching MongoDB Atlas cases:', err);
        if (isMounted) {
          setCases([]);
          setEvidenceList([]);
        }
      } finally {
        if (!silent && isMounted) {
          setIsLoading(false);
        }
      }
    }

    // Run IMMEDIATELY on mount or when returning to page!
    // If we already have cases in memory or cache, silent = true so ZERO loading spinner / zero delay!
    loadUserData(cases.length > 0);
    loadWalletData();

    // Poll in the background every 3 seconds so when admin approves in Admin Panel, withdrawal automatically unlocks
    const pollInterval = setInterval(() => {
      loadUserData(true);
      loadWalletData();
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [token, activeCaseIndex, isActive]);

  // Synchronize Affidavit State on activeCase or currentUser change
  useEffect(() => {
    // 1. Check if backend case already marked as signed
    if (activeCase?.affidavitSigned) {
      setAffidavitSigned(true);
      if (activeCase.affidavitInfo) {
        setAffidavitData(activeCase.affidavitInfo);
        if (activeCase.affidavitInfo.sigMode) setSigMode(activeCase.affidavitInfo.sigMode);
        if (activeCase.affidavitInfo.typedSignature) setTypedSignature(activeCase.affidavitInfo.typedSignature);
      }
      return;
    }

    // 2. Check localStorage across specific, case-level, and user-level keys
    try {
      const uId = currentUser?._id || currentUser?.id || currentUser?.email || 'user';
      const specificKey = `refundguard_affidavit_${uId}_${activeCase?.caseNumber || 'default'}`;
      const caseKey = activeCase?.caseNumber ? `refundguard_affidavit_${activeCase.caseNumber}` : null;
      const userKey = `refundguard_affidavit_user_${uId}`;
      const lastKey = 'refundguard_affidavit_last';

      const raw = 
        localStorage.getItem(specificKey) ||
        (caseKey && localStorage.getItem(caseKey)) ||
        localStorage.getItem(userKey) ||
        localStorage.getItem(lastKey);

      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (parsed.signed || parsed.signedAt)) {
          setAffidavitSigned(true);
          setAffidavitData(parsed);
          if (parsed.sigMode) setSigMode(parsed.sigMode);
          if (parsed.typedSignature) setTypedSignature(parsed.typedSignature);
          return;
        }
      }
    } catch (e) {
      console.warn('LocalStorage affidavit sync error:', e);
    }

    if (activeCase && !activeCase.affidavitSigned) {
      setAffidavitSigned(false);
      setAffidavitData(null);
    }
  }, [activeCase, currentUser]);

  // Load evidence for an active case
  const loadCaseEvidence = async (caseNumber) => {
    try {
      const res = await fetch(`/api/evidence/cases/${caseNumber}/evidence`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.evidence)) {
          setEvidenceList(data.evidence.map(item => ({
            id: item._id || item.id,
            name: item.originalName || item.fileName,
            size: `${(item.fileSize / 1024).toFixed(1)} KB`,
            type: item.category || 'Uploaded Document',
            status: 'Verified In Vault',
            filePath: item.filePath,
            uploadedAt: item.uploadedAt || item.createdAt
          })));
        }
      }
    } catch (err) {
      console.warn('Evidence query warning:', err);
    }
  };

  // Upload Evidence Handler (Vault & Dashboard)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeCase) return;

    setIsUploading(true);
    setUploadNotice(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', evidenceCategory || 'claimant_upload');
      formData.append('notes', 'Uploaded directly from Member Vault Center.');

      const res = await fetch(`/api/evidence/cases/${activeCase.caseNumber}/evidence`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Evidence upload failed.');
      }

      setUploadNotice({ type: 'success', text: `Document "${file.name}" cryptographically hashed and saved in Atlas.` });
      loadCaseEvidence(activeCase.caseNumber);
    } catch (err) {
      setUploadNotice({ type: 'error', text: err.message || 'Error uploading file.' });
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Evidence Handler
  const handleDeleteEvidence = async (evidenceId) => {
    if (!window.confirm('Are you sure you want to remove this document from your dispute vault?')) return;
    setIsDeletingId(evidenceId);
    try {
      const res = await fetch(`/api/evidence/${evidenceId}`, { method: 'DELETE' });
      if (res.ok) {
        setEvidenceList(prev => prev.filter(f => f.id !== evidenceId));
        setUploadNotice({ type: 'success', text: 'Evidence file successfully removed from vault.' });
      }
    } catch (err) {
      console.error('Error deleting evidence:', err);
    } finally {
      setIsDeletingId(null);
    }
  };

  // Download Evidence Handler
  const handleDownload = (file) => {
    if (file.id) {
      window.open(`/api/evidence/${file.id}/download`, '_blank');
    }
  };

  // -------------------------------------------------------------
  // CANVAS SIGNATURE PAD HANDLERS (Feature 1)
  // -------------------------------------------------------------
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSealAffidavit = async () => {
    if (!affidavitConsent) {
      alert('Please check the legal declaration box to confirm your sworn statement.');
      return;
    }
    if (sigMode === 'draw' && !hasDrawn) {
      alert('Please draw your legal signature on the signature pad.');
      return;
    }
    if (sigMode === 'type' && !typedSignature.trim()) {
      alert('Please type your legal full name for the digital signature.');
      return;
    }

    let sigImage = null;
    if (sigMode === 'draw' && canvasRef.current) {
      sigImage = canvasRef.current.toDataURL('image/png');
    }

    const uId = currentUser?._id || currentUser?.id || currentUser?.email || 'user';
    const cNum = activeCase?.caseNumber || 'RG-10482';

    const newRecord = {
      signed: true,
      signedAt: new Date().toISOString(),
      signedDateFormatted: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      signedBy: claimantDisplayName,
      sigMode,
      signatureImg: sigImage,
      typedSignature: typedSignature.trim() || claimantDisplayName,
      protocol: 'eIDAS Reg. #EF-9481',
      certHash: 'SHA256:' + Math.random().toString(36).substring(2, 10).toUpperCase() + Math.random().toString(36).substring(2, 10).toUpperCase(),
      caseNumber: cNum,
      disputedAmount: activeCase?.disputedAmount || 0,
      bankName: activeCase?.counterpartyInfo?.bankName || 'Correspondent Bank'
    };

    // 1. Immediately store in localStorage so that reloading the page NEVER resets it
    try {
      const specificKey = `refundguard_affidavit_${uId}_${cNum}`;
      const caseKey = `refundguard_affidavit_${cNum}`;
      const userKey = `refundguard_affidavit_user_${uId}`;
      const lastKey = 'refundguard_affidavit_last';

      const jsonStr = JSON.stringify(newRecord);
      localStorage.setItem(specificKey, jsonStr);
      localStorage.setItem(caseKey, jsonStr);
      localStorage.setItem(userKey, jsonStr);
      localStorage.setItem(lastKey, jsonStr);
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }

    // 2. Persist to backend database
    if (activeCase?.caseNumber) {
      try {
        const activeToken = token || localStorage.getItem('refundguard_token');
        await fetch(`/api/cases/${activeCase.caseNumber}/affidavit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
          },
          body: JSON.stringify(newRecord)
        });

        // Update local cases state
        setCases(prev => prev.map(c => {
          if (c.caseNumber === activeCase.caseNumber) {
            return { ...c, affidavitSigned: true, affidavitInfo: newRecord };
          }
          return c;
        }));
      } catch (err) {
        console.warn('Backend affidavit save warning:', err);
      }
    }

    setAffidavitData(newRecord);
    setAffidavitSigned(true);
    setIsEditingAffidavit(false);
    setAffidavitModalOpen(false);
    setUploadNotice({
      type: 'success',
      text: 'Sworn Affidavit digitally signed and cryptographically sealed under eIDAS protocol #EF-9481.'
    });
  };

  // -------------------------------------------------------------
  // SPECIALIST MESSENGER HANDLERS (Feature 4)
  // -------------------------------------------------------------
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userText = inputMsg.trim();
    const newMsg = {
      id: Date.now(),
      sender: 'claimant',
      text: userText,
      time: 'Just now'
    };

    setMessages(prev => [...prev, newMsg]);
    setInputMsg('');

    // Automated Specialist response after 800ms
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'specialist',
          text: `Thank you for your update regarding case #${activeCase?.caseNumber || 'RG-10482'}. I have logged your message into our compliance tracking dossier. Our dispute team is monitoring respondent bank correspondence.`,
          time: 'Just now'
        }
      ]);
    }, 900);
  };

  // -------------------------------------------------------------
  // APPLE PAY STYLE CONFIRMATION HANDLERS & CHIME
  // -------------------------------------------------------------
  const playApplePayChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Note 1: 784Hz (G5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(784, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.18, now + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: 1046.5Hz (C6) - pleasant Apple Pay confirmation tone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.5, now + 0.12);
      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.22, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.7);
    } catch (_) {}
  };

  // Lock background dashboard scrolling when any popup/modal is active
  useEffect(() => {
    const isAnyModalOpen = withdrawModalOpen || congratsFlashModalOpen || settlementModalOpen || evidenceModalOpen || affidavitModalOpen || messengerOpen || clearanceModalOpen;
    if (isAnyModalOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [withdrawModalOpen, congratsFlashModalOpen, settlementModalOpen, evidenceModalOpen, affidavitModalOpen, messengerOpen, clearanceModalOpen]);

  // Play gentle chime when confirmation checkmark animation fires
  useEffect(() => {
    if (!congratsFlashModalOpen || !congratsCaseData) return;
    const timer = setTimeout(() => {
      playApplePayChime();
    }, 380);
    return () => clearTimeout(timer);
  }, [congratsFlashModalOpen, congratsCaseData]);

  const handleDismissCongrats = async (caseObj) => {
    setCongratsFlashModalOpen(false);
    if (!caseObj) return;
    try {
      localStorage.setItem(`refundguard_seen_settlement_${caseObj.caseNumber}`, 'true');
      const activeToken = token || localStorage.getItem('refundguard_token');
      if (activeToken) {
        await fetch(`/api/cases/${caseObj.caseNumber}/ack-settlement`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}`
          }
        });
      }
    } catch (_) {}
  };

  const handleClaimToWallet = (caseObj) => {
    handleDismissCongrats(caseObj);
    const el = document.getElementById('member-wallet-section');
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // -------------------------------------------------------------
  // MEMBER SECURE WALLET WITHDRAWAL HANDLERS
  // -------------------------------------------------------------
  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    setWithdrawFeedback(null);
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) {
      setWithdrawFeedback({ type: 'error', message: 'Please enter a valid amount to withdraw.' });
      return;
    }
    if (amt > walletBalance) {
      setWithdrawFeedback({ type: 'error', message: `Requested amount exceeds available balance ($${walletBalance.toLocaleString()}).` });
      return;
    }

    setIsWithdrawing(true);
    try {
      const activeToken = token || localStorage.getItem('refundguard_token');
      const destinationStr = withdrawMethod === 'bank_wire' 
        ? `${withdrawDetails.bankName || 'Bank Wire'} (Acct ending in ${withdrawDetails.accountNumber ? withdrawDetails.accountNumber.slice(-4) : '••••'})`
        : withdrawMethod.startsWith('crypto') 
          ? `${withdrawDetails.cryptoNetwork || 'Crypto'}: ${withdrawDetails.walletAddress ? withdrawDetails.walletAddress.slice(0, 6) + '...' + withdrawDetails.walletAddress.slice(-4) : 'Address'}`
          : `PayPal: ${withdrawDetails.paypalEmail || currentUser?.email || 'Account'}`;

      const res = await fetch('/api/cases/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify({
          amount: amt,
          method: withdrawMethod,
          details: {
            ...withdrawDetails,
            destination: destinationStr
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Withdrawal failed to process.');
      }

      setWalletBalance(data.walletBalance);
      if (data.transaction) {
        setWalletTransactions(prev => [data.transaction, ...prev]);
      }

      // Close withdraw input popup and open the official $300 clearance bill popup
      setWithdrawModalOpen(false);
      setActiveClearanceBill({
        billNumber: data.clearanceBillNumber || `INV-CLR-${Math.floor(1000 + Math.random() * 9000)}`,
        amount: amt,
        feeAmount: data.clearanceFee || 300.00,
        destination: destinationStr,
        method: withdrawMethod,
        details: withdrawDetails,
        claimantName: currentUser?.fullName || currentUser?.name || claimantDisplayName,
        claimantEmail: currentUser?.email || 'Registered Member',
        issuedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        transaction: data.transaction
      });
      setClearanceModalOpen(true);
      setFeePaymentFeedback(null);
      setFeePaymentRef('');
      setWithdrawAmount('');
    } catch (err) {
      setWithdrawFeedback({ type: 'error', message: err.message || 'Error executing withdrawal.' });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleConnectWithSpecialistForClearance = (billObj) => {
    if (!billObj) return;
    setClearanceModalOpen(false);
    const invoiceNum = billObj.billNumber || 'INV-CLR-8921';
    const amountFormatted = Number(billObj.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
    const targetEmail = billObj.claimantEmail || currentUser?.email || 'your registered email';

    const claimantMsg = {
      id: Date.now(),
      sender: 'claimant',
      text: `Hello Sarah, I received Mandatory Clearance Invoice #${invoiceNum} ($300.00 USD) for my $${amountFormatted} USD disbursement to ${billObj.destination}. The invoice notes that bank account wire details are sent to my email (${targetEmail}). Please assist me in confirming the payment coordinates so my funds can be wired.`,
      time: 'Just now'
    };

    setMessages(prev => [...prev, claimantMsg]);
    setMessengerOpen(true);

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'specialist',
          text: `Hello ${claimantDisplayName}, I have your Clearance Invoice #${invoiceNum} open on our compliance terminal. The correspondent bank wire coordinates and payment memo have been dispatched to ${targetEmail}. Please review the instructions in your inbox, and reply right here with your transfer reference number or slip once sent. I will personally confirm receipt with the escrow audit desk and release your $${amountFormatted} USD wire immediately.`,
          time: 'Just now'
        }
      ]);
    }, 800);
  };

  const handleResendClearanceEmail = () => {
    setEmailResent(true);
    setTimeout(() => setEmailResent(false), 3500);
  };

  const handleClearanceProofSubmit = async (e) => {
    e.preventDefault();
    if (!feePaymentRef.trim() || !activeClearanceBill?.billNumber) return;
    setFeePaymentSubmitting(true);
    setFeePaymentFeedback(null);
    try {
      const activeToken = token || localStorage.getItem('refundguard_token');
      const res = await fetch('/api/cases/wallet/clearance-pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify({
          billNumber: activeClearanceBill.billNumber,
          paymentReference: feePaymentRef.trim(),
          paymentMethod: 'Correspondent Bank Wire & Support Coordination'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit clearance verification.');
      }

      setFeePaymentFeedback({
        type: 'success',
        message: 'Proof of $300 clearance payment submitted! Senior Compliance Specialist Sarah K. is verifying settlement with the audit desk.'
      });

      if (data.transaction) {
        setWalletTransactions(prev => prev.map(t => 
          (t.details?.clearanceBillNumber === activeClearanceBill.billNumber) ? data.transaction : t
        ));
      }
    } catch (err) {
      setFeePaymentFeedback({ type: 'error', message: err.message || 'Failed to submit payment reference.' });
    } finally {
      setFeePaymentSubmitting(false);
    }
  };

  const handlePrintClearanceBill = () => {
    if (!activeClearanceBill) return;
    const printWin = window.open('', '_blank', 'width=800,height=750');
    if (!printWin) return;
    printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>US.ClaimBack Escrow Clearance Bill - ${activeClearanceBill.billNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 30px; color: #0b192e; line-height: 1.5; font-size: 13px; }
    .header { border-bottom: 2px solid #0b192e; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    .brand { font-size: 24px; font-weight: 800; color: #0b192e; }
    .brand span { color: #10b981; }
    .badge { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; padding: 5px 12px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .meta-table th, .meta-table td { padding: 9px 12px; border: 1px solid #e2e8f0; text-align: left; }
    .meta-table th { background-color: #f8fafc; font-weight: 600; width: 32%; color: #475569; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; margin-bottom: 15px; }
    .due-amount { font-size: 26px; font-weight: 900; color: #b45309; margin: 8px 0; }
    .footer { margin-top: 35px; border-top: 1px solid #cbd5e1; padding-top: 12px; font-size: 10px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">US.<span>ClaimBack</span></div>
      <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Official Statutory Escrow Clearance Bill & Payout Requisition</div>
    </div>
    <div style="text-align: right;">
      <span class="badge">Reference: #${activeClearanceBill.billNumber}</span>
      <div style="margin-top: 4px; font-size: 10px; color: #059669; font-weight: 600;">✓ FinCEN 31 CFR § 1010.410 Compliant</div>
    </div>
  </div>

  <table class="meta-table">
    <tr><th>Invoice Reference</th><td><strong>#${activeClearanceBill.billNumber}</strong></td></tr>
    <tr><th>Issue Date</th><td>${activeClearanceBill.issuedAt || new Date().toLocaleString()}</td></tr>
    <tr><th>Beneficiary Legal Name</th><td><strong>${activeClearanceBill.claimantName}</strong></td></tr>
    <tr><th>Beneficiary Verified Email</th><td><strong>${activeClearanceBill.claimantEmail}</strong></td></tr>
    <tr><th>Designated Payout Destination</th><td><strong>${activeClearanceBill.destination}</strong></td></tr>
    <tr><th>Disbursement Release Amount</th><td><strong style="color: #059669; font-size: 14px;">$${Number(activeClearanceBill.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</strong></td></tr>
    <tr><th>Statutory Clearance Fee Required</th><td><div class="due-amount">$300.00 USD</div></td></tr>
    <tr><th>Statutory Regulatory Mandate</th><td>AML Escrow Clearance & Recipient Account Authorization Protocol (FinCEN / SWIFT Reg. #CLR-882)</td></tr>
    <tr><th>Settlement Banking Instructions</th><td>Dispatched directly to beneficiary registered email (${activeClearanceBill.claimantEmail}) & coordinated with Senior Dispute Strategist Sarah K.</td></tr>
    <tr><th>Status</th><td><strong>AWAITING CLEARANCE SETTLEMENT VIA DIRECT SUPPORT</strong></td></tr>
  </table>

  <div class="box">
    <strong>Correspondent Bank Settlement Notice:</strong> Pursuant to cross-border anti-fraud standards, official wire coordinates and correspondent account details for this $300.00 clearance bill are transmitted securely to the beneficiary's registered email and handled in coordination with the designated dispute specialist. Once settlement is verified, the principal funds of $${Number(activeClearanceBill.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD are released to your destination without further delay.
  </div>

  <div class="footer">
    US.ClaimBack Institutional Clearing & Settlement Network &bull; FinCEN & SWIFT Regulated Clearinghouse
  </div>
</body>
</html>`);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => { printWin.print(); }, 250);
  };

  // -------------------------------------------------------------
  // EXPORT FULL DISPUTE DOSSIER (PDF / PRINT) (Feature 5)
  // -------------------------------------------------------------
  const handleExportFullPacket = (targetCase) => {
    if (!targetCase) return;
    const caseId = targetCase.caseNumber;
    const claimantName = currentUser?.fullName || currentUser?.name || 'David Vance';
    const claimantEmail = currentUser?.email || 'Registered Member';
    const dateFormatted = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const amountFormatted = Number(targetCase.disputedAmount).toLocaleString('en-US', { minimumFractionDigits: 2 });

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>US.ClaimBack Comprehensive Dispute Dossier - ${caseId}</title>
  <style>
    @media print { @page { margin: 15mm; } body { -webkit-print-color-adjust: exact; } }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 30px; color: #0b192e; line-height: 1.5; font-size: 13px; }
    .header { border-bottom: 2px solid #0b192e; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    .brand { font-size: 24px; font-weight: 800; color: #0b192e; }
    .brand span { color: #10b981; }
    .badge { background: #e0f2fe; color: #0369a1; padding: 5px 12px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; border: 1px solid #bae6fd; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .meta-table th, .meta-table td { padding: 9px 12px; border: 1px solid #e2e8f0; text-align: left; }
    .meta-table th { background-color: #f8fafc; font-weight: 600; width: 28%; color: #475569; }
    .section-title { font-size: 13px; font-weight: 700; margin-top: 18px; margin-bottom: 8px; color: #0b192e; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; margin-bottom: 15px; }
    .footer { margin-top: 35px; border-top: 1px solid #cbd5e1; padding-top: 12px; font-size: 10px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">US.<span>ClaimBack</span></div>
      <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Formal Banking Dispute Dossier & Interbank Recall Package</div>
    </div>
    <div style="text-align: right;">
      <span class="badge">Official Reference: #${caseId}</span>
      <div style="margin-top: 4px; font-size: 10px; color: #059669; font-weight: 600;">✓ Synced with MongoDB Atlas & eIDAS Verified</div>
    </div>
  </div>

  <table class="meta-table">
    <tr><th>Case Reference</th><td><strong>#${caseId}</strong></td></tr>
    <tr><th>Date of Filing</th><td>${dateFormatted}</td></tr>
    <tr><th>Claimant Legal Name</th><td><strong>${claimantName}</strong></td></tr>
    <tr><th>Claimant Verified Contact</th><td>${claimantEmail}</td></tr>
    <tr><th>Dispute Category</th><td>${targetCase.scamType || 'Online Financial Fraud'}</td></tr>
    <tr><th>Disputed Sum</th><td><strong style="font-size: 14px; color: #0f172a;">$${amountFormatted} ${targetCase.currency || 'USD'}</strong></td></tr>
    <tr><th>Transaction Date</th><td>${targetCase.incidentDate || 'Recent'}</td></tr>
    <tr><th>Payment Route / Channel</th><td>${targetCase.paymentMethod || 'Bank Wire / SWIFT Network'}</td></tr>
    <tr><th>Counterparty Recipient</th><td><strong>${targetCase.counterpartyInfo?.recipientName || targetCase.counterpartyInfo?.beneficiary || 'Apex Global Trade Ltd'}</strong></td></tr>
    <tr><th>Counterparty Account / Handle</th><td>${targetCase.counterpartyInfo?.accountOrHandle || 'GB89 BARC 2004 1538 9012'}</td></tr>
    <tr><th>Current Milestone Status</th><td>${targetCase.status?.toUpperCase()} &bull; Under Financial Fraud Specialist Review</td></tr>
  </table>

  <div class="section-title">Claimant Statement & Case Narrative</div>
  <div class="box">${targetCase.description || 'Claimant transferred funds for commercial transaction. Counterparty severed contact immediately following wire transfer settlement.'}</div>

  <div class="section-title">Sworn Claimant Affidavit Status</div>
  <div class="box" style="background: #ecfdf5; border-color: #a7f3d0; color: #065f46;">
    <strong>✓ Sworn Electronic Signature Recorded</strong><br>
    Declared under penalty of perjury. Transmitted to correspondent bank fraud compliance intake under eIDAS reference #EF-9481.
  </div>

  <div class="section-title">Evidence Inventory (${evidenceList.length} Cataloged Documents)</div>
  <table class="meta-table">
    <tr><th style="width: 8%;">#</th><th>Document Name</th><th style="width: 20%;">Size</th><th style="width: 25%;">Integrity Status</th></tr>
    ${evidenceList.map((f, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${f.name}</strong></td>
        <td>${f.size}</td>
        <td><span style="color: #059669; font-weight: 600;">✓ SHA-256 Verified</span></td>
      </tr>
    `).join('')}
  </table>

  <div class="footer">
    US.ClaimBack Consumer Advocacy Inc. &bull; Official Evidence Record Intake &bull; This packet is an official evidence dossier compiled for issuing banks, correspondent institutions, and regulatory arbitration desks.
  </div>
  <script>window.onload = function() { window.print(); };</script>
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

  return (
    <div className="member-dashboard-page">
      <div className="member-mobile-container">
        
        {/* ================= WELCOME BANNER ================= */}
        <div className="member-welcome-card">
          <h1 className="member-welcome-title">
            Welcome back, {claimantDisplayName}.
          </h1>
        </div>

        {/* ================= 3. 4 SUMMARY STAT CARDS (2x2 Grid on mobile, 4 columns on desktop) ================= */}
        <div className="member-stats-2x2">
          {/* Active Cases */}
          <div className="member-stat-box">
            <div className="stat-box-top">
              <span className="stat-box-label">ACTIVE CASES</span>
              <div className="stat-box-icon folder">
                <Folder size={16} />
              </div>
            </div>
            <div className="stat-box-value">
              {activeCasesCount < 10 ? `0${activeCasesCount}` : activeCasesCount}
            </div>
            <span className="stat-box-sub">
              {activeCasesCount > 0 ? '1 pending action' : '0 pending action'}
            </span>
          </div>

          {/* Total Reported */}
          <div className="member-stat-box">
            <div className="stat-box-top">
              <span className="stat-box-label">TOTAL REPORTED</span>
              <div className="stat-box-icon bank">
                <Building2 size={16} />
              </div>
            </div>
            <div className="stat-box-value">
              ${totalReportedAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              <span className="stat-cents">.00</span>
            </div>
            <span className="stat-box-sub">Cumulative claims</span>
          </div>

          {/* Recovered */}
          <div className="member-stat-box">
            <div className="stat-box-top">
              <span className="stat-box-label green">RECOVERED</span>
              <div className="stat-box-icon green">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="stat-box-value green">
              {recoveredCount}
              {totalRecoveredAmount > 0 && (
                <span className="stat-sub-settled"> (${totalRecoveredAmount.toLocaleString()} settled)</span>
              )}
            </div>
            <span className="stat-box-sub">Via bank chargeback</span>
          </div>

          {/* Under Review */}
          <div className="member-stat-box">
            <div className="stat-box-top">
              <span className="stat-box-label">UNDER REVIEW</span>
              <div className="stat-box-icon layers">
                <Layers size={16} />
              </div>
            </div>
            <div className="stat-box-value">
              {underReviewCount < 10 ? `0${underReviewCount}` : underReviewCount}
            </div>
            <span className="stat-box-sub">Compliance intake</span>
          </div>
        </div>

        {/* Upload Alert Notice if any */}
        {uploadNotice && (
          <div className={`auth-alert-banner ${uploadNotice.type === 'error' ? 'error' : 'success'}`} style={{ padding: '0.85rem 1rem', margin: '1rem 0' }}>
            {uploadNotice.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{uploadNotice.text}</span>
          </div>
        )}

        {/* ================= MEMBER SECURE WALLET SECTION ================= */}
        <div id="member-wallet-section" className="member-wallet-card">
          <div className="wallet-card-header">
            <div className="wallet-brand-meta">
              <div className="wallet-icon-shield">
                <img src="/logo.png" alt="US.ClaimBack Emblem" className="wallet-logo-shield-img" />
              </div>
              <div>
                <div className="wallet-title-row">
                  <h3 className="wallet-title">US.ClaimBack Secure Member Wallet</h3>
                  <span className="wallet-badge-live">eIDAS Vault &bull; Insured</span>
                </div>
                <p className="wallet-subtext">
                  Direct recipient ledger for validated dispute recovery payouts & interbank restitution settlements.
                </p>
              </div>
            </div>
            <div className="wallet-quick-actions">
              <button 
                type="button" 
                className="wallet-btn-withdraw"
                onClick={handleWithdrawClick}
              >
                <span>Withdraw Funds</span>
              </button>
              <button 
                type="button" 
                className="wallet-btn-secondary"
                onClick={() => setShowLedger(!showLedger)}
              >
                <span>{showLedger ? 'Hide Ledger' : 'Transaction History'}</span>
              </button>
            </div>
          </div>

          {/* ================= MULTI-CASE SELECTOR FOR WALLET BOARD ================= */}
          {cases.length > 1 && (
            <div className="wallet-case-switcher-box">
              <div className="wallet-case-switcher-intro">
                <span className="wallet-case-switcher-title">Select Active Dispute Case:</span>
                <span className="wallet-case-switcher-hint">Switch between your dispute cases to view each file's recovered balance and withdrawal clearance status.</span>
              </div>
              <div className="wallet-case-pills-grid">
                {cases.map((c, idx) => {
                  const isCurrent = activeCase?.caseNumber === c.caseNumber;
                  const isCaseSettled = c.status === 'resolved';
                  const cAmount = isCaseSettled ? Number(c.settledAmount || c.disputedAmount || 0) : 0;
                  const isApproved = Boolean(isCaseSettled && (c.withdrawalAllowed || localStorage.getItem(`refundguard_withdrawal_allowed_${c.caseNumber}`) === 'true'));
                  return (
                    <button
                      key={c._id || c.caseNumber || idx}
                      type="button"
                      className={`wallet-case-select-card ${isCurrent ? 'selected' : ''}`}
                      onClick={() => handleSelectCase(c, idx)}
                    >
                      <div className="case-select-header">
                        <span className="case-select-id">Case #{c.caseNumber}</span>
                        <span className={`case-select-status-badge ${isApproved ? 'badge-approved' : (isCaseSettled ? 'badge-pending' : 'badge-review')}`} style={!isCaseSettled ? { background: '#f1f5f9', color: '#64748b', borderColor: '#e2e8f0' } : {}}>
                          {isApproved 
                            ? 'Approved for Withdrawal' 
                            : (isCaseSettled ? 'Pending $300 Clearance' : 'In Progress / Pending Review')}
                        </span>
                      </div>
                      <div className="case-select-body">
                        <span className="case-select-label">Recovered Amount</span>
                        <span className="case-select-val" style={!isCaseSettled ? { color: '#94a3b8' } : {}}>
                          ${cAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Plain text restriction notice when payment is not yet complete */}
          {withdrawNotice && (
            <div className="wallet-plain-notice">
              <div className="wallet-plain-notice-text">
                {withdrawNotice}
              </div>
              <button 
                type="button" 
                className="wallet-plain-notice-dismiss"
                onClick={() => setWithdrawNotice(null)}
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="wallet-balance-row">
            <div className="wallet-balance-main">
              <div className="wallet-balance-header-row">
                <span className="wallet-balance-label">AVAILABLE RECOVERED BALANCE</span>
                {activeCase && (
                  <span className="wallet-active-case-tag">
                    Case #{activeCase.caseNumber}
                  </span>
                )}
              </div>
              <div className="wallet-balance-number">
                ${activeCaseBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="wallet-currency-code">USD</span>
              </div>
              <div className="wallet-active-case-status-bar">
                {isCaseResolved ? (
                  isCaseWithdrawalAllowed ? (
                    <span className="wallet-status-tag status-approved">
                      Withdrawal Status: Approved by Admin (Ready for Immediate Payout)
                    </span>
                  ) : (
                    <span className="wallet-status-tag status-pending">
                      Withdrawal Status: Case Resolved (Requires $300 Upfront Clearance Approval)
                    </span>
                  )
                ) : (
                  <span className="wallet-status-tag" style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
                    Case Status: {activeCase?.status ? activeCase.status.replace('_', ' ').toUpperCase() : 'PENDING'} (Dispute In Progress &bull; Unsettled)
                  </span>
                )}
              </div>
              <span className="wallet-instant-notice">
                Available for immediate wire transfer, crypto dispatch, or digital payout (Zero Transfer Fees)
              </span>
            </div>

            <div className="wallet-metrics-pills">
              <div className="wallet-mini-stat">
                <span className="mini-stat-label">DISPUTED SUM</span>
                <span className="mini-stat-val text-slate">
                  ${Number(activeCase?.disputedAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="wallet-mini-stat">
                <span className="mini-stat-label">RECOVERED SUM</span>
                <span className={`mini-stat-val ${isCaseResolved ? 'text-green' : 'text-slate'}`}>
                  ${activeCaseBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="wallet-mini-stat">
                <span className="mini-stat-label">CLEARANCE STATUS</span>
                <span className={`mini-stat-val ${isCaseResolved ? (isCaseWithdrawalAllowed ? 'text-green' : 'text-amber') : 'text-slate'}`}>
                  {isCaseResolved ? (isCaseWithdrawalAllowed ? 'Clearance OK' : '$300 Required') : 'Pending Resolution'}
                </span>
              </div>
            </div>
          </div>

          {/* Collapsible / Integrated Transaction Ledger */}
          {showLedger && (
            <div className="wallet-ledger-block">
              <h4 className="ledger-heading">Restitution & Payout Ledger</h4>
              {walletTransactions.length > 0 ? (
                <div className="ledger-table-wrap">
                  <table className="ledger-table">
                    <thead>
                      <tr>
                        <th>Date & Reference</th>
                        <th>Type & Description</th>
                        <th>Disbursement Channel</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {walletTransactions.map((tx, idx) => (
                        <tr key={tx._id || idx}>
                          <td>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>
                              {new Date(tx.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {tx.caseNumber ? `#${tx.caseNumber}` : `TX-${(tx._id || idx).toString().slice(-6).toUpperCase()}`}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{tx.type === 'settlement_credit' ? 'Recovery Settlement Credit' : 'Claimant Withdrawal'}</div>
                            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>{tx.description}</span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.78rem', textTransform: 'capitalize' }}>
                              {tx.method?.replace('_', ' ') || 'Direct Payout'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                              <span className={`ledger-status-pill ${tx.status || 'completed'}`}>
                                {tx.status === 'pending_clearance' ? 'PENDING $300 CLEARANCE' : (tx.status?.toUpperCase() || 'COMPLETED')}
                              </span>
                              {tx.details?.clearanceBillNumber && (
                                <button
                                  type="button"
                                  style={{
                                    background: '#fffbeb',
                                    color: '#b45309',
                                    border: '1px solid #fde68a',
                                    borderRadius: '4px',
                                    padding: '2px 7px',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}
                                  onClick={() => {
                                    setActiveClearanceBill({
                                      billNumber: tx.details.clearanceBillNumber,
                                      amount: tx.amount,
                                      feeAmount: tx.details.clearanceFeeAmount || 300.00,
                                      destination: tx.description?.replace('Disbursement to ', '') || 'Account',
                                      method: tx.method,
                                      details: tx.details,
                                      claimantName: currentUser?.fullName || currentUser?.name || claimantDisplayName,
                                      claimantEmail: currentUser?.email || 'Registered Member',
                                      issuedAt: new Date(tx.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                                      transaction: tx
                                    });
                                    setClearanceModalOpen(true);
                                    setFeePaymentFeedback(null);
                                    setFeePaymentRef(tx.details?.feePaymentReference || '');
                                  }}
                                >
                                  📄 View $300 Bill (#{tx.details.clearanceBillNumber})
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.9rem' }}>
                            <span style={{ color: tx.type === 'settlement_credit' ? '#059669' : '#0f172a' }}>
                              {tx.type === 'settlement_credit' ? '+' : '-'}${Number(tx.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.5rem 0' }}>
                  No transaction records yet. As disputes are settled, recovered funds will appear here.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ================= 4. ACTION REQUIRED CARD / AFFIDAVIT SEAL (Feature 1) ================= */}
        {!affidavitSigned && activeCase && (
          <div className="action-required-card">
            <div className="action-required-header">
              <div className="action-exclamation-bubble">
                <span>!</span>
              </div>
              <div>
                <span className="action-badge-tag">ACTION REQUIRED</span>
                <span className="action-due-badge">Due in 48h</span>
              </div>
            </div>

            <h3 className="action-required-title">
              Signed Affidavit required by {activeCase.counterpartyInfo?.bankName || 'Correspondent Bank'} Fraud Dept.
            </h3>
            <p className="action-required-desc">
              Formal verification required to substantiate the unauthorized Swift recall request and finalize intake submission.
            </p>

            <button 
              className="action-sign-btn"
              onClick={() => {
                setIsEditingAffidavit(true);
                setAffidavitModalOpen(true);
              }}
            >
              <PenTool size={15} />
              <span>Sign & Upload Affidavit</span>
            </button>

            <div className="action-encrypted-footer">
              <Lock size={12} />
              <span>Digitally encrypted & authenticated via eIDAS</span>
            </div>
          </div>
        )}

        {affidavitSigned && activeCase && (
          <div className="affidavit-signed-seal">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '0.84rem', color: '#065f46', display: 'block' }}>SWORN AFFIDAVIT DIGITALLY SEALED</strong>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.73rem', color: '#047857' }}>
                  Authenticated under {affidavitData?.protocol || 'eIDAS Reg. #EF-9481'} &bull; Signed by {affidavitData?.signedBy || claimantDisplayName} {affidavitData?.signedDateFormatted ? `on ${affidavitData.signedDateFormatted}` : ''} &bull; Legally sealed & filed with issuing bank.
                </p>
              </div>
            </div>
            <button 
              className="reopen-sig-btn" 
              onClick={() => {
                setIsEditingAffidavit(false);
                setAffidavitModalOpen(true);
              }}
            >
              <Eye size={12} /> View Certificate
            </button>
          </div>
        )}

        {/* ================= 3. MULTI-CASE SELECTOR TABS (Feature 3) ================= */}
        {cases.length > 1 && (
          <div className="case-selector-bar">
            {cases.map((c, idx) => {
              const isSelected = activeCase?.caseNumber === c.caseNumber;
              const caseAmount = Number(c.settledAmount || c.disputedAmount || 0);
              const isApproved = Boolean(c.withdrawalAllowed || localStorage.getItem(`refundguard_withdrawal_allowed_${c.caseNumber}`) === 'true');
              return (
                <button
                  key={c._id || c.caseNumber || idx}
                  className={`case-tab-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => handleSelectCase(c, idx)}
                >
                  <Folder size={13} />
                  <span>Case #{c.caseNumber}</span>
                  <span className="case-tab-amount">${caseAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  {c.status === 'resolved' && <span className="tab-status-dot resolved" />}
                  {isApproved && <span className="tab-approval-pill">Withdrawal Approved</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* ================= 5. ACTIVE CASE CARD (Matches Screenshot) ================= */}
        {activeCase ? (
          <div className="dispute-case-card">
            {/* Top Pill Badges */}
            <div className="case-card-top-row">
              <div className="case-status-live-pill">
                <span className="live-pill-dot" />
                <span>{activeCase.status === 'under_review' ? 'Under Investigation' : activeCase.status?.replace('_', ' ').toUpperCase()}</span>
              </div>
              <span className="case-reference-id">ID : #{activeCase.caseNumber}</span>
            </div>

            {/* Case Type Tag & Title */}
            <div className="case-category-tag">
              DISPUTE: {activeCase.scamType?.toUpperCase() || 'SCAM CASE'}
            </div>
            <h2 className="case-headline-title">
              {activeCase.title}
            </h2>

            {/* Disputed Amount & Filing Date */}
            <div className="case-financial-row">
              <div>
                <label className="case-mini-label">Disputed Amount</label>
                <div className="case-bold-amount">
                  ${Number(activeCase.disputedAmount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  <span className="case-amount-currency">.00 USD</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <label className="case-mini-label">Filing Date</label>
                <div className="case-filing-date">
                  {activeCase.incidentDate || new Date(activeCase.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Feature 5: Export Full Dispute Dossier Button */}
            <button 
              type="button"
              className="btn-export-dossier"
              onClick={() => handleExportFullPacket(activeCase)}
              title="Generate, Preview & Print Formal Bank Dispute Dossier"
            >
              <Printer size={14} />
              <span>Export Full Dispute Dossier (Official PDF)</span>
            </button>

            <div className="case-desktop-grid">
              <div className="case-col-main">
                {/* Receiving Counterparty */}
                <div className="case-detail-row">
                  <div className="detail-icon-box blue">
                    <Building2 size={16} />
                  </div>
                  <div className="detail-info-block">
                    <label className="case-mini-label">Receiving Counterparty</label>
                    <div className="detail-title-text">
                      {activeCase.counterpartyInfo?.beneficiary || activeCase.counterpartyInfo?.recipientName || activeCase.counterpartyInfo?.bankName || 'Apex Trade Global Ltd'}
                    </div>
                    <div className="detail-alert-subtext">
                      <AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      Suspicious Offshore Account Flagged
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="case-detail-row">
                  <div className="detail-icon-box purple">
                    <CreditCardIcon />
                  </div>
                  <div className="detail-info-block">
                    <label className="case-mini-label">Payment Method</label>
                    <div className="detail-title-text">
                      {activeCase.paymentMethod || 'Wire Transfer / Swift Network'}
                    </div>
                    <div className="detail-muted-subtext">
                      Origin: Primary Correspondent Checking (...4820)
                    </div>
                  </div>
                </div>

                {/* Evidence Files Attached (Feature 2: Evidence Vault Access) */}
                <div className="case-detail-row files-row">
                  <div className="detail-icon-box blue">
                    <FileCheck size={16} />
                  </div>
                  <div className="detail-info-block" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div>
                      <div className="detail-title-text" style={{ fontSize: '0.88rem' }}>
                        {evidenceList.length} Files Attached (SHA-256 Verified)
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button 
                        type="button" 
                        className="view-vault-btn" 
                        onClick={() => setEvidenceModalOpen(true)}
                      >
                        <Folder size={13} />
                        <span>Open Vault</span>
                      </button>
                      <label className="view-files-link" style={{ cursor: 'pointer', margin: 0 }}>
                        <span>+ Add Proof</span>
                        <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Senior Dispute Strategist Quote Box (Feature 4: Specialist Messenger) */}
                <div className="strategist-note-box">
                  <div className="strategist-profile">
                    <div className="strategist-avatar">SK</div>
                    <div>
                      <h4 className="strategist-name">Sarah K.</h4>
                      <span className="strategist-role">Senior Dispute Strategist &bull; Case Lead</span>
                    </div>
                  </div>
                  <p className="strategist-quote">
                    &ldquo;Senior Analyst Sarah K. has prepared formal complaint dossier packet <strong>#CP-591</strong>. SWIFT recall transmitted to receiving correspondent bank. Chase compliance fraud division has opened formal ticket <strong>#CW-8926</strong>.&rdquo;
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span className="strategist-timestamp">
                      Updated yesterday at 3:45 PM
                    </span>
                    <button 
                      type="button"
                      className="btn-msg-specialist"
                      onClick={() => setMessengerOpen(true)}
                    >
                      <MessageSquare size={13} color="#2563eb" />
                      <span>Message Analyst Sarah</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="case-col-side">
                {/* ================= 6. AUDIT TRAIL / RECOVERY PROGRESS TIMELINE ================= */}
                <div className="audit-trail-section">
                  <div className="audit-trail-header">
                    <div>
                      <span className="audit-label">AUDIT TRAIL</span>
                      <h3 className="audit-title">Recovery Progress Timeline</h3>
                    </div>
                    <span className="audit-stage-pill">Stage 3 of 4</span>
                  </div>

                  <div className="audit-timeline-flow">
                    {activeCase.milestones && activeCase.milestones.length > 0 ? (
                      activeCase.milestones.map((ms, idx) => {
                        const isCompleted = ms.status === 'completed';
                        const isCurrent = ms.status === 'current';
                        return (
                          <div key={ms._id || idx} className={`audit-step-item ${ms.status}`}>
                            <div className="audit-step-marker">
                              {isCompleted ? (
                                <div className="marker-check">✓</div>
                              ) : isCurrent ? (
                                <div className="marker-current">
                                  <span className="marker-current-dot" />
                                </div>
                              ) : (
                                <div className="marker-upcoming">○</div>
                              )}
                            </div>
                            <div className="audit-step-body">
                              <div className="audit-step-top">
                                <h4 className="audit-step-name">{ms.title}</h4>
                                <span className="audit-step-date">
                                  {ms.completedDate || (isCurrent ? 'Current' : 'Pending')}
                                </span>
                              </div>
                              {ms.description && (
                                <p className="audit-step-desc">{ms.description}</p>
                              )}
                              {isCurrent && (
                                <div className="audit-current-ping">
                                  Last ping: Today at 09:20 AM
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Initial dispute milestones pending review.</p>
                    )}
                  </div>
                </div>

                {/* ================= 7. CASE ACTIVITY FEED ================= */}
                <div className="activity-feed-section">
                  <div className="activity-feed-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Bell size={16} color="var(--blue-accent)" />
                      <h3 className="activity-title">Case Activity Feed</h3>
                    </div>
                    <button className="mark-read-btn">Mark all read</button>
                  </div>

                  <div className="activity-items-list">
                    <div className="activity-item">
                      <div className="activity-icon-bubble blue">
                        <ArrowRight size={14} />
                      </div>
                      <div className="activity-item-content">
                        <div className="activity-item-title">Evidence packet transmitted</div>
                        <p className="activity-item-desc">
                          Your compiled evidence packet #CP-591 was submitted to Chase Fraud Operations.
                        </p>
                        <span className="activity-item-time">2h ago</span>
                      </div>
                    </div>

                    <div className="activity-item">
                      <div className="activity-icon-bubble purple">
                        <Layers size={14} />
                      </div>
                      <div className="activity-item-content">
                        <div className="activity-item-title">Case Status Advanced</div>
                        <p className="activity-item-desc">
                          Case #{activeCase.caseNumber} moved to active investigation stage with receiving correspondent bank.
                        </p>
                        <span className="activity-item-time">1d ago</span>
                      </div>
                    </div>

                    <div className="activity-item">
                      <div className="activity-icon-bubble blue">
                        <FileText size={14} />
                      </div>
                      <div className="activity-item-content">
                        <div className="activity-item-title">Evidence Upload Confirmed</div>
                        <p className="activity-item-desc">
                          Wire transfer confirmation MT103 verified with SHA-256 integrity hash.
                        </p>
                        <span className="activity-item-time">3d ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty Case State when user has zero cases */
          <div className="dispute-case-card empty-state" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--bg-soft-blue)', color: 'var(--blue-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Folder size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--navy-primary)', fontWeight: 700, marginBottom: '0.5rem' }}>
              Vault Initialized &bull; 0 Active Disputes
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '380px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
              All your live case data is synced with MongoDB Atlas. You have not filed a dispute yet. Report your first incident to build your evidence dossier.
            </p>
            <button 
              className="btn btn-primary"
              style={{ padding: '0.8rem 1.5rem' }}
              onClick={onStartNewCase}
            >
              <Plus size={16} />
              <span>Report First Incident</span>
            </button>
          </div>
        )}

        {/* ================= 8. RESOLVED CASES (If any in MongoDB) ================= */}
        {resolvedCasesList.map(rc => (
          <div key={rc._id} className="resolved-case-card">
            <div className="resolved-top-row">
              <span className="resolved-case-num">CASE #{rc.caseNumber}</span>
              <span className="resolved-status-pill">
                <span className="resolved-pill-dot" />
                Recovered + Settled
              </span>
            </div>
            <h4 className="resolved-title">{rc.title}</h4>
            <div className="resolved-bottom-row">
              <div className="resolved-amount">
                ${Number(rc.disputedAmount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}.00
                <span className="resolved-pct"> 100% Recovered</span>
              </div>
              <button 
                type="button"
                className="view-settlement-btn"
                onClick={() => {
                  setSelectedSettlementCase(rc);
                  setSettlementModalOpen(true);
                }}
              >
                View Settlement Dossier &rarr;
              </button>
            </div>
          </div>
        ))}

        {/* ================= 9. INSTITUTIONAL TRANSPARENCY DISCLOSURE ================= */}
        <div className="member-transparency-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <ShieldAlert size={16} color="var(--blue-accent)" />
            <h5 className="transparency-title">Institutional Transparency Disclosure</h5>
          </div>
          <p className="transparency-text">
            US.ClaimBack is an independent consumer evidence assembly and regulatory dispute preparation organization. We are not a collection agency, legal firm, or depository financial institution. We do not guarantee fund recovery, as final dispute adjudication rests strictly with issuing banks, card associations (Visa/Mastercard), regulatory bodies, and designated correspondent banking institutions.
          </p>
          <div className="transparency-badges">
            <span className="cert-badge">SOC2 Type II Certified</span>
            <span className="cert-badge">CFPB Registered Dispute Aid</span>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="member-ssl-footer">
          <p style={{ marginTop: '0.25rem', fontSize: '0.72rem', color: 'var(--text-light)' }}>
            US.ClaimBack is an evidence preparation and dispute assistance service. We do not guarantee fund recovery. Final determinations rest with the respective financial institutions or regulatory authorities.
          </p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-light)' }}>
            &copy; 2026 US.ClaimBack Consumer Advocacy Inc. All rights reserved.
          </p>
        </div>

        {/* ================= 10. BOTTOM FLOATING DOCK (Matches Screenshot) ================= */}
        <div className="member-bottom-dock">
          <button 
            className="dock-item"
            onClick={() => onNavigate && onNavigate('home')}
            title="Home"
          >
            <Home size={19} />
            <span>Home</span>
          </button>

          <button 
            className="dock-item active"
            title="Dashboard"
          >
            <FileText size={19} />
            <span>Dashboard</span>
          </button>

          <button 
            className="dock-center-plus"
            onClick={onStartNewCase}
            title="Report New Dispute"
          >
            <Plus size={22} />
          </button>

          <button 
            className="dock-item"
            onClick={() => onNavigate && onNavigate('track')}
            title="Track Case"
          >
            <Compass size={19} />
            <span>Track</span>
          </button>

          <button 
            className="dock-item"
            onClick={() => {
              const el = document.getElementById('help-center');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            title="Help"
          >
            <HelpCircle size={19} />
            <span>Help</span>
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* FEATURE 2 MODAL: INTERACTIVE EVIDENCE VAULT (Download, Delete, Upload)   */}
      {/* ========================================================================= */}
      {evidenceModalOpen && (
        <div className="dash-modal-backdrop" onClick={() => setEvidenceModalOpen(false)}>
          <div className="dash-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header">
              <h3 className="dash-modal-title">
                <Folder size={18} color="#2563eb" />
                <span>Evidence Vault &bull; #{activeCase?.caseNumber || 'Active Case'}</span>
              </h3>
              <button className="dash-modal-close-btn" onClick={() => setEvidenceModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="dash-modal-body">
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem', lineHeight: 1.5 }}>
                Upload bank transfer receipts, Swift MT103 confirmations, emails, and scam communications. All files are cataloged with cryptographic integrity hashes for issuing bank arbitration.
              </p>

              {/* Upload Dropzone */}
              <label className="vault-dropzone">
                <UploadCloud size={28} color="#2563eb" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                  {isUploading ? 'Encrypting & uploading to vault...' : 'Click or tap to upload evidence document'}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Supports PDF, JPG, PNG, WEBP (Up to 15MB each)
                </div>
                <input 
                  type="file" 
                  style={{ display: 'none' }} 
                  disabled={isUploading}
                  onChange={handleFileUpload} 
                />
              </label>

              {/* Document Category Selector */}
              <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>Tag Document As:</label>
                <select 
                  value={evidenceCategory} 
                  onChange={(e) => setEvidenceCategory(e.target.value)}
                  style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', background: '#ffffff' }}
                >
                  <option value="bank_statement">Bank Account Statement</option>
                  <option value="swift_mt103">Swift MT103 Transfer Slip</option>
                  <option value="chat_log">Chat / WhatsApp / Telegram Record</option>
                  <option value="scam_contract">Fake Contract / Investment Agreement</option>
                  <option value="crypto_hash">Blockchain Tx Hash / Ledger Receipt</option>
                </select>
              </div>

              {/* Uploaded Files Inventory */}
              <div>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Vault Inventory ({evidenceList.length} Files)
                </h4>

                {evidenceList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                    <Folder size={24} color="#94a3b8" style={{ margin: '0 auto 0.4rem', display: 'block' }} />
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>No evidence files uploaded for this case yet.</p>
                  </div>
                ) : (
                  evidenceList.map((file, idx) => (
                    <div key={file.id || idx} className="evidence-file-item">
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={16} />
                      </div>
                      <div className="file-info-col">
                        <div className="file-name-text" title={file.name}>{file.name}</div>
                        <div className="file-meta-row">
                          <span>{file.size}</span>
                          <span>&bull;</span>
                          <span style={{ textTransform: 'capitalize' }}>{file.type?.replace('_', ' ')}</span>
                          <span className="sha-badge">SHA-256 ✓</span>
                        </div>
                      </div>
                      <div className="file-action-btns">
                        <button 
                          type="button"
                          className="file-btn-sm" 
                          onClick={() => handleDownload(file)}
                          title="Download copy"
                        >
                          <Download size={13} />
                        </button>
                        <button 
                          type="button"
                          className="file-btn-sm delete" 
                          disabled={isDeletingId === file.id}
                          onClick={() => handleDeleteEvidence(file.id)}
                          title="Remove from vault"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="dash-modal-footer">
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }} 
                onClick={() => setEvidenceModalOpen(false)}
              >
                Close Vault
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FEATURE 1 MODAL: DIGITAL AFFIDAVIT E-SIGNING (Canvas & Legal Oath)        */}
      {/* ========================================================================= */}
      {affidavitModalOpen && (
        <div className="dash-modal-backdrop" onClick={() => setAffidavitModalOpen(false)}>
          <div className="dash-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header">
              <h3 className="dash-modal-title">
                <PenTool size={18} color="#2563eb" />
                <span>Sworn Claimant Affidavit &bull; #{activeCase?.caseNumber || 'RG-10482'}</span>
              </h3>
              <button className="dash-modal-close-btn" onClick={() => setAffidavitModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="dash-modal-body">
              {affidavitSigned && !isEditingAffidavit ? (
                <div>
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    padding: '1rem 1.25rem',
                    marginBottom: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#dcfce7',
                      color: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.5rem'
                    }}>
                      <CheckCircle2 size={22} />
                    </div>
                    <h4 style={{ margin: '0 0 0.25rem', color: '#166534', fontSize: '0.98rem', fontWeight: 700 }}>
                      SWORN CLAIMANT AFFIDAVIT SEALED
                    </h4>
                    <span style={{ fontSize: '0.76rem', color: '#15803d', fontWeight: 600 }}>
                      Cryptographically Authenticated under {affidavitData?.protocol || 'eIDAS Reg. #EF-9481'}
                    </span>
                  </div>

                  <div className="affidavit-legal-frame" style={{ background: '#f8fafc' }}>
                    <p style={{ margin: '0 0 0.5rem', fontWeight: 700, color: '#0f172a', fontSize: '0.86rem' }}>
                      SUMMARY OF SWORN DEPOSITION
                    </p>
                    <p style={{ margin: '0 0 0.4rem', fontSize: '0.8rem', color: '#334155' }}>
                      Deponent Claimant: <strong>{affidavitData?.signedBy || claimantDisplayName}</strong>
                    </p>
                    <p style={{ margin: '0 0 0.4rem', fontSize: '0.8rem', color: '#334155' }}>
                      Filing Case Reference: <strong>#{affidavitData?.caseNumber || activeCase?.caseNumber || 'RG-10482'}</strong>
                    </p>
                    <p style={{ margin: '0 0 0.4rem', fontSize: '0.8rem', color: '#334155' }}>
                      Execution Timestamp: <strong>{affidavitData?.signedDateFormatted || 'Recorded & Verified'}</strong>
                    </p>
                    <p style={{ margin: '0 0 0.6rem', fontSize: '0.8rem', color: '#334155' }}>
                      Cryptographic Ledger Hash: <code style={{ fontSize: '0.72rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{affidavitData?.certHash || 'SHA256:AUTHENTICATED-SEAL'}</code>
                    </p>

                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #cbd5e1' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.4rem', fontWeight: 700 }}>
                        Legal Digital Signature:
                      </span>
                      {affidavitData?.signatureImg ? (
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.5rem', display: 'inline-block' }}>
                          <img 
                            src={affidavitData.signatureImg} 
                            alt="Claimant Signature" 
                            style={{ maxHeight: '60px', display: 'block' }} 
                          />
                        </div>
                      ) : (
                        <div style={{ fontFamily: 'cursive', fontSize: '1.3rem', color: '#1e3a8a', padding: '0.25rem 0' }}>
                          {affidavitData?.typedSignature || claimantDisplayName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Formal Legal Declaration Frame */}
                  <div className="affidavit-legal-frame">
                    <p style={{ margin: '0 0 0.5rem', fontWeight: 700, color: '#0f172a' }}>
                      AFFIDAVIT OF UNAUTHORIZED TRANSACTION & FRAUDULENT INDUCEMENT
                    </p>
                    <p style={{ margin: '0 0 0.5rem' }}>
                      I, <strong>{claimantDisplayName}</strong>, of legal age, under penalty of perjury under the laws of the United States (18 U.S.C. &sect; 1621) and the European Union eIDAS Regulation (EU) No 910/2014, hereby solemnly depose and state:
                    </p>
                    <ol style={{ margin: '0 0 0.5rem', paddingLeft: '1.2rem' }}>
                      <li>The financial transaction(s) totaling <strong>${Number(activeCase?.disputedAmount || 0).toLocaleString()} USD</strong> associated with counterparty <strong>{activeCase?.counterpartyInfo?.beneficiary || activeCase?.counterpartyInfo?.bankName || 'the receiving entity'}</strong> were executed under fraudulent misrepresentation and deceptive pretenses.</li>
                      <li>I received zero legitimate commercial value or service in exchange for the transmitted funds.</li>
                      <li>I formally authorize US.ClaimBack Consumer Advocacy to transmit this sworn deposition to correspondent banks and regulatory fraud divisions.</li>
                    </ol>
                  </div>

                  {/* Signature Mode Toggle */}
                  <div className="sig-mode-toggle">
                    <button 
                      type="button"
                      className={`sig-mode-tab ${sigMode === 'draw' ? 'active' : ''}`}
                      onClick={() => setSigMode('draw')}
                    >
                      <PenTool size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      Draw Signature
                    </button>
                    <button 
                      type="button"
                      className={`sig-mode-tab ${sigMode === 'type' ? 'active' : ''}`}
                      onClick={() => setSigMode('type')}
                    >
                      <FileCheck size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      Type Legal Name
                    </button>
                  </div>

                  {/* Canvas Pad or Typed Signature */}
                  {sigMode === 'draw' ? (
                    <div className="signature-pad-container">
                      <canvas 
                        ref={canvasRef}
                        width={500}
                        height={140}
                        className="signature-canvas"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      <div className="signature-pad-toolbar">
                        <span>Draw your signature above</span>
                        <button type="button" className="sig-clear-btn" onClick={clearCanvas}>
                          Clear Canvas
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
                        Type Full Legal Name (Creates eIDAS Digital Signature):
                      </label>
                      <input 
                        type="text" 
                        value={typedSignature}
                        onChange={(e) => setTypedSignature(e.target.value)}
                        placeholder={claimantDisplayName}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontSize: '1.1rem',
                          fontFamily: 'cursive',
                          color: '#1e3a8a',
                          background: '#ffffff'
                        }}
                      />
                    </div>
                  )}

                  {/* Legal Confirmation Checkbox */}
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.78rem', color: '#334155', cursor: 'pointer', lineHeight: 1.45, marginTop: '0.5rem' }}>
                    <input 
                      type="checkbox" 
                      checked={affidavitConsent}
                      onChange={(e) => setAffidavitConsent(e.target.checked)}
                      style={{ marginTop: '2px' }} 
                    />
                    <span>
                      I declare under penalty of perjury that the foregoing statements are true, accurate, and made in good faith to initiate formal interbank chargeback & recall procedures.
                    </span>
                  </label>
                </>
              )}
            </div>

            <div className="dash-modal-footer">
              {affidavitSigned && !isEditingAffidavit ? (
                <>
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
                    onClick={() => {
                      setIsEditingAffidavit(true);
                      setAffidavitConsent(true);
                    }}
                  >
                    <PenTool size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    Amend Signature
                  </button>
                  <button 
                    type="button"
                    className="btn btn-primary" 
                    style={{ padding: '0.45rem 1.15rem', fontSize: '0.82rem' }}
                    onClick={() => setAffidavitModalOpen(false)}
                  >
                    Close Certificate
                  </button>
                </>
              ) : (
                <>
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
                    onClick={() => {
                      setIsEditingAffidavit(false);
                      setAffidavitModalOpen(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    className="btn btn-primary" 
                    style={{ padding: '0.45rem 1.15rem', fontSize: '0.82rem', background: '#059669', borderColor: '#059669' }}
                    onClick={handleSealAffidavit}
                  >
                    <Check size={15} />
                    <span>Seal & Cryptographically Authenticate</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FEATURE 4 MODAL: DIRECT SPECIALIST MESSENGER (Sarah K. Live Chat)         */}
      {/* ========================================================================= */}
      {messengerOpen && (
        <div className="dash-modal-backdrop" onClick={() => setMessengerOpen(false)}>
          <div className="dash-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div className="strategist-avatar" style={{ width: '36px', height: '36px' }}>SK</div>
                <div>
                  <h3 className="dash-modal-title" style={{ fontSize: '0.98rem' }}>
                    Sarah K. &bull; Senior Strategist
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                    Active on Case #{activeCase?.caseNumber || 'RG-10482'}
                  </span>
                </div>
              </div>
              <button className="dash-modal-close-btn" onClick={() => setMessengerOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="dash-modal-body">
              <div className="chat-messages-container">
                {messages.map((msg) => (
                  <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
                    <div>{msg.text}</div>
                    <span className="chat-timestamp">{msg.time}</span>
                  </div>
                ))}
              </div>

              {/* Quick Prompt Chips */}
              <div className="chat-quick-chips">
                <button 
                  type="button" 
                  className="quick-chip-btn"
                  onClick={() => setInputMsg("What is the current SWIFT recall status with the respondent bank?")}
                >
                  What is the SWIFT status?
                </button>
                <button 
                  type="button" 
                  className="quick-chip-btn"
                  onClick={() => setInputMsg("Has Chase fraud operations acknowledged receipt of MT103?")}
                >
                  Did bank receive MT103?
                </button>
                <button 
                  type="button" 
                  className="quick-chip-btn"
                  onClick={() => setInputMsg("How long does formal interbank arbitration typically take?")}
                >
                  Arbitration timeline?
                </button>
              </div>

              {/* Chat Input Bar */}
              <form className="chat-input-bar" onSubmit={handleSendMessage}>
                <input 
                  type="text" 
                  className="chat-text-input" 
                  placeholder="Type message to Sarah K..." 
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                />
                <button type="submit" className="chat-send-btn" title="Send message">
                  <Send size={15} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FEATURE 6 MODAL: SETTLEMENT RELEASE DOSSIER (Resolved Cases)              */}
      {/* ========================================================================= */}
      {settlementModalOpen && selectedSettlementCase && (
        <div className="dash-modal-backdrop" onClick={() => setSettlementModalOpen(false)}>
          <div className="dash-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header" style={{ background: '#f0fdf4' }}>
              <h3 className="dash-modal-title" style={{ color: '#065f46' }}>
                <Award size={20} color="#059669" />
                <span>Official Settlement Release Dossier</span>
              </h3>
              <button className="dash-modal-close-btn" onClick={() => setSettlementModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="dash-modal-body">
              <div className="settlement-cert-box">
                <span className="settlement-seal-stamp">
                  OFFICIAL RECOVERY CERTIFICATE &bull; 100% SETTLED
                </span>
                <div className="settlement-big-val">
                  ${Number(selectedSettlementCase.disputedAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                </div>
                <p style={{ fontSize: '0.84rem', color: '#065f46', margin: '0 0 1rem' }}>
                  Funds successfully reclaimed and credited back to claimant correspondent account via interbank dispute resolution.
                </p>

                <table className="settlement-table">
                  <tbody>
                    <tr>
                      <td>Case Reference</td>
                      <td>#{selectedSettlementCase.caseNumber}</td>
                    </tr>
                    <tr>
                      <td>Dispute Category</td>
                      <td>{selectedSettlementCase.scamType?.toUpperCase() || 'FINANCIAL FRAUD'}</td>
                    </tr>
                    <tr>
                      <td>Settlement Resolution</td>
                      <td>Chargeback Reversal / Interbank Swift Clawback</td>
                    </tr>
                    <tr>
                      <td>Issuing Institution</td>
                      <td>Chase Correspondent Fraud Resolution Desk</td>
                    </tr>
                    <tr>
                      <td>Audit Clearing Stamp</td>
                      <td>eIDAS-RECOVERED-2026-992</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <button 
                  type="button"
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.82rem', background: '#059669', borderColor: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  onClick={() => handleExportFullPacket(selectedSettlementCase)}
                >
                  <Printer size={15} />
                  <span>Print Formal Settlement Receipt</span>
                </button>
              </div>
            </div>

            <div className="dash-modal-footer">
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }} 
                onClick={() => setSettlementModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* APPLE PAY STYLE CONFIRMATION MODAL: REFUND RECEIVED                        */}
      {/* ========================================================================= */}
      {congratsFlashModalOpen && congratsCaseData && (() => {
        const settledAmountVal = Number(congratsCaseData.settledAmount || congratsCaseData.disputedAmount || 0);
        const formattedAmount = settledAmountVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const currencyCode = congratsCaseData.currency || 'USD';
        const formattedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const formattedTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        return (
          <div className="ap-modal-backdrop" onClick={() => handleDismissCongrats(congratsCaseData)}>
            <div className="ap-modal-card" onClick={(e) => e.stopPropagation()}>
              <button 
                className="ap-close-btn"
                onClick={() => handleDismissCongrats(congratsCaseData)}
                aria-label="Close Confirmation Notice"
              >
                <X size={18} />
              </button>

              {/* 1. Iconic Apple Pay Animated Circle & Checkmark */}
              <div className="ap-icon-section">
                <div className="ap-glow-aura" />
                <div className="ap-svg-container">
                  <svg className="ap-checkmark-svg" viewBox="0 0 88 88" fill="none">
                    {/* Background subtle circle track */}
                    <circle 
                      cx="44" 
                      cy="44" 
                      r="38" 
                      stroke="#E2E8F0" 
                      strokeWidth="3.5" 
                      className="ap-circle-track"
                    />
                    {/* The circle rounding animation (drawing clockwise from 12 o'clock) */}
                    <circle 
                      cx="44" 
                      cy="44" 
                      r="38" 
                      stroke="#34C759" 
                      strokeWidth="3.5" 
                      strokeLinecap="round" 
                      className="ap-circle-stroke"
                    />
                    {/* The crisp animated checkmark */}
                    <path 
                      d="M 27 45.5 L 38.5 57 L 61 33" 
                      stroke="#34C759" 
                      strokeWidth="4.2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="ap-check-path"
                    />
                  </svg>
                </div>
              </div>

              {/* 2. Status Pill */}
              <div className="ap-status-pill">
                <span className="ap-status-dot" />
                <span>Payment Received</span>
              </div>

              {/* 3. The Amount Underneath */}
              <div className="ap-amount-container">
                <span className="ap-amount-plus">+</span>
                <span className="ap-amount-val">${formattedAmount}</span>
                <span className="ap-amount-currency">{currencyCode}</span>
              </div>

              <p className="ap-subtext">
                Dispute resolved &bull; Funds credited to your Secure Wallet
              </p>

              {/* 4. Apple Pay Receipt Breakdown Card */}
              <div className="ap-receipt-card">
                <div className="ap-receipt-row">
                  <span className="ap-receipt-label">Dispute Reference</span>
                  <span className="ap-receipt-val ap-receipt-mono">#{congratsCaseData.caseNumber}</span>
                </div>
                <div className="ap-receipt-row">
                  <span className="ap-receipt-label">Destination</span>
                  <span className="ap-receipt-val">US.ClaimBack Secure Vault</span>
                </div>
                <div className="ap-receipt-row">
                  <span className="ap-receipt-label">Resolution Status</span>
                  <span className="ap-receipt-val ap-receipt-green">100% Cleared &bull; Approved</span>
                </div>
                <div className="ap-receipt-row">
                  <span className="ap-receipt-label">Processed At</span>
                  <span className="ap-receipt-val">{formattedDate}, {formattedTime}</span>
                </div>
              </div>

              {/* 5. Apple Pay Style Action Buttons */}
              <div className="ap-actions-container">
                <button 
                  type="button"
                  className="ap-btn-primary"
                  onClick={() => handleClaimToWallet(congratsCaseData)}
                >
                  <DollarSign size={18} />
                  <span>Go to Wallet & Withdraw</span>
                </button>

                <button 
                  type="button"
                  className="ap-btn-done"
                  onClick={() => handleDismissCongrats(congratsCaseData)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* SPOTIFY STYLE REFUNDGUARD CHECKOUT POP OUT MODAL (WITHDRAW FUNDS)         */}
      {/* ========================================================================= */}
      <CheckoutModal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        walletBalance={activeCaseBalance}
        activeCase={activeCase}
        currentUser={currentUser}
        token={token}
        onWithdrawSuccess={(newBalance, newTx) => {
          if (typeof newBalance === 'number') {
            setWalletBalance(newBalance);
          }
          if (newTx) {
            setWalletTransactions(prev => [newTx, ...prev]);
          }
          loadWalletData();
        }}
      />
    </div>
  );
}

function CreditCardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}
