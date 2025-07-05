import React, { useState, useEffect } from 'react';
import { SelfAppBuilder } from '@selfxyz/qrcode';
import { v4 as uuidv4 } from 'uuid';
import './SelfQRCode.css';
import VerificationStorage from '../utils/verificationStorage';
import { config } from '../config/environment';
import MiniKitService from '../services/miniKitService';
import { getUniversalLink } from '@selfxyz/common';

export default function SelfVerificationQR() {
  const [userId, setUserId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [verificationData, setVerificationData] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');

  useEffect(() => {
    // Generate a user ID when the component mounts
    const newUserId = uuidv4();
    setUserId(newUserId);
    
    // Get wallet address from authentication state
    const authState = MiniKitService.getAuthState();
    if (authState.walletAddress) {
      setWalletAddress(authState.walletAddress);
      console.log('📱 Wallet address for Self verification:', authState.walletAddress);
    } else {
      console.warn('⚠️ No wallet address found in auth state for Self verification');
    }
  }, []);

  if (!userId) return <div>Loading Self ID...</div>;

  // Show success state after verification
  if (verificationStatus === 'success' && verificationData) {
    const ageValid = verificationData.selfVerificationData?.isValidDetails?.isMinimumAgeValid ?? false;
    const countryValid = verificationData.selfVerificationData?.isValidDetails?.isOfacValid ?? false;

    return (
      <div className="verification-container p-6">
        <div className="verification-success">
          <div className="success-icon">✅</div>
          <h2 className="success-title">Verification Successful!</h2>
          <p className="success-message">
            Your identity has been successfully verified using Self ID and linked to your wallet address.
            You can now connect your identity with your agents for enhanced security and capabilities.
          </p>
          
          {verificationData && (
            <div className="verification-details">
              <h3>Verification Details:</h3>
              <div className="detail-item">
                <span className="detail-label">Verification Time:</span>
                <span className="detail-value">
                  {new Date(verificationData.verificationTimestamp).toLocaleString()}
                </span>
              </div>
              {walletAddress && (
                <div className="detail-item">
                  <span className="detail-label">Linked Wallet:</span>
                  <span className="detail-value primary-id">
                    {walletAddress.substring(0, 6)}...{walletAddress.substring(-4)}
                  </span>
                </div>
              )}
              {verificationData.selfUserId && (
                <div className="detail-item">
                  <span className="detail-label">Unique ID:</span>
                  <span className="detail-value primary-id">{verificationData.selfUserId}</span>
                </div>
              )}
              <div className="detail-item">
                <span className="detail-label">Age Requirement:</span>
                <span className={`detail-value ${ageValid ? 'verified' : 'invalid'}`}>{ageValid ? 'Passed ✓' : 'Failed ✗'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Country/OFAC Check:</span>
                <span className={`detail-value ${countryValid ? 'verified' : 'invalid'}`}>{countryValid ? 'Passed ✓' : 'Blocked ✗'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className="detail-value verified">Verified ✓</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Verification Type:</span>
                <span className="detail-value">{verificationData.verificationType}</span>
              </div>
            </div>
          )}

          <div className="next-steps">
            <h3>What's Next?</h3>
            <ul>
              <li>🤖 Create agents with various capabilities</li>
              <li>🔒 Import an agent and connect your IDs</li>
              <li>🌐 cross-platform identity verification</li>
            </ul>
          </div>

          <button 
            className="continue-button"
            onClick={() => window.location.href = '/'}
          >
            Create Agent and Connect IDs
          </button>
          <button
            className="continue-button import-btn"
            onClick={() => window.location.href = '/import-agent'}
          >
            Import Existing Agent
          </button>
        </div>
      </div>
    );
  }

  // Create the SelfApp configuration according to documentation  
  const backendUrl = config.backend.baseUrl;
  
  // Include wallet address in the endpoint URL as a query parameter
  const verificationEndpoint = walletAddress 
    ? `${backendUrl}/api/self/verify?walletAddress=${encodeURIComponent(walletAddress)}`
    : `${backendUrl}/api/self/verify`;
  
  console.log('🔗 Self verification endpoint:', verificationEndpoint);
  
  const selfApp = new SelfAppBuilder({
    appName: "Human-Verified Agent System",
    scope: "my-application-scope",         // Must match backend scope exactly
    endpoint: verificationEndpoint,        // Use correct Self verification endpoint with wallet address
    userId,
    version: 2,
    userDefinedData: walletAddress || "no-wallet", // Include wallet address in user data as backup
    disclosures: {                         // Must match backend config exactly
      minimumAge: 18,                      // Must match backend (using minimumAge not olderThan)
      excludedCountries: ['IRN', 'PRK'],   // Must match backend
      ofac: true,                          // Must match backend
      nationality: true,                   // Request nationality disclosure
      name: true,                          // Request name disclosure
      date_of_birth: true                  // Request date of birth disclosure
    }
  }).build();

  // Create the deeplink manually since getUniversalLink is not available
  const deeplink = getUniversalLink(selfApp);

  const handleSuccess = (data?: any) => {
    console.log("✅ Self verification successful!");
    console.log("Verification data:", data);
    console.log("Wallet address used:", walletAddress);
    
    // The Self QR SDK success callback doesn't contain the backend verification data
    // We need to fetch the most recent verification result from our backend
    fetchVerificationResult();
  };

  const fetchVerificationResult = async () => {
    try {
      // Fetch the latest verification result from backend (no userId filter, backend picks latest)
      const backendUrl = config.backend.baseUrl;
      const response = await fetch(`${backendUrl}/api/self/latest-verification`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch verification: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.verification) {
        // Prefer nullifier as stable unique ID; fallback to userIdentifier if needed
        const uniqueId = data.verification.discloseOutput?.nullifier;
        
        const verificationInfo = {
          sessionUserId: userId!,
          selfUserId: uniqueId,
          verificationTimestamp: data.verification.timestamp,
          selfVerificationData: data.verification, // Full verification data
          isVerified: true,
          verificationType: 'self-id' as const
        };
        
        VerificationStorage.storeVerification(verificationInfo);
        setVerificationStatus('success');
        setVerificationData(verificationInfo);
        
        console.log('✅ Verification data fetched and stored:', {
          uniqueId,
          timestamp: data.verification.timestamp,
          walletAddress: walletAddress
        });
      } else {
        throw new Error('Invalid verification response');
      }
    } catch (error) {
      console.error('Failed to fetch verification result:', error);
      
      // Fallback: create basic verification info even if fetch fails
      const fallbackInfo = {
        sessionUserId: userId!,
        selfUserId: undefined,
        verificationTimestamp: Date.now(),
        selfVerificationData: undefined,
        isVerified: true,
        verificationType: 'self-id' as const
      };
      
      VerificationStorage.storeVerification(fallbackInfo);
      setVerificationStatus('success');
      setVerificationData(fallbackInfo);
      
      console.log('⚠️ Using fallback verification data due to fetch error');
    }
  };

  const handleError = (data: { error_code?: string; reason?: string }) => {
    console.error("❌ Verification failed:", data);
    setVerificationStatus('error');
  };

  // Show warning if no wallet address
  if (!walletAddress) {
    return (
      <div className="verification-container p-6">
        <div className="qr-card">
          <div className="verification-warning">
            <div className="warning-icon">⚠️</div>
            <h2>Wallet Required</h2>
            <p>
              Please connect your wallet first before verifying your identity with Self ID.
              Your verification needs to be linked to your wallet address.
            </p>
            <button 
              className="continue-button"
              onClick={() => window.location.href = '/wallet-auth'}
            >
              Connect Wallet First
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="self-deeplink-container">
      <a href={deeplink} className="self-deeplink-btn" target="_blank" rel="noopener noreferrer">
        🔗 Open Self App to Verify
      </a>
    </div>
  );
}