import React, { useState, useEffect } from 'react';
import MiniKitService from '../services/miniKitService';
import WalletAuth from './WalletAuth';
import './AuthGuard.css';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [forceShowAuth, setForceShowAuth] = useState(false);

  useEffect(() => {
    // Check initial authentication state
    const checkAuthState = () => {
      const authState = MiniKitService.getAuthState();
      setIsAuthenticated(authState.isAuthenticated);
      setIsLoading(false);
      
      // Show auth modal if not authenticated
      if (!authState.isAuthenticated) {
        const miniKitAvailable = MiniKitService.isInstalled();
        if (miniKitAvailable) {
          setShowAuthModal(true);
        }
      }
    };

    checkAuthState();
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
    setForceShowAuth(false);
  };

  const handleAuthError = (error: string) => {
    console.error('Authentication error:', error);
    // Keep the auth modal open on error
  };

  const handleTryAgain = () => {
    setShowAuthModal(true);
  };

  const handleForceAuth = () => {
    setForceShowAuth(true);
    setShowAuthModal(true);
  };

  const handleRetryDetection = () => {
    // Force a recheck of MiniKit status
    const isInstalled = MiniKitService.isInstalled();
    console.log('Retry detection result:', isInstalled);
    
    if (isInstalled) {
      setShowAuthModal(true);
    } else {
      // Still not detected, but give user the option to try anyway
      alert('MiniKit still not detected. If you are in World App, try the "Try Authentication Anyway" button.');
    }
  };

  if (isLoading) {
    return (
      <div className="auth-guard-loading">
        <div className="auth-guard-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show the authentication interface
  if (!isAuthenticated) {
    return (
      <div className="auth-guard-container">
        {/* Auth Modal */}
        {showAuthModal && (
          <div className="auth-modal-overlay">
            <div className="auth-modal">
              <WalletAuth
                onAuthSuccess={handleAuthSuccess}
                onAuthError={handleAuthError}
              />
            </div>
          </div>
        )}

        {/* Fallback content or default unauthenticated view */}
        {fallback || (
          <div className="auth-guard-unauthenticated">
            <div className="auth-guard-hero">
              <h1>🌍 Welcome to World Agent</h1>
              <p>Your decentralized AI assistant powered by World Chain</p>
              
              {!MiniKitService.isInstalled() && !forceShowAuth ? (
                <div className="auth-guard-no-minikit">
                  <div className="warning-icon">⚠️</div>
                  <h3>MiniKit Detection Issue</h3>
                  <p>
                    We couldn't detect MiniKit. If you are running this in World App, 
                    this might be a false negative.
                  </p>
                  <div className="auth-guard-actions">
                    <button 
                      className="auth-guard-button primary"
                      onClick={handleRetryDetection}
                    >
                      <span className="button-icon">🔄</span>
                      Retry Detection
                    </button>
                    <button 
                      className="auth-guard-button secondary"
                      onClick={handleForceAuth}
                    >
                      <span className="button-icon">👛</span>
                      Try Authentication Anyway
                    </button>
                  </div>
                  <div className="auth-guard-instructions">
                    <p><strong>If you're not in World App:</strong></p>
                    <ol>
                      <li>Open the World App on your device</li>
                      <li>Navigate to the World Agent mini-app</li>
                      <li>Sign in with your Ethereum wallet</li>
                    </ol>
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '16px' }}>
                      <strong>Debug info:</strong> Check the browser console for more details.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="auth-guard-need-auth">
                  <div className="auth-icon">🔐</div>
                  <h3>Authentication Required</h3>
                  <p>Please sign in with your wallet to access the World Agent features.</p>
                  <button 
                    className="auth-guard-button primary"
                    onClick={handleTryAgain}
                  >
                    <span className="button-icon">👛</span>
                    Sign In with Wallet
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // If authenticated, render the protected content
  return <>{children}</>;
};

export default AuthGuard; 