const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');

const Agent = require('../models/Agent');
const User = require('../models/User');
const VC = require('../models/VC');
const vcService = require('../services/vcService');

// DApp signer for signing VCs
const dappSigner = new ethers.Wallet(
  process.env.DAPP_PRIVATE_KEY || '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  new ethers.JsonRpcProvider(process.env.WORLD_CHAIN_RPC_URL)
);

/**
 * Link an agent to a user and generate a VC
 * POST /api/agents/:agentId/link
 * Body: { walletAddress, declaration }
 */
router.post('/:agentId/link', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { walletAddress, declaration } = req.body;

    console.log('=== AGENT LINKING REQUEST ===');
    console.log('Agent ID:', agentId);
    console.log('Wallet Address:', walletAddress);
    console.log('Declaration:', declaration);

    // Validate required fields
    if (!walletAddress || !declaration) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: walletAddress and declaration are required'
      });
    }

    // Validate addresses
    if (!ethers.isAddress(agentId) || !ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address format'
      });
    }

    // Find the agent
    const agent = await Agent.findOne({ 'worldchain.address': agentId });
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Find the user by wallet address
    const user = await User.findByWalletAddress(walletAddress);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please complete identity verification first.'
      });
    }

    // Check if user has at least one identity verification
    const hasSelfId = user.selfIdVerification && user.selfIdVerification.isVerified;
    const hasWorldId = user.worldIdVerification && user.worldIdVerification.isVerified;

    if (!hasSelfId && !hasWorldId) {
      return res.status(400).json({
        success: false,
        message: 'User must have at least one identity verification (Self ID or World ID)'
      });
    }

    // Check if agent is already linked to this user
    const existingVC = await VC.findOne({ 
      agentId: agentId,
      userRef: user._id
    });

    if (existingVC) {
      return res.status(400).json({
        success: false,
        message: 'Agent is already linked to this user',
        existingVC: existingVC.getSummary()
      });
    }

    // Assemble the VC
    const vc = await vcService.assembleAgentVC({
      agentId: agentId,
      user: user,
      declaration: declaration
    });

    console.log('✅ VC assembled successfully');

    // Generate VC hash
    const vcHash = vcService.generateVCHash(vc);

    // Create VC document in database
    const vcDoc = new VC({
      vcId: vc.vcId,
      agentId: vc.agentId,
      humanProof: vc.humanProof,
      declaration: vc.declaration,
      issuer: vc.issuer,
      schemaUrl: vc.schemaUrl,
      issuedAt: vc.issuedAt,
      version: vc.version,
      vcHash: vcHash,
      status: 'issued',
      userRef: user._id,
      agentRef: agent._id
    });

        // Sign the VC with DApp signature
    try {
      const dappSignature = await dappSigner.signMessage(ethers.getBytes(vcHash));
      await vcDoc.sign(dappSignature, dappSigner.address);
      console.log('✅ VC signed by DApp successfully');
    } catch (error) {
      console.error('DApp signature failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to sign VC with DApp signature'
      });
    }

    // Save VC to database
    await vcDoc.save();

    // Link agent to user
    await user.linkAgent(agent._id);

    // Update agent with Self ID reference (if available)
    if (hasSelfId) {
      agent.selfId.uniqueHash = user.selfIdVerification.userIdentifier;
      await agent.save();
    }

    console.log('✅ Agent linked successfully');

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Agent linked successfully and VC generated',
      vc: vcDoc.getSummary(),
      vcHash: vcHash,
      agent: agent.getPublicInfo(),
      user: user.getPublicInfo()
    });

  } catch (error) {
    console.error('💥 Agent linking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error linking agent',
      error: error.message
    });
  }
});

/**
 * Get VC for an agent
 * GET /api/agents/:agentId/vc
 */
router.get('/:agentId/vc', async (req, res) => {
  try {
    const { agentId } = req.params;

    // Validate agent address
    if (!ethers.isAddress(agentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid agent address format'
      });
    }

    // Find VCs for this agent
    const vcs = await VC.findByAgent(agentId);

    if (vcs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No VCs found for this agent'
      });
    }

    // Return the most recent VC
    const latestVC = vcs.sort((a, b) => b.createdAt - a.createdAt)[0];

    res.json({
      success: true,
      vc: latestVC.toVC(),
      summary: latestVC.getSummary(),
      vcHash: latestVC.vcHash
    });

  } catch (error) {
    console.error('Error fetching agent VC:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching agent VC',
      error: error.message
    });
  }
});

/**
 * Get all VCs for a user
 * GET /api/users/:walletAddress/vcs
 */
router.get('/users/:walletAddress/vcs', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    // Validate wallet address
    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address format'
      });
    }

    // Find VCs for this user
    const vcs = await VC.findByWallet(walletAddress);

    res.json({
      success: true,
      count: vcs.length,
      vcs: vcs.map(vc => vc.getSummary())
    });

  } catch (error) {
    console.error('Error fetching user VCs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user VCs',
      error: error.message
    });
  }
});



/**
 * Verify a VC signature
 * POST /api/vcs/:vcId/verify
 */
router.post('/vcs/:vcId/verify', async (req, res) => {
  try {
    const { vcId } = req.params;

    // Find the VC
    const vcDoc = await VC.findOne({ vcId: vcId });
    if (!vcDoc) {
      return res.status(404).json({
        success: false,
        message: 'VC not found'
      });
    }

    // Check if VC is signed
    if (!vcDoc.signature) {
      return res.status(400).json({
        success: false,
        message: 'VC is not signed'
      });
    }

    // Verify the signature
    const vc = vcDoc.toVC();
    const isValid = await vcService.verifyVCSignature(vc);

    res.json({
      success: true,
      isValid: isValid,
      vc: vcDoc.getSummary(),
      message: isValid ? 'VC signature is valid' : 'VC signature is invalid'
    });

  } catch (error) {
    console.error('Error verifying VC:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying VC',
      error: error.message
    });
  }
});

module.exports = router; 