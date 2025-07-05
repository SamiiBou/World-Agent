import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ChatInterface } from './components/ChatInterface';
import IdentityLinking from './components/IdentityLinking';
import MiniKitStatus from './components/MiniKitStatus';
import AuthGuard from './components/AuthGuard';
import WalletAuth from './components/WalletAuth';
import MiniKitService from './services/miniKitService';
import './App.css';

function App() {
  const [miniKitInitialized, setMiniKitInitialized] = React.useState(false);

  // Initialize MiniKit when the app starts
  React.useEffect(() => {
    console.log('🚀 App starting up...');
    console.log('User Agent:', navigator.userAgent);
    
    const initMiniKit = async () => {
      try {
        console.log('🔧 Initializing MiniKit...');
        const initialized = MiniKitService.init();
        
        // Wait a moment for MiniKit to be ready
        setTimeout(() => {
          const finalStatus = MiniKitService.isInstalled();
          console.log('✅ MiniKit final status:', finalStatus);
          setMiniKitInitialized(true);
        }, 1000);
        
      } catch (error) {
        console.error('❌ MiniKit initialization failed:', error);
        setMiniKitInitialized(true); // Continue anyway
      }
    };

    initMiniKit();
  }, []);

  // Show loading while MiniKit is initializing
  if (!miniKitInitialized) {
    return (
      <div className="App">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column'
        }}>
          <div style={{ marginBottom: '20px' }}>🌍 World Agent</div>
          <div style={{ fontSize: '14px', color: '#666' }}>Initializing MiniKit...</div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <AuthGuard>
          {/* MiniKit Status Display */}
          <MiniKitStatus />
          
          {/* Simple navigation bar */}
          <nav className="nav-bar">
            <ul>
              <li>
                <Link to="/">Chat</Link>
              </li>
              <li>
                <Link to="/identity-link">Link Identity</Link>
              </li>
              <li>
                <Link to="/wallet-auth">Wallet Auth</Link>
              </li>
            </ul>
          </nav>
          
          {/* User info display */}
          <div className="user-info">
            {MiniKitService.isAuthenticated() && (
              <div className="authenticated-user">
                <span className="welcome-text">
                  Welcome, {MiniKitService.getUsername() || 'User'}!
                </span>
                <span className="wallet-address">
                  {MiniKitService.getWalletAddress()?.slice(0, 6)}...{MiniKitService.getWalletAddress()?.slice(-4)}
                </span>
              </div>
            )}
          </div>
          
          {/* Route handling */}
          <div className="main-content">
            <Routes>
              <Route path="/" element={<ChatInterface />} />
              <Route path="/identity-link" element={<IdentityLinking />} />
              <Route path="/wallet-auth" element={<WalletAuth />} />
            </Routes>
          </div>
        </AuthGuard>
      </div>
    </Router>
  );
}

export default App;
