const express = require('express');
const router = express.Router();
const { verifyCloudProof } = require('@worldcoin/minikit-js');
const User = require('../models/User');

// World ID verification endpoint
router.post('/verify', async (req, res) => {
  try {
    console.log('=== WORLD ID VERIFICATION REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { payload, action, signal, walletAddress } = req.body;
    
    // Validate required fields
    if (!payload || !action || !walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: payload, action, and walletAddress are required'
      });
    }
    
    // Validate wallet address format
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address format'
      });
    }
    
    // Validate action matches our configured action
    if (action !== 'poh') {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Expected "poh"'
      });
    }
    
    // Validate payload structure
    if (!payload.proof || !payload.merkle_root || !payload.nullifier_hash) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload structure. Missing proof, merkle_root, or nullifier_hash'
      });
    }
    
    console.log('Verification request for:');
    console.log('- Wallet Address:', walletAddress);
    console.log('- Action:', action);
    console.log('- Signal:', signal);
    console.log('- Verification Level:', payload.verification_level);
    console.log('- Nullifier Hash:', payload.nullifier_hash);
    
    // Check if this nullifier hash has already been used
    const existingVerification = await User.findOne({
      'worldIdVerification.nullifierHash': payload.nullifier_hash
    });
    
    if (existingVerification) {
      return res.status(400).json({
        success: false,
        message: 'This World ID has already been used for verification',
        errorCode: 'ALREADY_VERIFIED'
      });
    }
    
    // Verify the proof with World ID
    const app_id = process.env.WORLD_ID_APP_ID || 'app_2129675f92413391ca585881fea09ac0';
    
    console.log('Verifying proof with World ID cloud...');
    console.log('- App ID:', app_id);
    console.log('- Action:', action);
    console.log('- Signal:', signal);
    
    // Format the payload for verifyCloudProof
    const verificationPayload = {
      merkle_root: payload.merkle_root,
      nullifier_hash: payload.nullifier_hash,
      proof: payload.proof,
      verification_level: payload.verification_level
    };
    
    console.log('Formatted verification payload:', verificationPayload);
    
    const verifyRes = await verifyCloudProof(verificationPayload, app_id, action, signal);
    
    console.log('World ID verification result:', verifyRes);
    
    if (!verifyRes.success) {
      return res.status(400).json({
        success: false,
        message: 'World ID verification failed',
        error: verifyRes.error,
        details: verifyRes.detail
      });
    }
    
    // Find or create user
    let user = await User.findByWalletAddress(walletAddress);
    
    if (!user) {
      console.log('Creating new user for wallet:', walletAddress);
      user = new User({
        walletAddress: walletAddress.toLowerCase()
      });
    } else {
      console.log('Updating existing user:', user._id);
    }
    
    // Update user with World ID verification
    await user.verifyWorldId(payload);
    
    console.log('✅ World ID verification successful and stored!');
    
    // Return success response
    res.json({
      success: true,
      message: 'World ID verification successful',
      user: user.getPublicInfo(),
      verificationResult: {
        nullifierHash: payload.nullifier_hash,
        verificationLevel: payload.verification_level,
        verificationDate: new Date()
      }
    });
    
  } catch (error) {
    console.error('💥 World ID verification error:', error);
    
    // Handle specific World ID errors
    if (error.message && error.message.includes('already verified')) {
      return res.status(400).json({
        success: false,
        message: 'This World ID has already been used',
        errorCode: 'ALREADY_VERIFIED'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'World ID verification failed',
      error: error.message || 'Unknown error'
    });
  }
});

// Get user verification status
router.get('/status/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    // Validate wallet address format
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address format'
      });
    }
    
    const user = await User.findByWalletAddress(walletAddress);
    
    if (!user) {
      return res.json({
        success: true,
        verified: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      verified: user.worldIdVerification.isVerified,
      user: user.getPublicInfo()
    });
    
  } catch (error) {
    console.error('Error checking verification status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking verification status',
      error: error.message
    });
  }
});

module.exports = router; 