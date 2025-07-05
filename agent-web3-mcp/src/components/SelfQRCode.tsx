import React, { useState, useEffect } from 'react';
import { SelfQRcodeWrapper, SelfAppBuilder } from '@selfxyz/qrcode';
import { v4 as uuidv4 } from 'uuid';
import './SelfQRCode.css';

export default function SelfVerificationQR() {
  const [userId, setUserId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [verificationData, setVerificationData] = useState<any>(null);

  useEffect(() => {
    // Generate a user ID when the component mounts
    const newUserId = uuidv4();
    setUserId(newUserId);
  }, []);

  if (!userId) return <div>Loading Self ID...</div>;

  // Show success state after verification
  if (verificationStatus === 'success') {
    return (
      <div className="verification-container p-6">
        <div className="verification-success">
          <div className="success-icon">✅</div>
          <h2 className="success-title">Verification Successful!</h2>
          <p className="success-message">
            Your identity has been successfully verified using Self ID.
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
              <div className="detail-item">
                <span className="detail-label">User ID:</span>
                <span className="detail-value">{userId.substring(0, 8)}...</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className="detail-value verified">Verified ✓</span>
              </div>
            </div>
          )}

          <div className="next-steps">
            <h3>What's Next?</h3>
            <ul>
              <li>🤖 Create agents with enhanced capabilities</li>
              <li>🔒 Access secure transaction features</li>
              <li>⚡ Enjoy faster processing times</li>
              <li>🌐 Use cross-platform identity verification</li>
            </ul>
          </div>

          <button 
            className="continue-button"
            onClick={() => window.location.href = '/'}
          >
            Continue to Chat
          </button>
        </div>
      </div>
    );
  }

  // Create the SelfApp configuration according to documentation
  const selfApp = new SelfAppBuilder({
    appName: "Human-Verified Agent System",
    scope: "my-application-scope",         // Must match backend scope exactly
    endpoint: 'https://5c65-83-144-23-154.ngrok-free.app/api/verify', // Updated ngrok URL
    userId,
    version: 2,
    userDefinedData: "test",
    disclosures: {                         // Must match backend config exactly
      minimumAge: 18,                      // Must match backend (using minimumAge not olderThan)
      excludedCountries: ['IRN', 'PRK'],   // Must match backend
      ofac: true,                          // Must match backend
      nationality: true,                   // Request nationality disclosure
      name: true,                          // Request name disclosure
      date_of_birth: true                  // Request date of birth disclosure
    }
  }).build();

  const handleSuccess = (data?: any) => {
    console.log("✅ Verification successful!");
    console.log("Verification data:", data);
    setVerificationStatus('success');
    setVerificationData({
      verificationTimestamp: Date.now(),
      ...data
    });
  };

  const handleError = (data: { error_code?: string; reason?: string }) => {
    console.error("❌ Verification failed:", data);
    setVerificationStatus('error');
  };

  return (
    <div className="verification-container p-6">
      <h2 className="text-2xl font-bold mb-4">Verify Your Identity</h2>
      <p className="mb-6 text-gray-600">
        Scan this QR code with the Self app to verify your identity
      </p>
      
      <div className="flex justify-center">
        <SelfQRcodeWrapper
          selfApp={selfApp}
          onSuccess={handleSuccess}
          onError={handleError}
          size={350}
        />
      </div>
      
      <p className="text-sm text-gray-500 mt-4 text-center">
        User ID: {userId.substring(0, 8)}...
      </p>
      
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Configuration:</h3>
        <ul className="text-sm text-gray-600">
          <li>• Scope: my-application-scope</li>
          <li>• Minimum Age: 18</li>
          <li>• Excluded Countries: Iran, North Korea</li>
          <li>• OFAC Check: Enabled</li>
        </ul>
      </div>
    </div>
  );
}