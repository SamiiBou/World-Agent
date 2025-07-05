const mongoose = require('mongoose');

// Schema pour les utilisateurs
const userSchema = new mongoose.Schema({
  // Informations générales
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    match: /^0x[a-fA-F0-9]{40}$/
  },
  
  // Informations World ID
  worldIdVerification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    nullifierHash: {
      type: String,
      unique: true,
      sparse: true  // Permet les valeurs null/undefined
    },
    proof: {
      type: String
    },
    merkleRoot: {
      type: String
    },
    verificationLevel: {
      type: String,
      enum: ['device', 'orb']
    },
    actionId: {
      type: String,
      default: 'poh'
    },
    verificationDate: {
      type: Date
    },
    appId: {
      type: String,
      default: 'app_2129675f92413391ca585881fea09ac0'
    }
  },
  
  // Informations Self ID (pour futur usage)
  selfIdVerification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    userIdentifier: {
      type: String,
      unique: true,
      sparse: true
    },
    verificationDate: {
      type: Date
    },
    verificationData: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  
  // Agents liés à cet utilisateur
  linkedAgents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent'
  }],
  
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

// Middleware pour mettre à jour updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Méthodes d'instance
userSchema.methods.verifyWorldId = async function(verificationData) {
  this.worldIdVerification = {
    isVerified: true,
    nullifierHash: verificationData.nullifier_hash,
    proof: verificationData.proof,
    merkleRoot: verificationData.merkle_root,
    verificationLevel: verificationData.verification_level,
    actionId: 'poh',
    verificationDate: new Date(),
    appId: 'app_2129675f92413391ca585881fea09ac0'
  };
  this.stats.lastActivity = Date.now();
  return this.save();
};

userSchema.methods.linkAgent = async function(agentId) {
  if (!this.linkedAgents.includes(agentId)) {
    this.linkedAgents.push(agentId);
    return this.save();
  }
  return this;
};

userSchema.methods.getPublicInfo = function() {
  return {
    id: this._id,
    walletAddress: this.walletAddress,
    worldIdVerification: {
      isVerified: this.worldIdVerification.isVerified,
      verificationLevel: this.worldIdVerification.verificationLevel,
      verificationDate: this.worldIdVerification.verificationDate
    },
    selfIdVerification: {
      isVerified: this.selfIdVerification.isVerified,
      verificationDate: this.selfIdVerification.verificationDate
    },
    linkedAgents: this.linkedAgents,
    stats: this.stats,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Méthodes statiques
userSchema.statics.findByWalletAddress = function(walletAddress) {
  return this.findOne({ walletAddress: walletAddress.toLowerCase() });
};

userSchema.statics.findVerifiedUsers = function() {
  return this.find({ 
    $or: [
      { 'worldIdVerification.isVerified': true },
      { 'selfIdVerification.isVerified': true }
    ]
  });
};

// Index pour les performances
userSchema.index({ walletAddress: 1 });
userSchema.index({ 'worldIdVerification.nullifierHash': 1 });
userSchema.index({ 'worldIdVerification.isVerified': 1 });
userSchema.index({ 'selfIdVerification.userIdentifier': 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema); 