const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { ethers } = require('ethers');
const crypto = require('crypto');
require('dotenv').config();

const Agent = require('./models/Agent');
const User = require('./models/User');
const worldchainService = require('./services/worldchainService');
const agentRegistryService = require('./services/agentRegistryService');
const worldIdVerifyRoute = require('./routes/worldIdVerify');
const selfVerifyRoute = require('./routes/selfVerify');

const app = express();
const PORT = process.env.PORT || 3001;

// Proxy trust configuration (required for rate limiting)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.PUBLIC_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limits each IP to 100 requests per window
});
app.use('/api/', limiter);

// JSON parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple wallet authentication middleware
const authenticateWallet = async (req, res, next) => {
  try {
    const walletAddress = req.headers['x-wallet-address'];
    
    if (!walletAddress) {
      return res.status(401).json({
        error: 'Wallet address is required in headers (x-wallet-address)'
      });
    }
    
    // Validate wallet address format
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(401).json({
        error: 'Invalid wallet address format'
      });
    }
    
    // Find or create user
    let user = await User.findByWalletAddress(walletAddress);
    
    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        walletAddress: walletAddress.toLowerCase(),
        username: null
      });
      await user.save();
    }
    
    // Attach user to request
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      details: error.message
    });
  }
};

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agent-web3';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Routes

