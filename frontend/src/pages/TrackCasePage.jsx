import React, { useState } from 'react';
import { 
  Search, 
  Compass, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  ShieldAlert,
  Calendar,
  Layers,
  FileCheck
} from 'lucide-react';

export default function TrackCasePage({ onNavigate, initialCaseNumber = '' }) {
  const [caseNumber, setCaseNumber] = useState(initialCaseNumber || 'RG-10482');
  const [email, setEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-search if initialCaseNumber is provided
  React.useEffect(() => {
    if (initialCaseNumber) {
      setCaseNumber(initialCaseNumber);
      fetchCaseDetails(initialCaseNumber);
    }
  }, [initialCaseNumber]);

  const fetchCaseDetails = async (numberToQuery) => {
    if (!numberToQuery || !numberToQuery.trim()) return;

    setIsLoading(true);
    setErrorMessage('');
    setHasSearched(true);

    try {
      const formattedNumber = numberToQuery.trim().toUpperCase();
      const res = await fetch(`/api/cases/track/${formattedNumber}`);
      const data = await res.json();

      if (data.success && data.case) {
        setSearchResult(data.case);
      } else {
        setSearchResult(null);
        setErrorMessage(data.message || 'Case record not found in dispute database.');
      }
    } catch (err) {
      console.error('Tracking query error:', err);
      setSearchResult(null);
      setErrorMessage('Unable to connect to dispute tracking server. Please verify backend status.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    await fetchCaseDetails(caseNumber);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'submitted':
        return { bg: 'var(--bg-soft-blue)', color: 'var(--blue-accent)', border: 'var(--border-subtle)' };
      case 'under_review':
        return { bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' };
      case 'resolved':
        return { bg: 'var(--status-success-bg)', color: 'var(--status-success-text)', border: 'var(--status-success-border)' };
      default:
        return { bg: 'var(--bg-subtle)', color: 'var(--text-muted)', border: 'var(--border-subtle)' };
    }
  };

  return (
    <div style={{ padding: '3.5rem 0 5rem', minHeight: 'calc(100vh - 72px)', backgroundColor: 'var(--bg-subtle)' }}>
      <div className="container">
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div className="trust-badge-pill" style={{ marginBottom: '1rem' }}>
              <Compass size={15} />
              <span>Real-Time Case Intelligence</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--navy-primary)', marginBottom: '0.5rem' }}>
              Track Your Case Progress
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Enter your official US.ClaimBack case identifier to inspect live dispute milestones directly from our database.
            </p>
          </div>

          {/* Search Form Card */}
          <div className="card-clean" style={{ padding: '2rem', marginBottom: '2rem', backgroundColor: '#ffffff' }}>
            <form onSubmit={handleTrackSubmit}>
              <div className="form-group">
                <label className="form-label">Case Reference Number</label>
                <div className="form-input-wrapper">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. RG-10482 or RG-13438"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Associated Email Address (Optional for verification)</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '0.8rem' }}
                  disabled={isLoading}
                >
                  <Search size={16} />
                  <span>{isLoading ? 'Querying Database...' : 'Lookup Case Status'}</span>
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => { 
                    setCaseNumber('RG-10482'); 
                    setHasSearched(false);
                    setSearchResult(null);
                    setErrorMessage('');
                  }}
                >
                  Reset to Seed #RG-10482
                </button>
              </div>
            </form>
          </div>

          {/* Result Box */}
          {hasSearched && searchResult && (
            <div className="card-clean" style={{ padding: '2rem', backgroundColor: '#ffffff', borderTop: '4px solid var(--blue-accent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: 600 }}>Active Database Record</span>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--navy-primary)' }}>Case #{searchResult.caseNumber}</h3>
                </div>
                {(() => {
                  const style = getStatusBadgeClass(searchResult.status);
                  return (
                    <span className="trust-badge-pill" style={{ background: style.bg, color: style.color, borderColor: style.border }}>
                      {searchResult.status.replace('_', ' ').toUpperCase()}
                    </span>
                  );
                })()}
              </div>

              {/* Dispute Metadata */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Amount in Dispute</label>
                  <div style={{ fontWeight: 700, color: 'var(--navy-primary)' }}>
                    ${Number(searchResult.disputedAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {searchResult.currency}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Dispute Category</label>
                  <div style={{ fontWeight: 600, color: 'var(--navy-primary)' }}>{searchResult.scamType}</div>
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Incident Date</label>
                  <div style={{ fontWeight: 600, color: 'var(--navy-primary)' }}>{searchResult.incidentDate || 'Recorded'}</div>
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Dispute Channel</label>
                  <div style={{ fontWeight: 600, color: 'var(--navy-primary)' }}>{searchResult.disputeChannel || 'Under Evidence Review'}</div>
                </div>
              </div>

              {/* Case Title and Description */}
              <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-soft-blue)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.84rem' }}>
                <strong style={{ color: 'var(--navy-primary)' }}>Incident Scope: </strong>
                <span style={{ color: 'var(--text-muted)' }}>{searchResult.title} - {searchResult.description}</span>
              </div>

              {/* Milestones Progress Timeline from Database */}
              {searchResult.milestones && searchResult.milestones.length > 0 && (
                <div style={{ marginBottom: '1.75rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--navy-primary)', marginBottom: '1rem' }}>
                    Live Milestone Progression ({searchResult.milestones.length} Phases)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {searchResult.milestones.map((ms, idx) => {
                      const isCompleted = ms.status === 'completed';
                      const isCurrent = ms.status === 'current';
                      return (
                        <div 
                          key={ms.id || idx}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: isCurrent ? 'var(--bg-soft-blue)' : isCompleted ? '#f0fdf4' : 'var(--bg-subtle)',
                            border: `1px solid ${isCurrent ? 'var(--blue-accent)' : isCompleted ? '#bbf7d0' : 'var(--border-subtle)'}`
                          }}
                        >
                          <div style={{ marginTop: '2px' }}>
                            {isCompleted ? (
                              <CheckCircle2 size={18} color="#16a34a" />
                            ) : isCurrent ? (
                              <Clock size={18} color="var(--blue-accent)" />
                            ) : (
                              <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--text-light)' }}>
                                {idx + 1}
                              </div>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-primary)' }}>
                                {ms.title}
                              </span>
                              <span style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', color: isCompleted ? '#16a34a' : isCurrent ? 'var(--blue-accent)' : 'var(--text-light)' }}>
                                {ms.status}
                              </span>
                            </div>
                            {ms.description && (
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                                {ms.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button 
                className="btn btn-primary btn-full"
                onClick={() => onNavigate('dashboard')}
              >
                <span>Access Full Customer Dashboard for Dossier</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {hasSearched && !searchResult && !isLoading && (
            <div className="auth-alert-banner error" style={{ padding: '1.25rem' }}>
              <AlertCircle size={20} />
              <div>
                <strong>Case Record Not Found: </strong>
                <span>{errorMessage || 'Please verify the case number format (e.g. RG-10482) or contact dispute intake support.'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
