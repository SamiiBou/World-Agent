import React, { useState, useEffect } from 'react';
import SelfVerificationQR from './SelfQRCode';
import WorldIdService, { WorldIdVerificationResult, WorldIdVerificationStatus } from '../services/worldIdService';
import MiniKitService from '../services/miniKitService';
import { VerificationLevel } from '@worldcoin/minikit-js';
import './IdentityLinking.css';

export default function IdentityLinking() {
  const [activeConnection, setActiveConnection] = useState<'worldid' | 'selfid' | null>(null);
  const [worldIdStatus, setWorldIdStatus] = useState<WorldIdVerificationStatus>({ isVerified: false });
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<WorldIdVerificationResult | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [verificationLevel, setVerificationLevel] = useState<VerificationLevel>(VerificationLevel.Orb);

  useEffect(() => {
    // Get wallet address from authentication state
    const authState = MiniKitService.getAuthState();
    if (authState.walletAddress) {
      setWalletAddress(authState.walletAddress);
      checkWorldIdStatus(authState.walletAddress);
    }
  }, []);

  const checkWorldIdStatus = async (address: string) => {
    try {
      const status = await WorldIdService.checkVerificationStatus(address);
      setWorldIdStatus(status);
    } catch (error) {
      console.error('Error checking World ID status:', error);
    }
  };

  const handleWorldIdConnect = () => {
    setActiveConnection('worldid');
    setVerificationResult(null);
  };

  const handleSelfIdConnect = () => {
    setActiveConnection('selfid');
  };

  const handleBack = () => {
    setActiveConnection(null);
    setVerificationResult(null);
  };

  const handleWorldIdVerify = async () => {
    if (!walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      console.log('🌍 Starting World ID verification...');
      const result = await WorldIdService.verifyWorldId(
        walletAddress,
        walletAddress, // Use wallet address as signal
        verificationLevel
      );

      setVerificationResult(result);

      if (result.success) {
        // Update status after successful verification
        await checkWorldIdStatus(walletAddress);
        console.log('✅ World ID verification successful!');
      } else {
        console.error('❌ World ID verification failed:', result.error);
      }
    } catch (error) {
      console.error('💥 World ID verification error:', error);
      setVerificationResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorCode: 'VERIFICATION_ERROR'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (activeConnection === 'selfid') {
    return (
      <div className="identity-linking-container">
        <div className="back-button-container">
          <button onClick={handleBack} className="back-button">
            ← Back to Identity Options
          </button>
        </div>
        <SelfVerificationQR />
      </div>
    );
  }

  if (activeConnection === 'worldid') {
    return (
      <div className="identity-linking-container">
        <div className="back-button-container">
          <button onClick={handleBack} className="back-button">
            ← Back to Identity Options
          </button>
        </div>
        <div className="connection-content">
          <h2 className="connection-title">Verify with World ID</h2>
          
          {/* Show current status */}
          {worldIdStatus.isVerified ? (
            <div className="verification-status success">
              <div className="status-icon">✅</div>
              <h3>World ID Verified!</h3>
              <p>Your World ID has been successfully verified</p>
              <div className="verification-details">
                <div className="detail-item">
                  <span className="label">Verification Level:</span>
                  <span className="value">{WorldIdService.getVerificationLevelName(worldIdStatus.verificationLevel!)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Verified On:</span>
                  <span className="value">{worldIdStatus.verificationDate ? new Date(worldIdStatus.verificationDate).toLocaleDateString() : 'Unknown'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="verification-interface">
              <div className="verification-header">
                <div className="verification-icon">🌍</div>
                <h3>Verify Your Identity</h3>
                <p>Use your World ID to prove you're a unique human</p>
              </div>

              {/* Verification Level Selection */}
              <div className="verification-options">
                <h4>Select Verification Level:</h4>
                <div className="verification-levels">
                  <label className={`verification-level ${verificationLevel === VerificationLevel.Orb ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="verificationLevel"
                      value={VerificationLevel.Orb}
                      checked={verificationLevel === VerificationLevel.Orb}
                      onChange={(e) => setVerificationLevel(VerificationLevel.Orb)}
                    />
                    <div className="level-info">
                      <div className="level-name">🔮 Orb Verified</div>
                      <div className="level-description">Highest security - verified using Worldcoin Orb</div>
                    </div>
                  </label>
                  <label className={`verification-level ${verificationLevel === VerificationLevel.Device ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="verificationLevel"
                      value={VerificationLevel.Device}
                      checked={verificationLevel === VerificationLevel.Device}
                      onChange={(e) => setVerificationLevel(VerificationLevel.Device)}
                    />
                    <div className="level-info">
                      <div className="level-name">📱 Device Verified</div>
                      <div className="level-description">Basic verification using your device</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Wallet Address Display */}
              {walletAddress && (
                <div className="wallet-info">
                  <div className="wallet-label">Your Wallet Address:</div>
                  <div className="wallet-address">{walletAddress}</div>
                </div>
              )}

              {/* Verification Button */}
              <button
                onClick={handleWorldIdVerify}
                disabled={isVerifying || !walletAddress}
                className={`verify-button ${isVerifying ? 'loading' : ''}`}
              >
                {isVerifying ? (
                  <>
                    <span className="loading-spinner"></span>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span className="button-icon">🌍</span>
                    <span>Verify with World ID</span>
                  </>
                )}
              </button>

              {/* Result Display */}
              {verificationResult && (
                <div className={`verification-result ${verificationResult.success ? 'success' : 'error'}`}>
                  {verificationResult.success ? (
                    <div className="success-result">
                      <div className="result-icon">🎉</div>
                      <h4>Verification Successful!</h4>
                      <p>Your World ID has been verified and saved</p>
                      <div className="result-details">
                        <div className="detail-item">
                          <span className="label">Verification Level:</span>
                          <span className="value">{WorldIdService.getVerificationLevelName(verificationResult.verificationLevel!)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Nullifier Hash:</span>
                          <span className="value">{verificationResult.nullifierHash?.substring(0, 16)}...</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="error-result">
                      <div className="result-icon">❌</div>
                      <h4>Verification Failed</h4>
                      <p>{verificationResult.error}</p>
                      {verificationResult.errorCode && (
                        <div className="error-code">Error Code: {verificationResult.errorCode}</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Information */}
              <div className="verification-info">
                <h4>What is World ID?</h4>
                <ul>
                  <li>🔐 Proof of personhood - verify you're a unique human</li>
                  <li>🔒 Privacy-preserving - no personal data is shared</li>
                  <li>🌐 Sybil-resistant - prevents fake accounts</li>
                  <li>⚡ Enables advanced agent capabilities</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="identity-linking-container">
      <div className="identity-header">
        <h1 className="identity-title">Link Your Identity</h1>
        <p className="identity-subtitle">
          Choose how you'd like to verify your identity to enable advanced agent features
        </p>
      </div>

      <div className="connection-options">
        <div className="connection-card" onClick={handleWorldIdConnect}>
          <div className="connection-icon">🌍</div>
          <h3 className="connection-name">World ID</h3>
          <p className="connection-description">
            Verify your humanity using Worldcoin's biometric identity system
          </p>
          <div className="connection-features">
            <span className="feature-tag">Biometric</span>
            <span className="feature-tag">Sybil-resistant</span>
            <span className="feature-tag">Privacy-preserving</span>
          </div>
          <button className="connect-button world-id-button">
            Connect World ID
          </button>
        </div>

        <div className="connection-card" onClick={handleSelfIdConnect}>
          <div className="connection-icon">🆔</div>
          <h3 className="connection-name">Self ID</h3>
          <p className="connection-description">
            Verify your identity using government-issued documents
          </p>
          <div className="connection-features">
            <span className="feature-tag">Document-based</span>
            <span className="feature-tag">KYC compliant</span>
            <span className="feature-tag">Zero-knowledge</span>
          </div>
          <button className="connect-button self-id-button">
            Connect Self ID
          </button>
        </div>
      </div>

      <div className="identity-info">
        <h3 className="info-title">Why verify your identity?</h3>
        <div className="info-benefits">
          <div className="benefit-item">
            <span className="benefit-icon">🔒</span>
            <span className="benefit-text">Enhanced security for high-value transactions</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🤖</span>
            <span className="benefit-text">Access to advanced AI agent capabilities</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">⚡</span>
            <span className="benefit-text">Faster transaction processing</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🌐</span>
            <span className="benefit-text">Cross-platform identity verification</span>
          </div>
        </div>
      </div>
    </div>
  );
} 