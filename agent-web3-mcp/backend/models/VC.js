const mongoose = require('mongoose');

// Schema for Verifiable Credentials
const vcSchema = new mongoose.Schema({
  // VC Identifier
  vcId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Agent Identity
  agentId: {
    type: String,
    required: true,
    match: /^0x[a-fA-F0-9]{40}$/,
    index: true
  },
  
  // Human Proof (identity attestations)
  humanProof: {
    selfId: {
      nullifier: String,
      minimumAgeMet: Boolean,
      nonOfac: Boolean,
      nonForbiddenCountry: Boolean,
      verifiedAt: Number
    },
    worldId: {
      nullifierHash: String,
      verificationLevel: String,
      verifiedAt: Number
    }
  },
  
  // Declaration by Human
  declaration: {
    description: {
      type: String,
      required: true,
      maxlength: 1000
    },
    createdAt: {
      type: Number,
      required: true
    }
  },
  
  
  // VC Metadata
  issuer: {
    type: String,
    required: true,
    default: 'agent-id-protocol'
  },
  
  schemaUrl: {
    type: String,
    required: true,
    default: 'https://your-protocol.xyz/schemas/agent-link-vc.json'
  },
  
  issuedAt: {
    type: Number,
    required: true
  },
  
  version: {
    type: String,
    required: true,
    default: '1.0.0'
  },
  
  // Signature Information
  signature: {
    type: String,
    sparse: true
  },
  
  signedAt: {
    type: Number,
    sparse: true
  },
  
  signerAddress: {
    type: String,
    match: /^0x[a-fA-F0-9]{40}$/,
    sparse: true,
    index: true
  },
  
  // VC Hash for on-chain verification
  vcHash: {
    type: String,
    sparse: true,
    index: true
  },
  
  // On-chain anchoring information
  onChain: {
    isAnchored: {
      type: Boolean,
      default: false
    },
    transactionHash: {
      type: String,
      sparse: true
    },
    blockNumber: {
      type: Number,
      sparse: true
    },
    contractAddress: {
      type: String,
      sparse: true
    },
    anchoredAt: {
      type: Date,
      sparse: true
    }
  },
  
  // Status and Metadata
  status: {
    type: String,
    enum: ['draft', 'issued', 'signed', 'anchored', 'revoked'],
    default: 'draft'
  },
  
  // References
  userRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  agentRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    index: true
  },
  
  // Timestamps
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
vcSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance methods
vcSchema.methods.sign = function(signature, signerAddress) {
  this.signature = signature;
  this.signerAddress = signerAddress;
  this.signedAt = Math.floor(Date.now() / 1000);
  this.status = 'signed';
  return this.save();
};

vcSchema.methods.anchor = function(transactionHash, blockNumber, contractAddress) {
  this.onChain.isAnchored = true;
  this.onChain.transactionHash = transactionHash;
  this.onChain.blockNumber = blockNumber;
  this.onChain.contractAddress = contractAddress;
  this.onChain.anchoredAt = new Date();
  this.status = 'anchored';
  return this.save();
};

vcSchema.methods.revoke = function() {
  this.status = 'revoked';
  return this.save();
};

vcSchema.methods.toVC = function() {
  const vc = {
    vcId: this.vcId,
    agentId: this.agentId,
    humanProof: this.humanProof,
    declaration: this.declaration,
    issuer: this.issuer,
    schemaUrl: this.schemaUrl,
    issuedAt: this.issuedAt,
    version: this.version
  };
  
  // Add signature if present
  if (this.signature) {
    vc.signature = this.signature;
    vc.signedAt = this.signedAt;
    vc.signerAddress = this.signerAddress;
  }
  
  return vc;
};

vcSchema.methods.getSummary = function() {
  return {
    vcId: this.vcId,
    agentId: this.agentId,
    declaration: this.declaration.description,
    createdAt: this.issuedAt,
    identityProofs: {
      selfId: !!this.humanProof.selfId,
      worldId: !!this.humanProof.worldId
    },
    isSigned: !!this.signature,
    signerAddress: this.signerAddress,
    isAnchored: this.onChain.isAnchored,
    status: this.status,
    issuer: this.issuer,
    version: this.version
  };
};

// Static methods
vcSchema.statics.findByAgent = function(agentId) {
  return this.find({ agentId: agentId });
};

vcSchema.statics.findByUser = function(userId) {
  return this.find({ userRef: userId });
};

vcSchema.statics.findByWallet = function(walletAddress) {
  return this.find({ signerAddress: walletAddress.toLowerCase() });
};

vcSchema.statics.findSigned = function() {
  return this.find({ signature: { $exists: true } });
};

vcSchema.statics.findAnchored = function() {
  return this.find({ 'onChain.isAnchored': true });
};

// Indexes for performance
vcSchema.index({ vcId: 1 });
vcSchema.index({ agentId: 1 });
vcSchema.index({ signerAddress: 1 });
vcSchema.index({ status: 1 });
vcSchema.index({ 'onChain.isAnchored': 1 });
vcSchema.index({ createdAt: -1 });

module.exports = mongoose.model('VC', vcSchema); 