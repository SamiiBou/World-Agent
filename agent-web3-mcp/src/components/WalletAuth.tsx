import React, { useState, useEffect, useCallback } from 'react';
import MiniKitService from '../services/miniKitService';
import { MiniKit } from '@worldcoin/minikit-js';
import './WalletAuth.css';

interface WalletAuthProps {
  onAuthSuccess?: (result: any) => void;
  onAuthError?: (error: string) => void;
}

interface WalletInfoDisplay {
  walletAddress?: string;
  username?: string;
  profilePictureUrl?: string;
  deviceOS?: string;
  worldAppVersion?: number;
  permissions?: any;
  optedIntoOptionalAnalytics?: boolean;
  safeAreaInsets?: any;
}

const WalletAuth: React.FC<WalletAuthProps> = ({ onAuthSuccess, onAuthError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [walletInfo, setWalletInfo] = useState<WalletInfoDisplay>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const addDebugInfo = (message: string) => {
    const timestampedMessage = `${new Date().toLocaleTimeString()}: ${message}`;
    setDebugInfo(prev => [...prev, timestampedMessage]);
    console.log('🔍 WalletAuth Debug:', timestampedMessage);
  };

  const collectWalletInfo = useCallback(() => {
    addDebugInfo('Collecting comprehensive wallet information...');
    
    // Get all available MiniKit information
    const info: WalletInfoDisplay = {};
    
    if (MiniKit.user) {
      info.walletAddress = MiniKit.user.walletAddress;
      info.username = MiniKit.user.username;
      info.profilePictureUrl = MiniKit.user.profilePictureUrl;
      info.permissions = MiniKit.user.permissions;
      info.optedIntoOptionalAnalytics = MiniKit.user.optedIntoOptionalAnalytics;
      info.deviceOS = MiniKit.user.deviceOS;
      info.worldAppVersion = MiniKit.user.worldAppVersion;
    }
    
    if (MiniKit.deviceProperties) {
      info.safeAreaInsets = MiniKit.deviceProperties.safeAreaInsets;
      if (!info.deviceOS) info.deviceOS = MiniKit.deviceProperties.deviceOS;
      if (!info.worldAppVersion) info.worldAppVersion = MiniKit.deviceProperties.worldAppVersion;
    }
    
    setWalletInfo(info);
    
    // Log all the information
    addDebugInfo('=== COMPLETE WALLET INFO COLLECTED ===');
    addDebugInfo(`Wallet Address: ${info.walletAddress || 'N/A'}`);
    addDebugInfo(`Username: ${info.username || 'N/A'}`);
    addDebugInfo(`Profile Picture: ${info.profilePictureUrl || 'N/A'}`);
    addDebugInfo(`Device OS: ${info.deviceOS || 'N/A'}`);
    addDebugInfo(`World App Version: ${info.worldAppVersion || 'N/A'}`);
    addDebugInfo(`Optional Analytics: ${info.optedIntoOptionalAnalytics || 'N/A'}`);
    addDebugInfo(`Permissions: ${JSON.stringify(info.permissions) || 'N/A'}`);
    addDebugInfo(`Safe Area Insets: ${JSON.stringify(info.safeAreaInsets) || 'N/A'}`);
    
    // Also log to console for complete details
    console.log('👤 === COMPLETE WALLET INFO FROM UI ===');
    console.log('👤 Wallet Info Object:', JSON.stringify(info, null, 2));
    console.log('👤 MiniKit User Object:', JSON.stringify(MiniKit.user, null, 2));
    console.log('👤 MiniKit Device Properties:', JSON.stringify(MiniKit.deviceProperties, null, 2));
    console.log('👤 MiniKit App ID:', MiniKit.appId);
    console.log('👤 MiniKit Installation Status:', MiniKitService.isInstalled());
  }, []);

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuthStatus = () => {
      const authStatus = MiniKitService.isAuthenticated();
      setIsAuthenticated(authStatus);
      
      // If authenticated, collect wallet info
      if (authStatus) {
        collectWalletInfo();
      }
    };
    
    checkAuthStatus();
  }, [collectWalletInfo]);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    setDebugInfo([]);
    setWalletInfo({});
    
    try {
      addDebugInfo('Starting authentication process...');
      
      // Collect initial wallet info
      collectWalletInfo();
      
      // Check MiniKit status first
      const miniKitInstalled = MiniKitService.isInstalled();
      addDebugInfo(`MiniKit installed: ${miniKitInstalled}`);
      
      if (!miniKitInstalled) {
        addDebugInfo('MiniKit not detected, this might be a false negative');
      }
      
      addDebugInfo('Calling MiniKit authentication...');
      const result = await MiniKitService.signInWithWallet();
      
      // Log the complete authentication result
      addDebugInfo('=== AUTHENTICATION RESULT ===');
      addDebugInfo(`Success: ${result.success}`);
      addDebugInfo(`Wallet Address: ${result.walletAddress || 'N/A'}`);
      addDebugInfo(`Username: ${result.username || 'N/A'}`);
      addDebugInfo(`Error: ${result.error || 'N/A'}`);
      
      // Log full result object to console
      console.log('🎉 === COMPLETE AUTHENTICATION RESULT FROM UI ===');
      console.log('🎉 Full Result Object:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        addDebugInfo('Authentication successful!');
        setError(null);
        setIsAuthenticated(true);
        
        // Collect updated wallet info after successful auth
        collectWalletInfo();
        
        onAuthSuccess?.(result);
      } else {
        addDebugInfo(`Authentication failed: ${result.error}`);
        setError(result.error || 'Authentication failed');
        setIsAuthenticated(false);
        onAuthError?.(result.error || 'Authentication failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addDebugInfo(`Unexpected error: ${errorMessage}`);
      setError(errorMessage);
      setIsAuthenticated(false);
      onAuthError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    MiniKitService.signOut();
    setIsAuthenticated(false);
    setWalletInfo({});
    setDebugInfo([]);
    setError(null);
    addDebugInfo('User signed out');
  };

  const renderAuthenticationStatus = () => {
    if (isAuthenticated) {
      return (
        <div className="auth-status success">
          <div className="status-header">
            <span className="status-icon">✅</span>
            <h3>Authentication Successful</h3>
          </div>
          <div className="user-details">
            <p><strong>Wallet Address:</strong> {walletInfo.walletAddress || 'N/A'}</p>
            <p><strong>Username:</strong> {walletInfo.username || 'N/A'}</p>
            {walletInfo.profilePictureUrl && (
              <img 
                src={walletInfo.profilePictureUrl} 
                alt="Profile" 
                className="profile-picture"
              />
            )}
          </div>
          <button onClick={handleSignOut} className="btn btn-secondary">
            Sign Out
          </button>
        </div>
      );
    } else {
      return (
        <div className="auth-status pending">
          <div className="status-header">
            <span className="status-icon">⏳</span>
            <h3>Not Authenticated</h3>
          </div>
          <p className="status-message">
            You need to sign in with your wallet to access user information.
            Click "Sign In with Wallet" below to start the authentication process.
          </p>
          <div className="auth-steps">
            <h4>Authentication Steps:</h4>
            <ol>
              <li>Click "Sign In with Wallet"</li>
              <li>Sign the SIWE message in World App</li>
              <li>Complete backend verification</li>
              <li>Access your wallet information</li>
            </ol>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="wallet-auth-container">
      <div className="wallet-auth-header">
        <h2>🔐 Wallet Authentication</h2>
        <p>Sign in with your Ethereum wallet using the SIWE (Sign-In with Ethereum) protocol.</p>
      </div>

      {renderAuthenticationStatus()}

      <div className="wallet-auth-actions">
        {!isAuthenticated && (
          <button 
            onClick={handleSignIn} 
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? 'Signing In...' : 'Sign In with Wallet'}
          </button>
        )}
        
        <button 
          onClick={collectWalletInfo}
          className="btn btn-secondary"
          disabled={isLoading}
        >
          {isLoading ? 'Collecting...' : 'Collect Wallet Info'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">❌</span>
          <div className="error-content">
            <h4>Authentication Error</h4>
            <p>{error}</p>
          </div>
        </div>
      )}

      {walletInfo && Object.keys(walletInfo).length > 0 && (
        <div className="wallet-info">
          <h3>📱 Wallet Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Wallet Address:</label>
              <span>{walletInfo.walletAddress || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Username:</label>
              <span>{walletInfo.username || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Device OS:</label>
              <span>{walletInfo.deviceOS || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>World App Version:</label>
              <span>{walletInfo.worldAppVersion || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Optional Analytics:</label>
              <span>{walletInfo.optedIntoOptionalAnalytics?.toString() || 'N/A'}</span>
            </div>
            {walletInfo.permissions && (
              <div className="info-item">
                <label>Permissions:</label>
                <span>{JSON.stringify(walletInfo.permissions, null, 2)}</span>
              </div>
            )}
            {walletInfo.safeAreaInsets && (
              <div className="info-item">
                <label>Safe Area Insets:</label>
                <span>{JSON.stringify(walletInfo.safeAreaInsets, null, 2)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {debugInfo.length > 0 && (
        <div className="debug-info">
          <h3>🔍 Debug Information</h3>
          <div className="debug-log">
            {debugInfo.map((info, index) => (
              <div key={index} className="debug-entry">
                {info}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="wallet-auth-info">
        <h4>ℹ️ How Wallet Authentication Works:</h4>
        <div className="info-content">
          <p><strong>Important:</strong> User information is only available AFTER successful authentication.</p>
          <ol>
            <li><strong>Click "Sign In with Wallet"</strong> to start the authentication process</li>
            <li><strong>Sign the SIWE message</strong> in World App when prompted</li>
            <li><strong>Complete backend verification</strong> to validate your signature</li>
            <li><strong>Access your wallet information</strong> once authenticated</li>
          </ol>
          <p><strong>💡 Tip:</strong> The wallet information (address, username, etc.) will only show as "N/A" until you complete the full authentication process.</p>
        </div>
      </div>
    </div>
  );
};

export default WalletAuth; 