// 🏠 Base route
app.get('/', (req, res) => {
  res.json({
    message: '🌍 Agent Web3 Backend - World Chain Integration',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 📊 Server status
app.get('/api/status', async (req, res) => {
  try {
    const isWorldChainConnected = await worldchainService.isConnected();
    const networkInfo = await worldchainService.getNetworkInfo();
    const agentCount = await Agent.countDocuments();
    const activeAgentCount = await Agent.countDocuments({ 'config.isActive': true });

    res.json({
      status: 'ok',
      worldchain: {
        connected: isWorldChainConnected,
        ...networkInfo
      },
      database: {
        connected: mongoose.connection.readyState === 1,
        totalAgents: agentCount,
        activeAgents: activeAgentCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server status check failed',
      details: error.message
    });
  }
});

// 🤖 Create a new agent (with authentication)
app.post('/api/agents', authenticateWallet, async (req, res) => {
  try {
    console.log('🚀 === STARTING AGENT CREATION ===');
    const { name, description, avatar, capabilities } = req.body;
    const user = req.user;
    
    console.log('📝 Request body:', { name, description, avatar, capabilities });
    console.log('👤 User data:', {
      id: user._id,
      walletAddress: user.walletAddress,
      username: user.username,
      worldIdVerified: user.worldIdVerification?.isVerified,
      selfIdVerified: user.selfIdVerification?.isVerified
    });
    
    // Validate required fields
    if (!name || name.trim().length < 2) {
      console.log('❌ Agent name validation failed');
      return res.status(400).json({
        error: 'Agent name is required (minimum 2 characters)'
      });
    }
    
    // Generate a unique username for the agent based on the user's username
    if (!user.username || user.username.trim().length < 2) {
      console.log('❌ User username validation failed');
      return res.status(400).json({
        error: 'User must have a valid username. Please reconnect your wallet to ensure your username is properly retrieved.'
      });
    }
    
    // Generate unique username for the agent
    const baseUsername = user.username.trim();
    let username = baseUsername;
    let counter = 1;
    
    console.log('🔍 Checking username availability...');
    
    // Check if username is already taken and increment counter if needed
    while (true) {
      const existingAgent = await Agent.findOne({ username: username });
      if (!existingAgent) {
        break; // Username is available
      }
      counter++;
      username = `${baseUsername}_${counter}`;
      console.log(`🔄 Username ${baseUsername} taken, trying ${username}`);
    }
    
    console.log('✅ Generated unique username:', username);
    
    // Check if user has both World ID and Self ID verifications
    if (!user.worldIdVerification?.isVerified) {
      console.log('❌ World ID verification missing');
      console.log('🔍 World ID verification data:', user.worldIdVerification);
      return res.status(400).json({
        error: 'World ID verification is required to create an agent'
      });
    }
    
    if (!user.selfIdVerification?.isVerified) {
      console.log('❌ Self ID verification missing');
      console.log('🔍 Self ID verification data:', user.selfIdVerification);
      return res.status(400).json({
        error: 'Self ID verification is required to create an agent'
      });
    }
    
    console.log('✅ All validations passed');
    
    // Generate a World Chain address
    console.log('🔑 Generating World Chain wallet...');
    const wallet = ethers.Wallet.createRandom();
    const address = wallet.address;
    console.log('✅ Generated wallet address:', address);
    
    // Get nullifiers from user verifications
    console.log('🔍 Extracting nullifiers from user verifications...');
    const worldIdNullifier = user.worldIdVerification?.nullifierHash || '';
    const selfIdNullifier = user.selfIdVerification?.verificationResult?.discloseOutput?.nullifier || '';
    
    console.log('🔐 Nullifiers extracted:', {
      worldIdNullifier: worldIdNullifier,
      selfIdNullifier: selfIdNullifier,
      worldIdNullifierLength: worldIdNullifier.length,
      selfIdNullifierLength: selfIdNullifier.length
    });
    
    // Create the agent with owner information
    console.log('📄 Creating agent in database...');
    const agent = new Agent({
      name: name.trim(),
      description: description?.trim() || '',
      avatar: avatar || '🤖',
      username: username,
      owner: user._id,
      ownerWalletAddress: user.walletAddress,
      worldchain: {
        address: address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic.phrase,
        balance: '0'
      },
      stats: {
        totalTransactions: 0,
        totalInteractions: 0,
        lastActivity: new Date()
      },
      config: {
        isActive: true,
        capabilities: capabilities || ['worldchain_balance', 'worldchain_transfer', 'web3_balance', 'api_call', 'file_read']
      }
    });

    console.log('💾 Saving agent to database...');
    await agent.save();
    console.log('✅ Agent saved to database with ID:', agent._id);
    
    // Register agent in smart contract
    try {
      console.log('🔗 === STARTING SMART CONTRACT REGISTRATION ===');
      console.log('📋 Registration parameters:', {
        agentAddress: address,
        worldIdNullifier: worldIdNullifier,
        selfIdNullifier: selfIdNullifier,
        username: username
      });
      
      console.log('🔄 Calling agentRegistryService.registerAgent...');
      const registrationResult = await agentRegistryService.registerAgent(
        address,
        worldIdNullifier,
        selfIdNullifier,
        username
      );
      
      console.log('📤 Smart contract registration result:', registrationResult);
      
      // Update agent with registry information
      console.log('📝 Updating agent with registry information...');
      agent.registry = {
        isRegistered: true,
        registrationTxHash: registrationResult.txHash,
        registrationBlockNumber: registrationResult.blockNumber,
        registrationTimestamp: registrationResult.timestamp
      };
      
      console.log('💾 Saving updated agent with registry info...');
      await agent.save();
      
      console.log('✅ Agent successfully registered in smart contract');
      console.log('🔗 Transaction hash:', registrationResult.txHash);
      
    } catch (contractError) {
      console.error('❌ === SMART CONTRACT REGISTRATION FAILED ===');
      console.error('💥 Error details:', contractError);
      console.error('📊 Error stack:', contractError.stack);
      
      // Delete the agent from database if contract registration fails
      console.log('🗑️ Deleting agent from database due to contract failure...');
      await Agent.findByIdAndDelete(agent._id);
      console.log('✅ Agent deleted from database');
      
      return res.status(500).json({
        error: 'Failed to register agent in smart contract',
        details: contractError.message,
        note: 'Agent creation was cancelled due to blockchain registration failure'
      });
    }
    
    // Link agent to user
    console.log('🔗 Linking agent to user...');
    await user.linkAgent(agent._id);
    console.log('✅ Agent linked to user successfully');
    
    // Return the agent with clean info
    console.log('📤 Sending success response...');
    res.status(201).json({
      message: 'Agent created and registered successfully',
      agent: agent.getPublicInfo(),
      explorerUrl: `https://worldchain-mainnet.explorer.alchemy.com/address/${address}`,
      contractExplorerUrl: `https://worldchain-mainnet.explorer.alchemy.com/tx/${agent.registry.registrationTxHash}`,
      note: `Agent created with username "${username}" and registered in smart contract`
    });
    
    console.log('🎉 === AGENT CREATION COMPLETED SUCCESSFULLY ===');
  } catch (error) {
    console.error('❌ === AGENT CREATION FAILED ===');
    console.error('💥 Error type:', error.constructor.name);
    console.error('📝 Error message:', error.message);
    console.error('📊 Error stack:', error.stack);
    
    if (error.code) {
      console.error('🔢 Error code:', error.code);
    }
    
    res.status(500).json({
      error: 'Error creating agent',
      details: error.message
    });
  }
});

// 📋 List all agents (with option to filter by owner)
app.get('/api/agents', async (req, res) => {
  try {
    const { active, limit = 20, offset = 0, owner } = req.query;
    const walletAddress = req.headers['x-wallet-address'];
    
    let query = {};
    if (active !== undefined) {
      query['config.isActive'] = active === 'true';
    }
    
    // If owner=me is requested, filter by authenticated user
    if (owner === 'me' && walletAddress) {
      query['ownerWalletAddress'] = walletAddress.toLowerCase();
    }
    
    const agents = await Agent.find(query)
      .populate('owner', 'walletAddress worldIdVerification.isVerified selfIdVerification.isVerified')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const total = await Agent.countDocuments(query);
    
    res.json({
      agents: agents.map(agent => agent.getPublicInfo()),
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Agent list error:', error);
    res.status(500).json({
      error: 'Error retrieving agents',
      details: error.message
    });
  }
});

// 🔍 Get an agent by ID (with ownership verification for sensitive actions)
app.get('/api/agents/:id', async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id)
      .populate('owner', 'walletAddress worldIdVerification.isVerified selfIdVerification.isVerified');
    
    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found'
      });
    }
    
    res.json({
      agent: agent.getPublicInfo(),
      explorerUrl: `https://worldchain-mainnet.explorer.alchemy.com/address/${agent.worldchain.address}`,
      note: 'Agent information retrieved'
    });
  } catch (error) {
    console.error('Agent retrieval error:', error);
    res.status(500).json({
      error: 'Error retrieving agent',
      details: error.message
    });
  }
});

// 🏠 Get agents for the connected user
app.get('/api/my-agents', authenticateWallet, async (req, res) => {
  try {
    const user = req.user;
    const { active, limit = 20, offset = 0 } = req.query;
    
    let query = { owner: user._id };
    if (active !== undefined) {
      query['config.isActive'] = active === 'true';
    }
    
    const agents = await Agent.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const total = await Agent.countDocuments(query);
    
    res.json({
      agents: agents.map(agent => agent.getPublicInfo()),
      user: user.getPublicInfo(),
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (error) {
    console.error('My agents error:', error);
    res.status(500).json({
      error: 'Error retrieving your agents',
      details: error.message
    });
  }
});

// 💰 Get an agent's balance (with ownership verification)
app.get('/api/agents/:id/balance', async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    const walletAddress = req.headers['x-wallet-address'];
    
    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found'
      });
    }
    
    // Check if user owns this agent for sensitive information
    const isOwner = walletAddress && agent.ownerWalletAddress === walletAddress.toLowerCase();
    
    const balance = await worldchainService.getBalance(agent.worldchain.address);
    
    // Update agent balance
    agent.worldchain.balance = balance;
    agent.worldchain.lastBalanceUpdate = new Date();
    await agent.save();
    
    res.json({
      address: agent.worldchain.address,
      balance: balance,
      balanceFormatted: `${balance} ETH`,
      chainId: 480,
      chainName: 'World Chain',
      explorerUrl: `https://worldchain-mainnet.explorer.alchemy.com/address/${agent.worldchain.address}`,
      lastUpdate: agent.worldchain.lastBalanceUpdate,
      isOwner: isOwner
    });
  } catch (error) {
    console.error('Agent balance error:', error);
    res.status(500).json({
      error: 'Error retrieving balance',
      details: error.message
    });
  }
});

