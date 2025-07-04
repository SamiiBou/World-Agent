const mongoose = require('mongoose');

// Schema pour les agents
const agentSchema = new mongoose.Schema({
  // Informations générales
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
  
  // Informations World Chain
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
  
  // Statistiques
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
  },
  createdBy: {
    type: String,
    default: 'system'
  }
});

// Middleware pour mettre à jour updatedAt
agentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Méthodes d'instance
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
    address: this.worldchain.address,
    balance: this.worldchain.balance,
    lastBalanceUpdate: this.worldchain.lastBalanceUpdate,
    stats: this.stats,
    config: {
      isActive: this.config.isActive,
      capabilities: this.config.capabilities
    },
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Méthodes statiques
agentSchema.statics.findActiveAgents = function() {
  return this.find({ 'config.isActive': true });
};

agentSchema.statics.findByAddress = function(address) {
  return this.findOne({ 'worldchain.address': address });
};

// Index pour les performances
agentSchema.index({ 'worldchain.address': 1 });
agentSchema.index({ 'config.isActive': 1 });
agentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Agent', agentSchema); 