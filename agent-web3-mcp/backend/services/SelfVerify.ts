import { NextApiRequest, NextApiResponse } from 'next';
import { 
  SelfBackendVerifier,
  AttestationId,
  InMemoryConfigStore
} from '@selfxyz/core';
import { generateUserContextData } from '../../src/utils/generateUserContextData';

// Configure storage with verification requirements
const configStorage = new InMemoryConfigStore(
  async () => {
    // For now, use a standard config for all users
    // You can extend this to have different configs based on user actions
    return 'standard_config';
  }
);

// Set up configuration
await configStorage.setConfig('standard_config', {
  minimumAge: 18,  // Using minimumAge instead of olderThan for consistency
  excludedCountries: ['IRN', 'PRK'], // Iran and North Korea
  ofac: true
});

// Initialize verifier
const allowedIds = new Map<AttestationId, boolean>();
allowedIds.set(1, true); // Passports
allowedIds.set(2, true); // EU ID cards

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const verifier = new SelfBackendVerifier(
  'my-application-scope',
  'https://9b05-217-112-231-162.ngrok-free.app/api/verify',
  false,  // Production mode
  allowedIds,
  configStorage,
  'uuid'  // User identifier type
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('=== SELF VERIFICATION REQUEST ===');
    console.log('Full req.body:', JSON.stringify(req.body, null, 2));
    
    // Extract fields from request body
    const { proof, publicSignals, userDefinedData, userContextData: receivedUserContextData, userId } = req.body;
    let { pubSignals } = req.body;
    
    // Handle field name variations - Self sends "publicSignals" but SDK might expect "pubSignals"
    if (!pubSignals && publicSignals) {
      pubSignals = publicSignals;
      console.log('Converting publicSignals to pubSignals');
    }

    // Sanitize pubSignals to avoid BigInt conversion issues (replace '0x' with '0x0')
    if (Array.isArray(pubSignals)) {
      pubSignals = pubSignals.map((sig: unknown) =>
        typeof sig === 'string' && sig.trim().toLowerCase() === '0x' ? '0x0' : sig
      );
    }

    // Validate required fields that come from Self app
    if (!proof || !pubSignals) {
      console.log('Missing required fields from Self app');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: proof and pubSignals are required',
        receivedFields: Object.keys(req.body)
      });
    }

    console.log('Received from Self app:');
    console.log('- proof:', proof ? 'present' : 'missing');
    console.log('- pubSignals length:', pubSignals?.length || 0);
    console.log('- userDefinedData:', userDefinedData);
    console.log('- userId:', userId);
    console.log('- receivedUserContextData:', receivedUserContextData);
    
    // Define attestationId (1 for passport, 2 for EU ID card)
    // For now, we'll use passport as the default since it's most common
    const attestationId: AttestationId = 1;
    
    // Use the EXACT userContextData from the Self app to avoid hash mismatch
    // The Self app generates userContextData internally and we must use it exactly
    let userContextData: string;
    
    if (receivedUserContextData !== undefined) {
      // Use the userContextData from the Self app (even if empty string)
      userContextData = receivedUserContextData;
      console.log('Using userContextData from Self app:', userContextData.length > 0 ? `${userContextData.substring(0, 64)}...` : '(empty string)');
    } else {
      // Fallback: Generate userContextData if Self app doesn't send it
      userContextData = generateUserContextData({
        userId: userId || 'default-user',
        scope: 'my-application-scope',
        endpoint: 'https://9b05-217-112-231-162.ngrok-free.app/api/verify',
        customData: {
          action: 'verification',
          userDefinedData: userDefinedData || 'test'
        }
      });
      console.log('Generated fallback userContextData (first 64 chars):', userContextData.substring(0, 64));
    }

    // Sanitize userContextData to avoid BigInt conversion issues (Self SDK fails on `0x` or empty)
    if (!userContextData || userContextData.trim() === '' || userContextData.trim().toLowerCase() === '0x') {
      console.warn('Received invalid userContextData (empty or 0x). Regenerating userContextData.');
      userContextData = generateUserContextData({
        userId: userId || 'default-user',
        scope: 'my-application-scope',
        endpoint: 'https://9b05-217-112-231-162.ngrok-free.app/api/verify',
        customData: {
          action: 'verification',
          userDefinedData: userDefinedData || 'test'
        }
      });
      console.log('Regenerated userContextData (first 64 chars):', userContextData.substring(0, 64));
    }
    
    console.log('Calling verifier.verify with:');
    console.log('- attestationId:', attestationId);
    console.log('- userContextData (length):', userContextData.length);
    console.log('- userContextData (first 64 chars):', userContextData.substring(0, 64));
    
    // Call the verification method as requested by Self protocol team
    const result = await verifier.verify(attestationId, proof, pubSignals, userContextData);
    
    console.log('✅ Verification successful!', result);
    
    // Return a success response that Self app expects
    return res.status(200).json({
      status: 'success',
      result: true,
      verified: true,
      message: 'Identity verification successful',
      verificationResult: result,
      verificationTimestamp: Date.now()
    });
    
  } catch (error: unknown) {
    console.error('💥 Verification error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return res.status(500).json({
      status: 'error',
      result: false,
      message: errorMessage
    });
  }
} 