// 💸 Perform a transfer (with authentication and ownership verification)
app.post('/api/agents/:id/transfer', authenticateWallet, async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    const user = req.user;
    
    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found'
      });
    }
    
    // Verify ownership
    if (agent.owner.toString() !== user._id.toString()) {
      return res.status(403).json({
        error: 'You do not own this agent'
      });
    }
    
    const { to, amount } = req.body;
    
    // Validate parameters
    if (!to || !amount) {
      return res.status(400).json({
        error: 'Destination address and amount are required'
      });
    }
    
    // Validate destination address
    if (!ethers.utils.isAddress(to)) {
      return res.status(400).json({
        error: 'Invalid destination address'
      });
    }
    
    // Simulate transfer (in a real app, this would execute the actual transaction)
    const transactionHash = `0x${Math.random().toString(16).substring(2, 66)}`;
    
    // Update agent statistics
    agent.stats.totalTransactions += 1;
    agent.stats.lastActivity = new Date();
    await agent.save();
    
    // For simulation, we don't actually send the transaction
    res.json({
      message: 'Transfer simulated successfully',
      transaction: {
        hash: transactionHash,
        from: agent.worldchain.address,
        to: to,
        amount: amount,
        status: 'simulated',
        explorerUrl: `https://worldchain-mainnet.explorer.alchemy.com/tx/${transactionHash}`,
        timestamp: new Date()
      },
      note: 'This is a simulation - no real transaction was sent'
    });
  } catch (error) {
    console.error('Agent transfer error:', error);
    res.status(500).json({
      error: 'Error during transfer',
      details: error.message
    });
  }
});

