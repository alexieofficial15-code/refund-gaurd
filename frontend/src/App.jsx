import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';

import DashboardPage from './pages/DashboardPage';
import TrackCasePage from './pages/TrackCasePage';
import StartCasePage from './pages/StartCasePage';
import AdminPage from './pages/AdminPage';
import CheckoutModal from './components/CheckoutModal';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('UI Render Error caught by boundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '4rem 1.5rem', textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛡️</div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--navy-primary)', fontWeight: 700, marginBottom: '0.5rem' }}>
            Display Refresh Required
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            A temporary component state update occurred. Click below to reload the dashboard.
          </p>
          <button 
            className="btn btn-primary" 
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
          >
            Reload Dashboard View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function parsePageFromHash() {
  const hash = window.location.hash.replace('#', '').toLowerCase();
  if (hash === 'dashboard' || hash === 'user' || hash === 'member') return 'dashboard';
  if (hash === 'admin' || hash === 'ops' || hash === 'operations') return 'admin';
  if (hash === 'auth' || hash === 'login' || hash === 'signin' || hash === 'signup') return 'auth';
  if (hash === 'start' || hash === 'report') return 'start';
  if (hash === 'track') return 'track';
  if (hash === 'checkout' || hash === 'pay') return 'checkout';
  return 'home';
}

function MainApp() {
  const { isAuthenticated, currentUser } = useAuth();
  const [activePage, setActivePage] = useState(() => parsePageFromHash());
  const [authMode, setAuthMode] = useState(() => {
    const hash = window.location.hash.toLowerCase();
    return hash.includes('signup') || hash.includes('register') ? 'signup' : 'signin';
  });
  const [postAuthRedirect, setPostAuthRedirect] = useState(null);
  const [authPromptMessage, setAuthPromptMessage] = useState('');
  const [activeTrackCaseNumber, setActiveTrackCaseNumber] = useState('');

  // Sync state with browser URL hash
  React.useEffect(() => {
    const handleHashChange = () => {
      const page = parsePageFromHash();
      setActivePage(page);
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('signup') || hash.includes('register')) {
        setAuthMode('signup');
      } else if (hash.includes('signin') || hash.includes('login')) {
        setAuthMode('signin');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (page, mode = null) => {
    if (page === 'home') {
      window.location.hash = '#landing';
    } else if (page === 'auth') {
      window.location.hash = mode === 'signup' ? '#signup' : '#login';
    } else {
      window.location.hash = `#${page}`;
    }
    setActivePage(page);
    if (mode) setAuthMode(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (mode = 'signin', prompt = '') => {
    setAuthPromptMessage(prompt);
    navigateTo('auth', mode);
  };

  // Auth gate for Start a Case: requires login or registration first
  const handleStartCase = () => {
    if (isAuthenticated) {
      navigateTo('start');
    } else {
      setPostAuthRedirect('start');
      setAuthPromptMessage('Please sign in or create an account to securely file and track your dispute dossier.');
      navigateTo('auth', 'signup');
    }
  };

  const handleAuthSuccess = (user) => {
    setAuthPromptMessage('');
    if (user?.role === 'admin' || user?.role === 'investigator' || postAuthRedirect === 'admin') {
      setPostAuthRedirect(null);
      navigateTo('admin');
    } else if (postAuthRedirect === 'start') {
      setPostAuthRedirect(null);
      navigateTo('start');
    } else {
      navigateTo('dashboard');
    }
  };

  const handleTrackCase = (caseNum) => {
    if (caseNum) {
      setActiveTrackCaseNumber(caseNum);
    }
    navigateTo('track');
  };

  return (
    <div className="site-app-wrapper">
      {/* Full-Page Fixed Transparent Background Layer behind all content */}
      <div className="site-fixed-background" aria-hidden="true" />
      <div className="site-fixed-glow" aria-hidden="true" />

      {/* Main Foreground Content */}
      <div className="site-content-layer">
        <Navbar 
          activePage={activePage} 
          setActivePage={(page) => navigateTo(page)}
          onOpenAuth={handleOpenAuth}
          onStartCase={handleStartCase}
        />

        <main style={{ flex: 1 }}>
          <ErrorBoundary>
            {activePage === 'home' && (
              <HomePage 
                onStartCase={handleStartCase}
                onOpenAuth={handleOpenAuth}
                onNavigate={(page) => navigateTo(page)}
              />
            )}

            {activePage === 'auth' && (
              <AuthPage 
                initialMode={authMode}
                promptMessage={authPromptMessage}
                onAuthSuccess={handleAuthSuccess}
                onNavigate={(page) => navigateTo(page)}
              />
            )}

            {/* Dashboard Page - preserved in memory when authenticated so switching between Track/Start and Dashboard is instantaneous */}
            {isAuthenticated ? (
              <div style={{ display: activePage === 'dashboard' ? 'block' : 'none' }}>
                <DashboardPage 
                  onStartNewCase={handleStartCase}
                  onNavigate={(page) => navigateTo(page)}
                  isActive={activePage === 'dashboard'}
                />
              </div>
            ) : (
              activePage === 'dashboard' && (
                <DashboardPage 
                  onStartNewCase={handleStartCase}
                  onNavigate={(page) => navigateTo(page)}
                  isActive={true}
                />
              )
            )}

            {activePage === 'track' && (
              <TrackCasePage 
                initialCaseNumber={activeTrackCaseNumber}
                onNavigate={(page) => navigateTo(page)}
              />
            )}

            {activePage === 'start' && (
              <StartCasePage 
                onCaseSubmitted={(caseNum) => navigateTo('dashboard')}
                onTrackCase={handleTrackCase}
                onOpenAuth={handleOpenAuth}
                onCancel={() => navigateTo('home')}
              />
            )}

            {activePage === 'admin' && (
              (!isAuthenticated || (currentUser?.role !== 'admin' && currentUser?.role !== 'investigator')) ? (
                <AuthPage 
                  initialMode="signin"
                  isAdminPortal={true}
                  promptMessage={
                    isAuthenticated && currentUser?.role !== 'admin' && currentUser?.role !== 'investigator'
                      ? `Access Restricted: Current session (${currentUser?.email}) has Claimant clearance. Please sign in with verified Administrator credentials.`
                      : "Administrator Security Gateway: Authorized personnel only. Please sign in with administrator credentials to access the Operations Panel."
                  }
                  onAuthSuccess={(user) => handleAuthSuccess(user)}
                  onNavigate={(page) => navigateTo(page)}
                />
              ) : (
                <AdminPage 
                  onNavigate={(page) => navigateTo(page)}
                />
              )
            )}

            {activePage === 'checkout' && (
              <CheckoutModal 
                isPage={true} 
                userInitial={currentUser?.fullName?.[0]?.toUpperCase() || currentUser?.name?.[0]?.toUpperCase() || 'M'}
                userName={currentUser?.fullName || currentUser?.name || 'Member'}
                onClose={() => navigateTo('dashboard')} 
              />
            )}
          </ErrorBoundary>
        </main>

        <Footer onNavigate={(section) => {
          if (section === 'track') {
            setActivePage('track');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
          if (section === 'dashboard') {
            setActivePage('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
          if (section === 'admin') {
            setActivePage('admin');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
          setActivePage('home');
          setTimeout(() => {
            const el = document.getElementById(section);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
