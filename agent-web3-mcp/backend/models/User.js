const mongoose = require('mongoose');

// User schema for the application
const userSchema = new mongoose.Schema({
  // General information
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    match: /^0x[a-fA-F0-9]{40}$/
  },
  
  username: {
    type: String,
    required: false,
    trim: true,
    maxlength: 50
  },
  
  // World ID information - Complete proof storage
  worldIdVerification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    nullifierHash: {
      type: String,
      unique: true,
      sparse: true  // Allows null/undefined values
    },
    // Complete World ID proof storage
    fullProof: {
      proof: {
        type: String
      },
      merkleRoot: {
        type: String
      },
      nullifierHash: {
        type: String
      },
      verificationLevel: {
        type: String,
        enum: ['device', 'orb']
      }
    },
    // Verification data
    verificationData: {
      action: {
        type: String,
        default: 'poh'
      },
      signal: {
        type: String
      },
      appId: {
        type: String,
        default: 'app_2129675f92413391ca585881fea09ac0'
      },
      walletAddress: {
        type: String
      }
    },
    verificationDate: {
      type: Date
    },
    // World ID verification result
    verificationResult: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  
  // Self Protocol information - Complete proof storage
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
    // Complete Self Protocol proof storage
    fullProof: {
      attestationId: {
        type: Number
      },
      proof: {
        a: [String],
        b: [[String, String], [String, String]],
        c: [String],
        curve: String,
        protocol: String
      },
      publicSignals: [String],
      userContextData: {
        type: String
      }
    },
    // Self Protocol verification result
    verificationResult: {
      attestationId: Number,
      isValidDetails: {
        isValid: Boolean,
        isMinimumAgeValid: Boolean,
        isOfacValid: Boolean
      },
      forbiddenCountriesList: [String],
      discloseOutput: {
        nullifier: String,
        forbiddenCountriesListPacked: [String],
        issuingState: String,
        name: String,
        idNumber: String,
        nationality: String,
        dateOfBirth: String,
        gender: String,
        expiryDate: String,
        minimumAge: String,
        ofac: [Boolean]
      },
      userData: {
        userIdentifier: String,
        userDefinedData: String
      }
    },
    verificationDate: {
      type: Date
    },
    // Verification ID for retrieval
    verificationId: {
      type: String
    }
  },
  
  // Agents linked to this user
  linkedAgents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent'
  }],
  
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
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance methods
userSchema.methods.verifyWorldId = async function(payload, verificationData, verificationResult) {
  this.worldIdVerification = {
    isVerified: true,
    nullifierHash: payload.nullifier_hash,
    fullProof: {
      proof: payload.proof,
      merkleRoot: payload.merkle_root,
      nullifierHash: payload.nullifier_hash,
      verificationLevel: payload.verification_level
    },
    verificationData: {
      action: verificationData.action,
      signal: verificationData.signal,
      appId: verificationData.appId || 'app_2129675f92413391ca585881fea09ac0',
      walletAddress: verificationData.walletAddress
    },
    verificationDate: new Date(),
    verificationResult: verificationResult
  };
  this.stats.lastActivity = Date.now();
  return this.save();
};

userSchema.methods.verifySelfId = async function(attestationId, proof, publicSignals, userContextData, verificationResult, verificationId) {
  this.selfIdVerification = {
    isVerified: true,
    userIdentifier: verificationResult.userData?.userIdentifier,
    fullProof: {
      attestationId: attestationId,
      proof: proof,
      publicSignals: publicSignals,
      userContextData: userContextData
    },
    verificationResult: verificationResult,
    verificationDate: new Date(),
    verificationId: verificationId
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
    username: this.username,
    worldIdVerification: {
      isVerified: this.worldIdVerification.isVerified,
      verificationLevel: this.worldIdVerification.fullProof?.verificationLevel,
      verificationDate: this.worldIdVerification.verificationDate,
      nullifierHash: this.worldIdVerification.nullifierHash
    },
    selfIdVerification: {
      isVerified: this.selfIdVerification.isVerified,
      verificationDate: this.selfIdVerification.verificationDate,
      userIdentifier: this.selfIdVerification.userIdentifier,
      nationality: this.selfIdVerification.verificationResult?.discloseOutput?.nationality,
      name: this.selfIdVerification.verificationResult?.discloseOutput?.name
    },
    linkedAgents: this.linkedAgents,
    stats: this.stats,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

userSchema.methods.getFullProofs = function() {
  return {
    id: this._id,
    walletAddress: this.walletAddress,
    worldIdVerification: this.worldIdVerification,
    selfIdVerification: this.selfIdVerification,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Static methods
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

userSchema.statics.findByUserIdentifier = function(userIdentifier) {
  return this.findOne({ 'selfIdVerification.userIdentifier': userIdentifier });
};

userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: username });
};

// Indexes for performance
userSchema.index({ walletAddress: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'worldIdVerification.nullifierHash': 1 });
userSchema.index({ 'worldIdVerification.isVerified': 1 });
userSchema.index({ 'selfIdVerification.userIdentifier': 1 });
userSchema.index({ 'selfIdVerification.isVerified': 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema); 