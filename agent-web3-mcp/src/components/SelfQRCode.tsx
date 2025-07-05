import React, { useState, useEffect } from 'react';
import { SelfQRcodeWrapper, SelfAppBuilder } from '@selfxyz/qrcode';
import { v4 as uuidv4 } from 'uuid';

export default function SelfVerificationQR() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Generate a user ID when the component mounts
    const newUserId = uuidv4();
    setUserId(newUserId);
  }, []);

  if (!userId) return <div>Loading Self ID...</div>;

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

  const handleSuccess = () => {
    console.log("✅ Verification successful!");
    // Handle successful verification
  };

  const handleError = (data: { error_code?: string; reason?: string }) => {
    console.error("❌ Verification failed:", data);
    // Handle verification error
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