// 🔍 Verify agent in smart contract
app.get('/api/agents/:id/verify', async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    
    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found'
      });
    }

    // Check in smart contract
    try {
      await agentRegistryService.initialize();
      const contractAgent = await agentRegistryService.getAgent(agent.worldchain.address);
      
      res.json({
        agent: {
          id: agent._id,
          name: agent.name,
          username: agent.username,
          address: agent.worldchain.address
        },
        registry: {
          isRegistered: true,
          contractData: {
            agentAddress: contractAgent.agentAddress,
            ownerWallet: contractAgent.ownerWallet,
            username: contractAgent.username,
            registrationTime: contractAgent.registrationTime,
            isActive: contractAgent.isActive,
            worldIdNullifier: contractAgent.worldIdNullifier,
            selfIdNullifier: contractAgent.selfIdNullifier
          },
          explorerUrl: `https://worldchain-mainnet.explorer.alchemy.com/address/${agent.worldchain.address}`,
          contractUrl: `https://worldchain-mainnet.explorer.alchemy.com/address/${agentRegistryService.getContractAddress()}`
        }
      });
    } catch (contractError) {
      res.json({
        agent: {
          id: agent._id,
          name: agent.name,
          username: agent.username,
          address: agent.worldchain.address
        },
        registry: {
          isRegistered: false,
          error: contractError.message,
          explorerUrl: `https://worldchain-mainnet.explorer.alchemy.com/address/${agent.worldchain.address}`,
          contractUrl: `https://worldchain-mainnet.explorer.alchemy.com/address/${agentRegistryService.getContractAddress()}`
        }
      });
    }
  } catch (error) {
    console.error('Agent verification error:', error);
    res.status(500).json({
      error: 'Error verifying agent',
      details: error.message
    });
  }
});

