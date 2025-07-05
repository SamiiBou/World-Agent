   // backend/routes/selfVerify.js
   const express = require('express');
   const router = express.Router();

   const {
     SelfBackendVerifier,
     InMemoryConfigStore
   } = require('@selfxyz/core');
   const { generateUserContextData } = require('../utils/generateUserContextData');
   const SelfId = require('../models/SelfId');

   // Simple in-memory store for recent verifications (in production, use Redis or database)
   const recentVerifications = new Map();
   const VERIFICATION_EXPIRY = 5 * 60 * 1000; // 5 minutes

   // Configure storage with verification requirements
   const configStorage = new InMemoryConfigStore(
     async () => {
       // For now, use a standard config for all users
       // You can extend this to have different configs based on user actions
       return 'standard_config';
     }
   );

   // Set up configuration (using async IIFE to handle await at top level)
   (async () => {
     await configStorage.setConfig('standard_config', {
       minimumAge: 18,  // Using minimumAge instead of olderThan for consistency
       excludedCountries: ['IRN', 'PRK'], // Iran and North Korea
       ofac: true
     });
   })();

   // Initialize verifier
   const allowedIds = new Map();
   allowedIds.set(1, true); // Passports
   allowedIds.set(2, true); // EU ID cards

   const verifier = new SelfBackendVerifier(
     'my-application-scope',
     'https://5c65-83-144-23-154.ngrok-free.app/api/verify',
     false,
     allowedIds,
     configStorage,
     'uuid'  // User identifier type
   );

   router.post('/verify', async (req, res) => {
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
         pubSignals = pubSignals.map((sig) =>
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
       const attestationId = 1;
       
       // Use the EXACT userContextData from the Self app to avoid hash mismatch
       // The Self app generates userContextData internally and we must use it exactly
       let userContextData;
       
       if (receivedUserContextData !== undefined) {
         // Use the userContextData from the Self app (even if empty string)
         userContextData = receivedUserContextData;
         console.log('Using userContextData from Self app:', userContextData.length > 0 ? `${userContextData.substring(0, 64)}...` : '(empty string)');
       } else {
         // Fallback: Generate userContextData if Self app doesn't send it
         userContextData = generateUserContextData({
           userId: userId || 'default-user',
           scope: 'my-application-scope',
           endpoint: 'https://5c65-83-144-23-154.ngrok-free.app/',
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
           endpoint: 'https://5c65-83-144-23-154.ngrok-free.app/api/verify',
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
       
       // Persist verification to MongoDB SelfId collection
       const uniqueHash = result.discloseOutput?.nullifier?.toString();
       try {
         await SelfId.findOneAndUpdate(
           { uniqueHash },
           {
             uniqueHash,
             proof,
             pubSignals,
             isValidDetails: result.isValidDetails,
             forbiddenCountriesList: result.forbiddenCountriesList,
             discloseOutput: result.discloseOutput,
             verifiedAt: new Date()
           },
           { upsert: true, setDefaultsOnInsert: true }
         );
       } catch (dbErr) {
         console.error('Error saving SelfId verification:', dbErr);
       }
       
       // Store verification result for frontend retrieval
       const verificationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
       const verificationRecord = {
         id: verificationId,
         result,
         timestamp: Date.now(),
         userId: userId,
         userIdentifier: result.userData?.userIdentifier,
         userData: result.userData,
         discloseOutput: result.discloseOutput
       };
       
       recentVerifications.set(verificationId, verificationRecord);
       
       // Clean up old verifications
       const now = Date.now();
       for (const [id, record] of recentVerifications.entries()) {
         if (now - record.timestamp > VERIFICATION_EXPIRY) {
           recentVerifications.delete(id);
         }
       }
       
       // Return a success response that Self app expects
       return res.status(200).json({
         status: 'success',
         result: true,
         verified: true,
         message: 'Identity verification successful',
         verificationResult: result,
         verificationTimestamp: Date.now(),
         verificationId: verificationId, // Include ID for frontend retrieval
         userIdentifier: result.userData?.userIdentifier // Include userIdentifier directly
       });
       
     } catch (error) {
       console.error('💥 Verification error:', error);
       
       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
       
       return res.status(500).json({
         status: 'error',
         result: false,
         message: errorMessage
       });
     }
   });

   // Endpoint to fetch verification result by ID
   router.get('/verification/:id', (req, res) => {
     try {
       const { id } = req.params;
       const verification = recentVerifications.get(id);
       
       if (!verification) {
         return res.status(404).json({
           success: false,
           message: 'Verification not found or expired'
         });
       }
       
       // Check if verification is still valid (not expired)
       const now = Date.now();
       if (now - verification.timestamp > VERIFICATION_EXPIRY) {
         recentVerifications.delete(id);
         return res.status(404).json({
           success: false,
           message: 'Verification has expired'
         });
       }
       
       return res.status(200).json({
         success: true,
         verification: {
           id: verification.id,
           timestamp: verification.timestamp,
           userIdentifier: verification.userIdentifier,
           userData: verification.userData,
           discloseOutput: verification.discloseOutput,
           isValidDetails: verification.result?.isValidDetails,
           forbiddenCountriesList: verification.result?.forbiddenCountriesList,
           isVerified: true
         }
       });
       
     } catch (error) {
       console.error('Error fetching verification:', error);
       return res.status(500).json({
         success: false,
         message: 'Internal server error'
       });
     }
   });
   
   // Endpoint to get the latest verification for a user
   router.get('/latest-verification', (req, res) => {
     try {
       const { userId } = req.query;
       
       // Find the most recent verification for this user
       let latestVerification = null;
       let latestTimestamp = 0;
       
       for (const [id, record] of recentVerifications.entries()) {
         if (record.userId === userId && record.timestamp > latestTimestamp) {
           latestVerification = record;
           latestTimestamp = record.timestamp;
         }
       }
       
       if (!latestVerification) {
         return res.status(404).json({
           success: false,
           message: 'No recent verification found for this user'
         });
       }
       
       // Check if verification is still valid (not expired)
       const now = Date.now();
       if (now - latestVerification.timestamp > VERIFICATION_EXPIRY) {
         recentVerifications.delete(latestVerification.id);
         return res.status(404).json({
           success: false,
           message: 'Verification has expired'
         });
       }
       
       return res.status(200).json({
         success: true,
         verification: {
           id: latestVerification.id,
           timestamp: latestVerification.timestamp,
           userIdentifier: latestVerification.userIdentifier,
           userData: latestVerification.userData,
           discloseOutput: latestVerification.discloseOutput,
           isValidDetails: latestVerification.result?.isValidDetails,
           forbiddenCountriesList: latestVerification.result?.forbiddenCountriesList,
           isVerified: true
         }
       });
       
     } catch (error) {
       console.error('Error fetching latest verification:', error);
       return res.status(500).json({
         success: false,
         message: 'Internal server error'
       });
     }
   });

   module.exports = router;