import React, { useState } from 'react';
import MiniKitService from '../services/miniKitService';
import './WalletAuth.css';

interface WalletAuthProps {
  onAuthSuccess?: (result: any) => void;
  onAuthError?: (error: string) => void;
}

const WalletAuth: React.FC<WalletAuthProps> = ({ onAuthSuccess, onAuthError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    setDebugInfo([]);
    
    try {
      addDebugInfo('Starting authentication process...');
      
      // Check MiniKit status first
      const miniKitInstalled = MiniKitService.isInstalled();
      addDebugInfo(`MiniKit installed: ${miniKitInstalled}`);
      
      if (!miniKitInstalled) {
        addDebugInfo('MiniKit not detected, this might be a false negative');
      }
      
      addDebugInfo('Calling MiniKit authentication...');
      const result = await MiniKitService.signInWithWallet();
      
      if (result.success) {
        addDebugInfo('Authentication successful!');
        setError(null);
        onAuthSuccess?.(result);
      } else {
        addDebugInfo(`Authentication failed: ${result.error}`);
        setError(result.error || 'Authentication failed');
        onAuthError?.(result.error || 'Authentication failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      addDebugInfo(`Exception during authentication: ${errorMessage}`);
      setError(errorMessage);
      onAuthError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    handleSignIn();
  };

  const handleClearDebug = () => {
    setDebugInfo([]);
  };

  return (
    <div className="wallet-auth-container">
      <div className="wallet-auth-header">
        <h2>🔐 Wallet Authentication</h2>
        <p>Sign in with your Ethereum wallet to access World Agent</p>
      </div>

      <div className="wallet-auth-actions">
        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="wallet-auth-button primary"
        >
          {isLoading ? (
            <>
              <span className="loading-spinner"></span>
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span className="button-icon">👛</span>
              <span>Sign In with Wallet</span>
            </>
          )}
        </button>

        {error && (
          <button
            onClick={handleRetry}
            disabled={isLoading}
            className="wallet-auth-button secondary"
          >
            <span className="button-icon">🔄</span>
            <span>Retry</span>
          </button>
        )}
      </div>

      {error && (
        <div className="wallet-auth-error">
          <div className="error-icon">❌</div>
          <div className="error-message">
            <strong>Authentication Error:</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {debugInfo.length > 0 && (
        <div className="wallet-auth-debug">
          <div className="debug-header">
            <h4>🔍 Debug Information</h4>
            <button
              onClick={handleClearDebug}
              className="debug-clear-button"
            >
              Clear
            </button>
          </div>
          <div className="debug-log">
            {debugInfo.map((info, index) => (
              <div key={index} className="debug-line">
                {info}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="wallet-auth-info">
        <h4>ℹ️ How it works:</h4>
        <ol>
          <li>Click "Sign In with Wallet" to start</li>
          <li>MiniKit will prompt you to sign a message</li>
          <li>Your wallet address will be used for authentication</li>
          <li>No gas fees or transactions required</li>
        </ol>
      </div>
    </div>
  );
};

export default WalletAuth; 