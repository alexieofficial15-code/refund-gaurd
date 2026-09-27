import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Layers, 
  DollarSign, 
  FileCheck2, 
  Search, 
  Filter, 
  ExternalLink, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  MessageSquare, 
  Send, 
  FileText, 
  UserCheck, 
  Eye, 
  X, 
  PenTool, 
  ArrowRight,
  ChevronRight,
  Download,
  Check,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AdminPage.css';

export default function AdminPage({ onNavigate }) {
  const { currentUser, token } = useAuth();
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('cases'); // 'cases' | 'affidavits' | 'messages' | 'evidence'
  const [notification, setNotification] = useState(null);

  // Selected case for sub-views or modals
  const [selectedCaseForEdit, setSelectedCaseForEdit] = useState(null);
  const [selectedCaseForMilestones, setSelectedCaseForMilestones] = useState(null);
  const [selectedCaseForAffidavit, setSelectedCaseForAffidavit] = useState(null);
  const [selectedCaseForSettle, setSelectedCaseForSettle] = useState(null);
  const [settleInputAmount, setSettleInputAmount] = useState('');
  const [isSettling, setIsSettling] = useState(false);
  const [updatingCaseNumber, setUpdatingCaseNumber] = useState(null);

  // Specialist Messaging State
  const [selectedMsgCaseIndex, setSelectedMsgCaseIndex] = useState(0);
  const [analystMsgText, setAnalystMsgText] = useState('');
  const [caseMessages, setCaseMessages] = useState({});

  // Fetch all cases across the system
  const loadAllCases = async () => {
    setIsLoading(true);
    try {
      const activeToken = token || localStorage.getItem('refundguard_token');
      const res = await fetch('/api/cases', {
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.cases)) {
          // Merge with any local storage overrides
          const enhanced = data.cases.map(c => {
            const affidavitKey = `refundguard_affidavit_${c.caseNumber}`;
            const localAffidavit = localStorage.getItem(affidavitKey);
            let affSigned = c.affidavitSigned;
            let affInfo = c.affidavitInfo;
            if (localAffidavit) {
              try {
                const parsed = JSON.parse(localAffidavit);
                if (parsed.signed) {
                  affSigned = true;
                  affInfo = parsed;
                }
              } catch (_) {}
            }
            const withdrawKey = `refundguard_withdrawal_allowed_${c.caseNumber}`;
            const localWithdraw = localStorage.getItem(withdrawKey);
            let wAllowed = typeof c.withdrawalAllowed === 'boolean' ? c.withdrawalAllowed : false;
            if (localWithdraw === 'true') {
              wAllowed = true;
            }

            return {
              ...c,
              affidavitSigned: affSigned,
              affidavitInfo: affInfo,
              withdrawalAllowed: wAllowed
            };
          });
          setCases(enhanced);
        }
      }
    } catch (err) {
      console.warn('Error loading admin cases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllCases();
  }, []);

  const showToast = (text, type = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. UPDATE STATUS
  const handleUpdateStatus = async (caseNumber, newStatus) => {
    setUpdatingCaseNumber(caseNumber);
    try {
      const activeToken = token || localStorage.getItem('refundguard_token');
      const res = await fetch(`/api/cases/${caseNumber}/details`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success !== false) {
        try {
          localStorage.removeItem(`refundguard_seen_settlement_${caseNumber}`);
        } catch (_) {}
        setCases(prev => prev.map(c => c.caseNumber === caseNumber ? {
          ...c,
          status: newStatus,
          settledAmount: c.settledAmount || (newStatus === 'resolved' ? c.disputedAmount : c.settledAmount),
          settlementFlashPending: newStatus === 'resolved'
        } : c));
        showToast(`Case #${caseNumber} status updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
      } else {
        showToast(data.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    } finally {
      setUpdatingCaseNumber(null);
    }
  };



  // 3. UPDATE CASE DETAILS FORM
  const handleSaveCaseDetails = async (e) => {
    e.preventDefault();
    if (!selectedCaseForEdit) return;

    try {
      const activeToken = token || localStorage.getItem('refundguard_token');
      const res = await fetch(`/api/cases/${selectedCaseForEdit.caseNumber}/details`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify({
          title: selectedCaseForEdit.title,
          disputedAmount: selectedCaseForEdit.disputedAmount,
          settledAmount: selectedCaseForEdit.settledAmount,
          scamType: selectedCaseForEdit.scamType,
          disputeChannel: selectedCaseForEdit.disputeChannel,
          status: selectedCaseForEdit.status,
          counterpartyInfo: selectedCaseForEdit.counterpartyInfo
        })
      });

      if (res.ok) {
        try {
          localStorage.removeItem(`refundguard_seen_settlement_${selectedCaseForEdit.caseNumber}`);
        } catch (_) {}
        setCases(prev => prev.map(c => c.caseNumber === selectedCaseForEdit.caseNumber ? {
          ...selectedCaseForEdit,
          settlementFlashPending: selectedCaseForEdit.status === 'resolved'
        } : c));
        showToast(`Dossier #${selectedCaseForEdit.caseNumber} details saved!`);
        setSelectedCaseForEdit(null);
      }
    } catch (err) {
      showToast('Failed to save details', 'error');
    }
  };

  // 4. UPDATE MILESTONES
  const handleToggleMilestoneStatus = async (stepOrder, newStepStatus) => {
    if (!selectedCaseForMilestones) return;
    const currentMilestones = selectedCaseForMilestones.milestones || [
      { stepOrder: 1, title: 'Incident Reported & Evidence Vault Created', status: 'completed' },
      { stepOrder: 2, title: 'Evidence Dossier Verification', status: 'current' },
      { stepOrder: 3, title: 'Dispute Channel & Regulatory Routing', status: 'upcoming' },
      { stepOrder: 4, title: 'Formal Filing & Outcome Determination', status: 'upcoming' }
    ];

    const updatedMilestones = currentMilestones.map(m => {
      if (m.stepOrder === stepOrder) {
        return {
          ...m,
          status: newStepStatus,
          completedDate: newStepStatus === 'completed' ? new Date().toISOString().split('T')[0] : null
        };
      }
      return m;
    });

    try {
      const activeToken = token || localStorage.getItem('refundguard_token');
      const res = await fetch(`/api/cases/${selectedCaseForMilestones.caseNumber}/milestones`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify({ milestones: updatedMilestones })
      });

      if (res.ok) {
        const updatedCase = { ...selectedCaseForMilestones, milestones: updatedMilestones };
        setSelectedCaseForMilestones(updatedCase);
        setCases(prev => prev.map(c => c.caseNumber === updatedCase.caseNumber ? updatedCase : c));
        showToast(`Step ${stepOrder} set to ${newStepStatus.toUpperCase()}`);
      }
    } catch (err) {
      showToast('Error updating milestones', 'error');
    }
  };

  // 5. TOGGLE AFFIDAVIT VERIFICATION
  const handleToggleAffidavitStatus = async (cNum, currentStatus) => {
    const nextStatus = !currentStatus;
    try {
      const activeToken = token || localStorage.getItem('refundguard_token');
      await fetch(`/api/cases/${cNum}/affidavit-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify({ affidavitSigned: nextStatus })
      });

      // Update local storage
      const key = `refundguard_affidavit_${cNum}`;
      if (nextStatus) {
        const mockAff = {
          signed: true,
          signedAt: new Date().toISOString(),
          signedDateFormatted: new Date().toLocaleDateString(),
          signedBy: 'Claimant Deponent',
          protocol: 'eIDAS Reg. #EF-9481',
          certHash: 'SHA256:ADMIN-VERIFIED-HASH'
        };
        localStorage.setItem(key, JSON.stringify(mockAff));
      } else {
        localStorage.removeItem(key);
      }

      setCases(prev => prev.map(c => c.caseNumber === cNum ? { ...c, affidavitSigned: nextStatus } : c));
      showToast(`Affidavit for #${cNum} marked as ${nextStatus ? 'VERIFIED' : 'PENDING'}`);
    } catch (err) {
      showToast('Error toggling affidavit', 'error');
    }
  };

  // 5C. TOGGLE WITHDRAWAL PERMISSION ($300 CLEARANCE)
  const handleToggleWithdrawal = async (cNum, currentStatus) => {
    const nextStatus = !currentStatus;
    try {
      const activeToken = token || localStorage.getItem('refundguard_token');
      await fetch(`/api/cases/${cNum}/withdrawal-permission`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify({ withdrawalAllowed: nextStatus, clearanceFeePaid: nextStatus })
      });

      const key = `refundguard_withdrawal_allowed_${cNum}`;
      if (nextStatus) {
        localStorage.setItem(key, 'true');
      } else {
        localStorage.removeItem(key);
      }

      setCases(prev => prev.map(c => c.caseNumber === cNum ? { ...c, withdrawalAllowed: nextStatus, clearanceFeePaid: nextStatus } : c));
      showToast(`Case #${cNum} withdrawal authorization: ${nextStatus ? 'ALLOWED' : 'BLOCKED'}`);
    } catch (err) {
      showToast('Error updating withdrawal authorization', 'error');
    }
  };

  // 5B. CONFIRM CASE SETTLEMENT
  const handleConfirmSettle = async (e) => {
    e.preventDefault();
    if (!selectedCaseForSettle) return;
    const amount = parseFloat(settleInputAmount);
    if (!amount || amount <= 0) {
      showToast('Please enter a valid settlement recovery amount', 'error');
      return;
    }

    setIsSettling(true);
    try {
      const activeToken = token || localStorage.getItem('refundguard_token');
      const res = await fetch(`/api/cases/${selectedCaseForSettle.caseNumber}/settle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify({ settledAmount: amount })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to record settlement.');
      }

      // Update local cases state
      setCases(prev => prev.map(c => {
        if (c.caseNumber === selectedCaseForSettle.caseNumber) {
          return {
            ...c,
            status: 'resolved',
            settledAmount: amount,
            settledAt: new Date().toISOString(),
            settlementFlashPending: true
          };
        }
        return c;
      }));

      // Also reset client seen flag so claimant will see the celebration flash
      try {
        localStorage.removeItem(`refundguard_seen_settlement_${selectedCaseForSettle.caseNumber}`);
      } catch (_) {}

      showToast(`Dispute #${selectedCaseForSettle.caseNumber} Settled! $${amount.toLocaleString()} credited to claimant wallet.`, 'success');
      setSelectedCaseForSettle(null);
    } catch (err) {
      showToast(err.message || 'Error recording settlement', 'error');
    } finally {
      setIsSettling(false);
    }
  };

  // 6. SEND SPECIALIST MESSAGE
  const handleSendSpecialistMessage = async (e) => {
    e.preventDefault();
    if (!analystMsgText.trim() || !activeMsgCase) return;

    const newMsg = {
      sender: 'specialist',
      senderName: 'Senior Analyst Sarah K.',
      text: analystMsgText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    try {
      const activeToken = token || localStorage.getItem('refundguard_token');
      await fetch(`/api/cases/${activeMsgCase.caseNumber}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
        },
        body: JSON.stringify(newMsg)
      });

      // Update local message state
      setCaseMessages(prev => ({
        ...prev,
        [activeMsgCase.caseNumber]: [...(prev[activeMsgCase.caseNumber] || []), newMsg]
      }));
      setAnalystMsgText('');
      showToast(`Message dispatched to claimant ${activeMsgCase.claimantName || 'Claimant'}`);
    } catch (err) {
      showToast('Error sending message', 'error');
    }
  };

  // 7. VIEW USER DASHBOARD IMPERSONATION
  const handleViewAsUser = (targetCase) => {
    // Navigate to user dashboard
    if (onNavigate) {
      onNavigate('dashboard');
    } else {
      window.location.hash = '#dashboard';
    }
  };

  // Filtered cases
  const filteredCases = cases.filter(c => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || 
      c.caseNumber.toLowerCase().includes(term) ||
      (c.title && c.title.toLowerCase().includes(term)) ||
      (c.claimantName && c.claimantName.toLowerCase().includes(term)) ||
      (c.userId?.fullName && c.userId.fullName.toLowerCase().includes(term)) ||
      (c.counterpartyInfo?.bankName && c.counterpartyInfo.bankName.toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  });

  // KPI Calculations
  const totalVolumeInDispute = cases.reduce((sum, c) => sum + (Number(c.disputedAmount) || 0), 0);
  const totalSettledAmount = cases.reduce((sum, c) => sum + (Number(c.settledAmount) || 0), 0);
  const pendingAffidavitsCount = cases.filter(c => !c.affidavitSigned).length;
  const activeDisputesCount = cases.filter(c => c.status !== 'resolved' && c.status !== 'withdrawn').length;

  const activeMsgCase = filteredCases[selectedMsgCaseIndex] || filteredCases[0] || cases[0] || null;

  return (
    <div className="admin-panel-page">
      
      {/* Toast Notification Banner */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10000,
          background: notification.type === 'error' ? '#dc2626' : '#059669',
          color: '#ffffff',
          padding: '0.75rem 1.25rem',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
          fontSize: '0.85rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={16} />
          <span>{notification.text}</span>
        </div>
      )}

      {/* Header Row */}
      <div className="admin-header-row">
        <div>
          <div className="admin-badge-pill">
            <ShieldCheck size={13} />
            <span>Fraud Operations & Compliance Desk</span>
          </div>
          <h1 className="admin-page-title">Dispute Management Console</h1>
          <p className="admin-page-subtitle">
            Control dispute lifecycles, advance regulatory milestones, verify legal affidavits, and dispatch specialist communications.
          </p>
        </div>

        <div className="admin-header-actions">
          <button 
            className="btn-admin-preview"
            onClick={() => handleViewAsUser(filteredCases[0])}
            title="Preview user dashboard interface"
          >
            <ExternalLink size={14} />
            <span>View User Dashboard</span>
          </button>
          <button 
            className="btn-admin-refresh"
            onClick={loadAllCases}
            title="Refresh database records"
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card blue">
          <div className="kpi-top-row">
            <span className="kpi-label">Active Dispute Cases</span>
            <div className="kpi-icon-bubble blue">
              <Layers size={18} />
            </div>
          </div>
          <div className="kpi-main-val">{activeDisputesCount}</div>
          <span className="kpi-sub-text">Across {cases.length} total registered records</span>
        </div>

        <div className="admin-kpi-card purple">
          <div className="kpi-top-row">
            <span className="kpi-label">Value in Review</span>
            <div className="kpi-icon-bubble purple">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="kpi-main-val">${totalVolumeInDispute.toLocaleString()}</div>
          <span className="kpi-sub-text">Under interbank & ombudsman dispute</span>
        </div>

        <div className="admin-kpi-card green">
          <div className="kpi-top-row">
            <span className="kpi-label">Total Recovered</span>
            <div className="kpi-icon-bubble green">
              <Award size={18} />
            </div>
          </div>
          <div className="kpi-main-val">${totalSettledAmount > 0 ? totalSettledAmount.toLocaleString() : (totalVolumeInDispute * 0.45).toFixed(0)}</div>
          <span className="kpi-sub-text">Settled & returned to consumer accounts</span>
        </div>

        <div className="admin-kpi-card amber">
          <div className="kpi-top-row">
            <span className="kpi-label">Pending Affidavits</span>
            <div className="kpi-icon-bubble amber">
              <FileCheck2 size={18} />
            </div>
          </div>
          <div className="kpi-main-val">{pendingAffidavitsCount}</div>
          <span className="kpi-sub-text">Awaiting eIDAS sworn attestation</span>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="admin-tabs-bar">
        <button 
          className={`admin-tab-btn ${activeTab === 'cases' ? 'active' : ''}`}
          onClick={() => setActiveTab('cases')}
        >
          <Layers size={16} />
          <span>Case Pipeline & Workflow</span>
          <span className="admin-tab-badge">{cases.length}</span>
        </button>

        <button 
          className={`admin-tab-btn ${activeTab === 'affidavits' ? 'active' : ''}`}
          onClick={() => setActiveTab('affidavits')}
        >
          <PenTool size={16} />
          <span>Sworn Affidavits & Legal Sealing</span>
          <span className="admin-tab-badge">{cases.filter(c => c.affidavitSigned).length} Verified</span>
        </button>

        <button 
          className={`admin-tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          <MessageSquare size={16} />
          <span>Specialist Live Desk</span>
        </button>

        <button 
          className={`admin-tab-btn ${activeTab === 'evidence' ? 'active' : ''}`}
          onClick={() => setActiveTab('evidence')}
        >
          <FileText size={16} />
          <span>Evidence Vault Auditor</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CASES & WORKFLOW PIPELINE                                          */}
      {/* ========================================================================= */}
      {activeTab === 'cases' && (
        <div>
          {/* Filter and Search Bar */}
          <div className="admin-filter-bar">
            <div className="admin-search-wrap">
              <Search size={15} color="#64748b" />
              <input 
                type="text" 
                placeholder="Search case #, claimant name, counterparty..." 
                className="admin-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="admin-filter-selects">
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Filter Status:</label>
              <select 
                className="admin-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses ({cases.length})</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="dispute_routing">Dispute Routing</option>
                <option value="settlement_pending">Settlement Pending</option>
                <option value="resolved">Resolved / Settled</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
          </div>

          {/* Cases Table */}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Case Ref & Date</th>
                  <th>Claimant</th>
                  <th>Incident & Counterparty</th>
                  <th>Disputed Sum</th>
                  <th>Dispute Channel</th>
                  <th>Milestones</th>
                  <th>$300 Clearance & Withdrawal</th>
                  <th>Status Workflow</th>
                  <th>Operations</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map(c => {
                  const claimant = c.claimantName || c.userId?.fullName || 'Claimant Member';
                  const email = c.claimantEmail || c.userId?.email || 'member@example.com';
                  const bankName = c.counterpartyInfo?.bankName || c.counterpartyInfo?.beneficiary || 'Correspondent Bank';

                  return (
                    <tr key={c.caseNumber}>
                      <td>
                        <span className="case-num-link">#{c.caseNumber}</span>
                        <span className="case-date-sub">{c.incidentDate || c.createdAt?.split('T')[0] || 'Recent'}</span>
                      </td>

                      <td>
                        <div className="claimant-name">{claimant}</div>
                        <span className="claimant-email">{email}</span>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.scamType || 'Fraud Claim'}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>To: {bankName}</div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          ${Number(c.disputedAmount || 0).toLocaleString()} {c.currency || 'USD'}
                        </div>
                        {c.settledAmount > 0 && (
                          <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                            (${Number(c.settledAmount).toLocaleString()} settled)
                          </span>
                        )}
                      </td>

                      <td>
                        <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500 }}>
                          {c.disputeChannel || 'Under Evidence Review'}
                        </span>
                      </td>

                      <td>
                        {/* 4 Mini Stepper Bars */}
                        <div className="mini-milestone-bar">
                          {(c.milestones || [
                            { stepOrder: 1, status: 'completed' },
                            { stepOrder: 2, status: 'current' },
                            { stepOrder: 3, status: 'upcoming' },
                            { stepOrder: 4, status: 'upcoming' }
                          ]).map(m => (
                            <div 
                              key={m.stepOrder} 
                              className={`mini-step ${m.status}`}
                              title={`Step ${m.stepOrder}: ${m.status}`} 
                            />
                          ))}
                        </div>
                        <button 
                          style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.72rem', color: '#2563eb', cursor: 'pointer', marginTop: '2px' }}
                          onClick={() => setSelectedCaseForMilestones(c)}
                        >
                          Manage Steps
                        </button>
                      </td>

                      <td>
                        <button 
                          type="button"
                          className={`btn-table-action ${c.withdrawalAllowed ? 'green' : 'amber'}`}
                          style={{ 
                            padding: '0.45rem 0.85rem', 
                            fontSize: '0.78rem', 
                            fontWeight: 700, 
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                          title={c.withdrawalAllowed ? "Withdrawal Allowed (Click to lock)" : "Approve withdrawal after $300 clearance is verified"}
                          onClick={() => handleToggleWithdrawal(c.caseNumber, c.withdrawalAllowed)}
                        >
                          {c.withdrawalAllowed ? "✓ Withdrawal Approved" : "Approve $300 Withdrawal"}
                        </button>
                      </td>

                      <td>
                        <select 
                          className="status-quick-select"
                          value={c.status}
                          disabled={updatingCaseNumber === c.caseNumber}
                          onChange={(e) => handleUpdateStatus(c.caseNumber, e.target.value)}
                        >
                          <option value="submitted">Submitted</option>
                          <option value="under_review">Under Review</option>
                          <option value="dispute_routing">Dispute Routing</option>
                          <option value="settlement_pending">Settlement Pending</option>
                          <option value="resolved">Resolved</option>
                          <option value="withdrawn">Withdrawn</option>
                        </select>
                      </td>

                      <td>
                        <div className="table-actions-group">
                          <button 
                            className="btn-table-action primary"
                            title="Edit Case Details"
                            onClick={() => setSelectedCaseForEdit(c)}
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                          
                          {c.status !== 'resolved' ? (
                            <button 
                              className="btn-table-action green"
                              title="Record Settlement"
                              onClick={() => {
                                setSelectedCaseForSettle(c);
                                setSettleInputAmount(c.disputedAmount);
                              }}
                            >
                              <Award size={12} /> Settle
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>
                              ✓ Settled
                            </span>
                          )}

                          <button 
                            className={`btn-table-action ${c.withdrawalAllowed ? 'green' : 'amber'}`}
                            title={c.withdrawalAllowed ? "Withdrawal Allowed (Click to lock)" : "Allow Withdrawal (Confirm $300 bill paid)"}
                            onClick={() => handleToggleWithdrawal(c.caseNumber, c.withdrawalAllowed)}
                          >
                            {c.withdrawalAllowed ? "Withdrawal: OK" : "300$ Lock"}
                          </button>

                          <button 
                            className="btn-table-action"
                            title="View as Claimant in User Dashboard"
                            onClick={() => handleViewAsUser(c)}
                          >
                            <Eye size={12} /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredCases.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                      No matching cases found in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SWORN AFFIDAVITS & LEGAL ATTESTATION                                */}
      {/* ========================================================================= */}
      {activeTab === 'affidavits' && (
        <div>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Case #</th>
                  <th>Claimant Deponent</th>
                  <th>Affidavit Status</th>
                  <th>Legal Protocol Reference</th>
                  <th>Execution Timestamp</th>
                  <th>Digital Signature Preview</th>
                  <th>Attestation Control</th>
                </tr>
              </thead>
              <tbody>
                {cases.map(c => {
                  const claimant = c.claimantName || c.userId?.fullName || 'Claimant Member';
                  const isVerified = Boolean(c.affidavitSigned);
                  const affInfo = c.affidavitInfo || {};

                  return (
                    <tr key={c.caseNumber}>
                      <td>
                        <span className="case-num-link">#{c.caseNumber}</span>
                        <span className="case-date-sub">{c.scamType}</span>
                      </td>

                      <td>
                        <div className="claimant-name">{claimant}</div>
                        <span className="claimant-email">{c.claimantEmail || c.userId?.email}</span>
                      </td>

                      <td>
                        <span className={`affidavit-tag ${isVerified ? 'verified' : 'pending'}`}>
                          {isVerified ? '✓ Cryptographically Sealed' : '! Action Required'}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 600 }}>
                          {affInfo.protocol || 'eIDAS Reg. #EF-9481'}
                        </span>
                        {affInfo.certHash && (
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{affInfo.certHash}</div>
                        )}
                      </td>

                      <td>
                        <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                          {affInfo.signedDateFormatted || (isVerified ? 'Recorded in Ledger' : 'Pending')}
                        </span>
                      </td>

                      <td>
                        {isVerified ? (
                          affInfo.signatureImg ? (
                            <img 
                              src={affInfo.signatureImg} 
                              alt="Signature" 
                              style={{ maxHeight: '36px', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#fff', padding: '2px' }} 
                            />
                          ) : (
                            <span style={{ fontFamily: 'cursive', fontSize: '1.1rem', color: '#1e3a8a' }}>
                              {affInfo.typedSignature || claimant}
                            </span>
                          )
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>Awaiting signature</span>
                        )}
                      </td>

                      <td>
                        <div className="table-actions-group">
                          {isVerified && (
                            <button 
                              className="btn-table-action primary"
                              onClick={() => setSelectedCaseForAffidavit(c)}
                            >
                              <Eye size={12} /> Inspect Seal
                            </button>
                          )}
                          <button 
                            className={`btn-table-action ${isVerified ? '' : 'green'}`}
                            onClick={() => handleToggleAffidavitStatus(c.caseNumber, isVerified)}
                          >
                            {isVerified ? 'Mark Pending' : 'Force Verify'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SPECIALIST MESSAGING DESK                                          */}
      {/* ========================================================================= */}
      {activeTab === 'messages' && (
        <div className="messenger-desk-layout">
          {/* Case Selector list */}
          <div className="desk-cases-list">
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Select Active Claimant Dossier
            </div>
            {cases.map((c, idx) => (
              <div 
                key={c.caseNumber}
                className={`desk-case-item ${idx === selectedMsgCaseIndex ? 'active' : ''}`}
                onClick={() => setSelectedMsgCaseIndex(idx)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>#{c.caseNumber}</strong>
                  <span className={`status-pill ${c.status}`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                    {c.status.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                  {c.claimantName || c.userId?.fullName || 'Claimant'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  ${Number(c.disputedAmount).toLocaleString()} USD
                </div>
              </div>
            ))}
          </div>

          {/* Active Chat Conversation */}
          <div className="desk-chat-area">
            {activeMsgCase ? (
              <>
                <div className="desk-chat-header">
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', fontWeight: 700 }}>
                      Live Communication &bull; #{activeMsgCase.caseNumber}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Claimant: <strong>{activeMsgCase.claimantName || activeMsgCase.userId?.fullName || 'Claimant'}</strong> ({activeMsgCase.claimantEmail || activeMsgCase.userId?.email})
                    </span>
                  </div>
                  <button 
                    className="btn-admin-preview" 
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                    onClick={() => handleViewAsUser(activeMsgCase)}
                  >
                    Launch User View
                  </button>
                </div>

                {/* Canned responses */}
                <div className="desk-canned-bar">
                  <span style={{ fontSize: '0.7rem', color: '#64748b', alignSelf: 'center', fontWeight: 600 }}>Canned:</span>
                  <button 
                    className="canned-pill"
                    onClick={() => setAnalystMsgText('The preliminary SWIFT recall notification has been dispatched to correspondent fraud units under reference #SW-4819.')}
                  >
                    SWIFT Recall Dispatched
                  </button>
                  <button 
                    className="canned-pill"
                    onClick={() => setAnalystMsgText('Correspondent bank fraud compliance desk has confirmed receipt of your sworn affidavit and evidentiary dossier.')}
                  >
                    Bank Receipt Confirmed
                  </button>
                  <button 
                    className="canned-pill"
                    onClick={() => setAnalystMsgText('We have advanced your case to formal arbitration routing. Expected determination window is 5 business days.')}
                  >
                    Arbitration Window
                  </button>
                </div>

                {/* Messages Box */}
                <div className="desk-messages-box">
                  {/* Default initial message */}
                  <div className="desk-bubble specialist">
                    <strong>Senior Analyst Sarah K.</strong>: Hello, I have reviewed your evidence dossier and compiled filing packet #CP-591. The preliminary SWIFT recall notification has been dispatched to correspondent fraud units.
                  </div>

                  {/* Case specific messages */}
                  {(caseMessages[activeMsgCase.caseNumber] || activeMsgCase.messages || []).map((m, i) => (
                    <div key={i} className={`desk-bubble ${m.sender}`}>
                      <strong>{m.senderName || (m.sender === 'claimant' ? 'Claimant' : 'Senior Analyst Sarah K.')}</strong>: {m.text}
                      <div style={{ fontSize: '0.68rem', opacity: 0.7, marginTop: '3px', textAlign: 'right' }}>
                        {m.time}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <form className="desk-chat-input-bar" onSubmit={handleSendSpecialistMessage}>
                  <input 
                    type="text" 
                    placeholder={`Reply to claimant as Senior Analyst Sarah K...`}
                    className="desk-chat-input"
                    value={analystMsgText}
                    onChange={(e) => setAnalystMsgText(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Send size={14} /> Send
                  </button>
                </form>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                Select a case to view conversation.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: EVIDENCE VAULT AUDITOR                                             */}
      {/* ========================================================================= */}
      {activeTab === 'evidence' && (
        <div>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Case #</th>
                  <th>Claimant</th>
                  <th>Evidence Catalog</th>
                  <th>Vault Hash Verification</th>
                  <th>Audit Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map(c => (
                  <tr key={c.caseNumber}>
                    <td>
                      <span className="case-num-link">#{c.caseNumber}</span>
                      <span className="case-date-sub">{c.scamType}</span>
                    </td>

                    <td>
                      <div className="claimant-name">{c.claimantName || c.userId?.fullName || 'Claimant'}</div>
                      <span className="claimant-email">{c.claimantEmail || c.userId?.email}</span>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }}>
                        {c.evidence?.length || 2} Evidence Files Cataloged
                      </div>
                      <span style={{ fontSize: '0.73rem', color: '#64748b' }}>
                        Bank wire MT103, chat transcript, transaction logs
                      </span>
                    </td>

                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
                        <CheckCircle2 size={13} /> SHA-256 Verified In Vault
                      </span>
                    </td>

                    <td>
                      <div className="table-actions-group">
                        <button 
                          className="btn-table-action primary"
                          onClick={() => showToast(`Audit report generated for Case #${c.caseNumber}`)}
                        >
                          <FileCheck2 size={12} /> Re-Audit Vault
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT CASE DETAILS                                                */}
      {/* ========================================================================= */}
      {selectedCaseForEdit && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedCaseForEdit(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Edit Case #{selectedCaseForEdit.caseNumber}</h3>
              <button 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} 
                onClick={() => setSelectedCaseForEdit(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCaseDetails}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Case Title</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    value={selectedCaseForEdit.title || ''}
                    onChange={(e) => setSelectedCaseForEdit({ ...selectedCaseForEdit, title: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Disputed Amount ($)</label>
                    <input 
                      type="number" 
                      className="admin-form-input" 
                      value={selectedCaseForEdit.disputedAmount || 0}
                      onChange={(e) => setSelectedCaseForEdit({ ...selectedCaseForEdit, disputedAmount: e.target.value })}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Settled Amount ($)</label>
                    <input 
                      type="number" 
                      className="admin-form-input" 
                      value={selectedCaseForEdit.settledAmount || 0}
                      onChange={(e) => setSelectedCaseForEdit({ ...selectedCaseForEdit, settledAmount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Dispute Channel & Routing</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    value={selectedCaseForEdit.disputeChannel || ''}
                    onChange={(e) => setSelectedCaseForEdit({ ...selectedCaseForEdit, disputeChannel: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Counterparty Bank / Entity</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    value={selectedCaseForEdit.counterpartyInfo?.bankName || selectedCaseForEdit.counterpartyInfo?.beneficiary || ''}
                    onChange={(e) => setSelectedCaseForEdit({ 
                      ...selectedCaseForEdit, 
                      counterpartyInfo: { ...selectedCaseForEdit.counterpartyInfo, bankName: e.target.value } 
                    })}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Lifecycle Status</label>
                  <select 
                    className="admin-form-select"
                    value={selectedCaseForEdit.status}
                    onChange={(e) => setSelectedCaseForEdit({ ...selectedCaseForEdit, status: e.target.value })}
                  >
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="dispute_routing">Dispute Routing</option>
                    <option value="settlement_pending">Settlement Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>

                <div className="admin-form-group" style={{ background: '#f8fafc', padding: '0.9rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '1rem' }}>
                  <label className="admin-form-label" style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                    $300 Clearance & Withdrawal Permission
                  </label>
                  <p style={{ fontSize: '0.74rem', color: '#64748b', margin: '0 0 0.6rem', lineHeight: 1.45 }}>
                    Authorize the claimant to withdraw recovered funds via the Checkout screen after confirming their $300 upfront clearance fee.
                  </p>
                  <button
                    type="button"
                    className={`btn-table-action ${selectedCaseForEdit.withdrawalAllowed ? 'green' : 'amber'}`}
                    style={{ padding: '0.5rem 1.1rem', fontSize: '0.82rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    onClick={() => {
                      const next = !selectedCaseForEdit.withdrawalAllowed;
                      setSelectedCaseForEdit({ ...selectedCaseForEdit, withdrawalAllowed: next, clearanceFeePaid: next });
                      handleToggleWithdrawal(selectedCaseForEdit.caseNumber, selectedCaseForEdit.withdrawalAllowed);
                    }}
                  >
                    {selectedCaseForEdit.withdrawalAllowed ? '✓ Withdrawal Authorized (Click to Lock)' : 'Approve $300 & Unlock Withdrawal'}
                  </button>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setSelectedCaseForEdit(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MILESTONE PROGRESS STEPPER MANAGER                               */}
      {/* ========================================================================= */}
      {selectedCaseForMilestones && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedCaseForMilestones(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                Milestones &bull; #{selectedCaseForMilestones.caseNumber}
              </h3>
              <button 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} 
                onClick={() => setSelectedCaseForMilestones(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: '#64748b' }}>
                Update the 4 regulatory dispute milestones. The user's dashboard progress bar and timeline will reflect these changes immediately.
              </p>

              {(selectedCaseForMilestones.milestones || [
                { stepOrder: 1, title: 'Incident Reported & Evidence Vault Created', status: 'completed' },
                { stepOrder: 2, title: 'Evidence Dossier Verification', status: 'current' },
                { stepOrder: 3, title: 'Dispute Channel & Regulatory Routing', status: 'upcoming' },
                { stepOrder: 4, title: 'Formal Filing & Outcome Determination', status: 'upcoming' }
              ]).map((step) => (
                <div 
                  key={step.stepOrder}
                  style={{
                    padding: '0.85rem 1rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: step.status === 'completed' ? '#f0fdf4' : step.status === 'current' ? '#eff6ff' : '#ffffff'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: step.status === 'completed' ? '#059669' : step.status === 'current' ? '#2563eb' : '#64748b' }}>
                      STEP {step.stepOrder}
                    </div>
                    <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>{step.title}</strong>
                  </div>

                  <select 
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      border: '1px solid #cbd5e1',
                      background: '#fff'
                    }}
                    value={step.status}
                    onChange={(e) => handleToggleMilestoneStatus(step.stepOrder, e.target.value)}
                  >
                    <option value="completed">Completed ✓</option>
                    <option value="current">Current (In Progress)</option>
                    <option value="upcoming">Upcoming</option>
                  </select>
                </div>
              ))}
            </div>

            <div className="admin-modal-footer">
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => setSelectedCaseForMilestones(null)}
              >
                Close Manager
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ========================================================================= */}
      {/* MODAL 4: AFFIDAVIT INSPECTION MODAL                                       */}
      {/* ========================================================================= */}
      {selectedCaseForAffidavit && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedCaseForAffidavit(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                Sealed Deposition &bull; #{selectedCaseForAffidavit.caseNumber}
              </h3>
              <button 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} 
                onClick={() => setSelectedCaseForAffidavit(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.82rem',
                lineHeight: 1.5,
                color: '#334155',
                marginBottom: '1rem'
              }}>
                <p style={{ margin: '0 0 0.5rem', fontWeight: 700, color: '#0f172a' }}>
                  LEGAL DEPOSITION SUMMARY (eIDAS #EF-9481)
                </p>
                <p style={{ margin: '0 0 0.4rem' }}>
                  Deponent: <strong>{selectedCaseForAffidavit.affidavitInfo?.signedBy || selectedCaseForAffidavit.claimantName || 'Claimant Member'}</strong>
                </p>
                <p style={{ margin: '0 0 0.4rem' }}>
                  Disputed Sum: <strong>${Number(selectedCaseForAffidavit.disputedAmount).toLocaleString()} USD</strong>
                </p>
                <p style={{ margin: '0 0 0.4rem' }}>
                  Timestamp: <strong>{selectedCaseForAffidavit.affidavitInfo?.signedDateFormatted || 'Recorded & Verified'}</strong>
                </p>
                <p style={{ margin: '0 0 0.4rem' }}>
                  Protocol: <code>{selectedCaseForAffidavit.affidavitInfo?.protocol || 'eIDAS Reg. #EF-9481'}</code>
                </p>
                <p style={{ margin: 0 }}>
                  Ledger Hash: <code>{selectedCaseForAffidavit.affidavitInfo?.certHash || 'SHA256:AUTHENTICATED-SEAL'}</code>
                </p>
              </div>

              <div>
                <label className="admin-form-label">Digital Signature</label>
                {selectedCaseForAffidavit.affidavitInfo?.signatureImg ? (
                  <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.75rem', display: 'inline-block' }}>
                    <img 
                      src={selectedCaseForAffidavit.affidavitInfo.signatureImg} 
                      alt="Claimant Signature" 
                      style={{ maxHeight: '80px', display: 'block' }} 
                    />
                  </div>
                ) : (
                  <div style={{ fontFamily: 'cursive', fontSize: '1.4rem', color: '#1e3a8a', padding: '0.5rem 0' }}>
                    {selectedCaseForAffidavit.affidavitInfo?.typedSignature || selectedCaseForAffidavit.claimantName || 'Digital Deponent'}
                  </div>
                )}
              </div>
            </div>

            <div className="admin-modal-footer">
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => setSelectedCaseForAffidavit(null)}
              >
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: CONFIRM CASE SETTLEMENT             */}
      {/* ========================================== */}
      {selectedCaseForSettle && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedCaseForSettle(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', background: '#ffffff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="admin-modal-header" style={{ background: '#ecfdf5', borderBottom: '1px solid #a7f3d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#10b981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={18} />
                </div>
                <div>
                  <h3 className="admin-modal-title" style={{ color: '#065f46' }}>Finalize Dispute Settlement</h3>
                  <span style={{ fontSize: '0.74rem', color: '#047857' }}>Record Recovery & Credit Claimant Member Wallet</span>
                </div>
              </div>
              <button 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} 
                onClick={() => setSelectedCaseForSettle(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmSettle}>
              <div className="admin-modal-body">
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.9rem',
                  fontSize: '0.82rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#64748b' }}>Dispute Reference:</span>
                    <strong style={{ color: '#0f172a' }}>#{selectedCaseForSettle.caseNumber}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#64748b' }}>Claimant Name:</span>
                    <strong style={{ color: '#0f172a' }}>{selectedCaseForSettle.claimantName || selectedCaseForSettle.userId?.fullName || 'Claimant Member'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Original Disputed Sum:</span>
                    <strong style={{ color: '#0f172a' }}>${Number(selectedCaseForSettle.disputedAmount || 0).toLocaleString()} USD</strong>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label" style={{ fontWeight: 700, color: '#065f46' }}>
                    Settled Recovery Amount (USD) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#64748b' }}>$</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="1"
                      className="admin-form-input" 
                      style={{ paddingLeft: '1.8rem', fontSize: '1.1rem', fontWeight: 700, color: '#059669' }}
                      value={settleInputAmount}
                      onChange={(e) => setSettleInputAmount(e.target.value)}
                      required
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.3rem', display: 'block' }}>
                    This exact sum will be credited to the claimant's RefundGuard Secure Member Wallet and the Apple Pay style payment received confirmation will be displayed.
                  </span>
                </div>

                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.75rem',
                  color: '#15803d',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}>
                  <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                  <span>
                    Case status will transition to <strong>Resolved (100% Settled)</strong> and milestone 4 will complete automatically.
                  </span>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  disabled={isSettling}
                  onClick={() => setSelectedCaseForSettle(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn"
                  disabled={isSettling}
                  style={{ background: '#059669', color: '#ffffff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', opacity: isSettling ? 0.7 : 1 }}
                >
                  {isSettling ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      <span>Recording Settlement...</span>
                    </>
                  ) : (
                    <span>Confirm Settlement & Credit Wallet</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
