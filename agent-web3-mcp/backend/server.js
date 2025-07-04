const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const ethers = require('ethers');
require('dotenv').config();

const Agent = require('./models/Agent');
const worldchainService = require('./services/worldchainService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de sécurité
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite chaque IP à 100 requêtes par fenêtre
});
app.use('/api/', limiter);

// Middleware pour parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connexion MongoDB
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

// 🏠 Route de base
app.get('/', (req, res) => {
  res.json({
    message: '🌍 Agent Web3 Backend - World Chain Integration',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 📊 Status du serveur
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

// 🤖 Créer un nouvel agent
app.post('/api/agents', async (req, res) => {
  try {
    const { name, description, avatar, capabilities } = req.body;
    
    // Validate required fields
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        error: 'Agent name is required (minimum 2 characters)'
      });
    }
    
    // Generate a World Chain address
    const wallet = ethers.Wallet.createRandom();
    const address = wallet.address;
    
    // Create the agent
    const agent = new Agent({
      name: name.trim(),
      description: description?.trim() || '',
      avatar: avatar || '🤖',
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

    await agent.save();
    
    // Return the agent with clean info
    res.status(201).json({
      message: 'Agent created successfully',
      agent: agent.toCleanJSON(),
      explorerUrl: `https://worldchain-mainnet.explorer.alchemy.com/address/${address}`,
      note: 'Agent created with World Chain address'
    });
  } catch (error) {
    console.error('Agent creation error:', error);
    res.status(500).json({
      error: 'Error creating agent',
      details: error.message
    });
  }
});

// 📋 Lister tous les agents
app.get('/api/agents', async (req, res) => {
  try {
    const { active, limit = 20, offset = 0 } = req.query;
    
    let query = {};
    if (active !== undefined) {
      query['config.isActive'] = active === 'true';
    }
    
    const agents = await Agent.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const total = await Agent.countDocuments(query);
    
    res.json({
      agents: agents.map(agent => agent.toCleanJSON()),
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

// 🔍 Obtenir un agent par ID
app.get('/api/agents/:id', async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    
    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found'
      });
    }
    
    res.json({
      agent: agent.toCleanJSON(),
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

// 💰 Obtenir le solde d'un agent
app.get('/api/agents/:id/balance', async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    
    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found'
      });
    }
    
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
      lastUpdate: agent.worldchain.lastBalanceUpdate
    });
  } catch (error) {
    console.error('Agent balance error:', error);
    res.status(500).json({
      error: 'Error retrieving balance',
      details: error.message
    });
  }
});

// 💸 Effectuer un transfert
app.post('/api/agents/:id/transfer', async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    
    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found'
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

// 🗑️ Supprimer un agent
app.delete('/api/agents/:id', async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    
    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found'
      });
    }
    
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

// 🔄 Mettre à jour un agent
app.put('/api/agents/:id', async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    
    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found'
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
      agent: agent.toCleanJSON()
    });
  } catch (error) {
    console.error('Agent update error:', error);
    res.status(500).json({
      error: 'Error updating agent',
      details: error.message
    });
  }
});

// Middleware de gestion d'erreur
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message
  });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Démarrage du serveur
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
    console.error('❌ Erreur démarrage serveur:', error);
    process.exit(1);
  }
};

// Gestion des signaux de fermeture
process.on('SIGTERM', () => {
  console.log('🔄 Arrêt du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Arrêt du serveur...');
  process.exit(0);
});

startServer(); 