// 📊 Get registry statistics
app.get('/api/registry/stats', async (req, res) => {
  try {
    await agentRegistryService.initialize();
    
    const totalAgents = await agentRegistryService.getContract().getTotalAgents();
    const dbAgents = await Agent.countDocuments();
    const registeredAgents = await Agent.countDocuments({ 'registry.isRegistered': true });
    
    res.json({
      smartContract: {
        totalAgents: totalAgents.toString(),
        contractAddress: agentRegistryService.getContractAddress(),
        explorerUrl: `https://worldchain-mainnet.explorer.alchemy.com/address/${agentRegistryService.getContractAddress()}`
      },
      database: {
        totalAgents: dbAgents,
        registeredAgents: registeredAgents,
        unregisteredAgents: dbAgents - registeredAgents
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Registry stats error:', error);
    res.status(500).json({
      error: 'Error getting registry statistics',
      details: error.message
    });
  }
});

// 👥 Get agents by owner from smart contract
app.get('/api/registry/agents/:ownerAddress', async (req, res) => {
  try {
    const { ownerAddress } = req.params;
    
    if (!ethers.isAddress(ownerAddress)) {
      return res.status(400).json({
        error: 'Invalid owner address'
      });
    }
    
    await agentRegistryService.initialize();
    const agentAddresses = await agentRegistryService.getAgentsByOwner(ownerAddress);
    
    const agents = [];
    for (const agentAddress of agentAddresses) {
      try {
        const contractAgent = await agentRegistryService.getAgent(agentAddress);
        agents.push({
          address: contractAgent.agentAddress,
          username: contractAgent.username,
          registrationTime: contractAgent.registrationTime,
          isActive: contractAgent.isActive,
          explorerUrl: `https://worldchain-mainnet.explorer.alchemy.com/address/${contractAgent.agentAddress}`
        });
      } catch (error) {
        console.error(`Error getting agent ${agentAddress}:`, error);
      }
    }
    
    res.json({
      ownerAddress: ownerAddress,
      totalAgents: agentAddresses.length,
      agents: agents,
      explorerUrl: `https://worldchain-mainnet.explorer.alchemy.com/address/${ownerAddress}`
    });
  } catch (error) {
    console.error('Owner agents error:', error);
    res.status(500).json({
      error: 'Error getting owner agents',
      details: error.message
    });
  }
});

// 🗑️ Delete an agent (with authentication and ownership verification)
app.delete('/api/agents/:id', authenticateWallet, async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    const user = req.user;
    
    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found'
      });
    }
    
    // Verify ownership
    if (agent.owner.toString() !== user._id.toString()) {
      return res.status(403).json({
        error: 'You do not own this agent'
      });
    }
    
    // Remove agent from user's linkedAgents
    user.linkedAgents = user.linkedAgents.filter(id => id.toString() !== agent._id.toString());
    await user.save();
    
    await agent.deleteOne();
    
    res.json({
      message: 'Agent deleted successfully',
      deletedAgent: {
        id: agent._id,
        name: agent.name,
        address: agent.worldchain.address
      }
    });
  } catch (error) {
    console.error('Agent deletion error:', error);
    res.status(500).json({
      error: 'Error deleting agent',
      details: error.message
    });
  }
});

// 🔄 Update an agent (with authentication and ownership verification)
app.put('/api/agents/:id', authenticateWallet, async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    const user = req.user;
    
    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found'
      });
    }
    
    // Verify ownership
    if (agent.owner.toString() !== user._id.toString()) {
      return res.status(403).json({
        error: 'You do not own this agent'
      });
    }
    
    const { name, description, avatar, capabilities, isActive } = req.body;
    
    // Update fields if provided
    if (name !== undefined) agent.name = name.trim();
    if (description !== undefined) agent.description = description.trim();
    if (avatar !== undefined) agent.avatar = avatar;
    if (capabilities !== undefined) agent.config.capabilities = capabilities;
    if (isActive !== undefined) agent.config.isActive = isActive;
    
    await agent.save();
    
    res.json({
      message: 'Agent updated successfully',
      agent: agent.getPublicInfo()
    });
  } catch (error) {
    console.error('Agent update error:', error);
    res.status(500).json({
      error: 'Error updating agent',
      details: error.message
    });
  }
});

