const mongoose = require('mongoose');

// Schema for agents
const agentSchema = new mongoose.Schema({
  // General information
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  description: {
    type: String,
    default: '',
    maxlength: 500
  },
  avatar: {
    type: String,
    default: '🤖'
  },
  
  // Username for the agent
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
    unique: true
  },
  
  // World Chain information
  worldchain: {
    address: {
      type: String,
      required: true,
      unique: true,
      match: /^0x[a-fA-F0-9]{40}$/
    },
    privateKey: {
      type: String,
      required: true
    },
    mnemonic: {
      type: String,
      required: true
    },
    balance: {
      type: String,
      default: '0'
    },
    lastBalanceUpdate: {
      type: Date,
      default: Date.now
    }
  },

  selfId: {
    uniqueHash: {
      type: String,
      default: '',
      index: true,
      sparse: true
    },
    isValidDetails: {
      isValid: {
        type: Boolean,
        default: false
      },
      isMinimumAgeValid: {
        type: Boolean,
        default: false
      },
      isOfacValid: {
        type: Boolean,
        default: false
      }
    },
    forbiddenCountriesList: {
      type: [String],
      default: []
    },
  },

  // Smart contract registry information
  registry: {
    isRegistered: {
      type: Boolean,
      default: false
    },
    registrationTxHash: {
      type: String,
      default: ''
    },
    registrationBlockNumber: {
      type: Number,
      default: 0
    },
    registrationTimestamp: {
      type: Date
    }
  },

  // Agent owner
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Owner's wallet address (for easier queries)
  ownerWalletAddress: {
    type: String,
    required: true,
    match: /^0x[a-fA-F0-9]{40}$/
  },

  // Statistics
  stats: {
    totalTransactions: {
      type: Number,
      default: 0
    },
    totalInteractions: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  
  // Configuration
  config: {
    isActive: {
      type: Boolean,
      default: true
    },
    capabilities: [{
      type: String,
      enum: ['worldchain_balance', 'worldchain_transfer', 'web3_balance', 'web3_transfer', 'file_read', 'file_write', 'api_call']
    }],
    maxTransactionAmount: {
      type: Number,
      default: 1.0 // ETH
    }
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update updatedAt
agentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance methods
agentSchema.methods.updateBalance = async function(newBalance) {
  this.worldchain.balance = newBalance;
  this.worldchain.lastBalanceUpdate = Date.now();
  return this.save();
};

agentSchema.methods.incrementTransactions = async function() {
  this.stats.totalTransactions += 1;
  this.stats.lastActivity = Date.now();
  return this.save();
};

agentSchema.methods.incrementInteractions = async function() {
  this.stats.totalInteractions += 1;
  this.stats.lastActivity = Date.now();
  return this.save();
};

agentSchema.methods.getPublicInfo = function() {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    avatar: this.avatar,
    username: this.username,
    address: this.worldchain.address,
    balance: this.worldchain.balance,
    lastBalanceUpdate: this.worldchain.lastBalanceUpdate,
    owner: this.owner,
    ownerWalletAddress: this.ownerWalletAddress,
    registry: this.registry,
    stats: this.stats,
    config: {
      isActive: this.config.isActive,
      capabilities: this.config.capabilities
    },
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Static methods
agentSchema.statics.findActiveAgents = function() {
  return this.find({ 'config.isActive': true });
};

agentSchema.statics.findByAddress = function(address) {
  return this.findOne({ 'worldchain.address': address });
};

agentSchema.statics.findByOwner = function(ownerId) {
  return this.find({ 'owner': ownerId });
};

agentSchema.statics.findByOwnerWallet = function(walletAddress) {
  return this.find({ 'ownerWalletAddress': walletAddress.toLowerCase() });
};

// Indexes for performance
agentSchema.index({ 'worldchain.address': 1 });
agentSchema.index({ 'config.isActive': 1 });
agentSchema.index({ 'owner': 1 });
agentSchema.index({ 'ownerWalletAddress': 1 });
agentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Agent', agentSchema); 