// Routes for World ID and Self Protocol
app.use('/api/worldid', worldIdVerifyRoute);
app.use('/api/self', selfVerifyRoute);

<<<<<<< HEAD
// Agent linking routes
const agentLinkRouter = require('./routes/agentLink');
app.use('/api/agents', agentLinkRouter);

// Route pour générer un nonce pour l'authentification SIWE
=======
// Route to generate a nonce for SIWE authentication
>>>>>>> 8bdda5020fdd53a48a029a262c6bce3db2d4b357
app.get('/api/nonce', (req, res) => {
  try {
    // Generate a nonce that is at least 8 alphanumeric characters
    const nonce = crypto.randomUUID().replace(/-/g, '');
    
    // In a production app, you would store this nonce securely
    // For now, we'll just return it and rely on the frontend to pass it back
    res.json({
      nonce: nonce,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Nonce generation error:', error);
    res.status(500).json({
      error: 'Error generating nonce',
      details: error.message
    });
  }
});

// Route to complete SIWE authentication
app.post('/api/complete-siwe', async (req, res) => {
  try {
    const { payload, nonce, userInfo } = req.body;
    
    // Validate required fields
    if (!payload || !nonce) {
      return res.status(400).json({
        error: 'Missing required fields: payload and nonce'
      });
    }
    
    // Basic validation of the payload
    if (payload.status !== 'success') {
      return res.status(400).json({
        error: 'Authentication failed',
        details: 'Invalid payload status'
      });
    }
    
    // In a production app, you would:
    // 1. Verify the nonce matches the one you generated
    // 2. Use verifySiweMessage from @worldcoin/minikit-js to verify the signature
    // 3. Store the user's wallet address and authentication state
    
    // For now, we'll do basic validation and store the user info
    const walletAddress = payload.address;
    
    if (!walletAddress) {
      return res.status(400).json({
        error: 'No wallet address provided'
      });
    }
    
    // Find or create user
    let user = await User.findByWalletAddress(walletAddress);
    
    if (!user) {
      user = new User({
        walletAddress: walletAddress.toLowerCase(),
        username: userInfo?.username || null
      });
      await user.save();
    } else {
      // Update username if provided and different
      if (userInfo?.username && user.username !== userInfo.username) {
        user.username = userInfo.username;
        await user.save();
      }
    }
    
    // Here you would typically save the user's authentication state
    // For now, we'll just return success
    res.json({
      status: 'success',
      isValid: true,
      walletAddress: walletAddress,
      username: userInfo?.username || null,
      user: user.getPublicInfo(),
      timestamp: new Date().toISOString(),
      message: 'Authentication successful'
    });
    
  } catch (error) {
    console.error('SIWE completion error:', error);
    res.status(500).json({
      status: 'error',
      isValid: false,
      error: 'Authentication verification failed',
      details: error.message
    });
  }
});

// Route to check authentication status
app.get('/api/auth-status/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Find user by wallet address
    const user = await User.findByWalletAddress(address);
    
    if (!user) {
      return res.json({
        isAuthenticated: false,
        walletAddress: address,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      isAuthenticated: true,
      walletAddress: address,
      user: user.getPublicInfo(),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Auth status check error:', error);
    res.status(500).json({
      error: 'Error checking authentication status',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message
  });
});

// 404 Route
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Server startup
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API available at: http://localhost:${PORT}/api`);
      console.log(`🌍 World Chain RPC: ${process.env.WORLD_CHAIN_RPC_URL}`);
      console.log(`💾 MongoDB: ${process.env.MONGODB_URI}`);
    }).on('error', (error) => {
      console.error('❌ Server startup error:', error);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

// Shutdown signal handling
process.on('SIGTERM', () => {
  console.log('🔄 Shutting down server...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Shutting down server...');
  process.exit(0);
});

startServer(); 