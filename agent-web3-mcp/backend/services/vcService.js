const crypto = require('crypto');
const { ethers } = require('ethers');

class VCService {
  constructor() {
    this.issuer = 'agent-id-protocol';
    this.schema = 'https://your-protocol.xyz/schemas/agent-link-vc.json';
  }

  /**
   * Assemble a Verifiable Credential linking an agent to a human
   * @param {Object} params - VC assembly parameters
   * @param {string} params.agentId - Agent's World Chain address
   * @param {Object} params.user - User document from MongoDB
   * @param {string} params.declaration - Human declaration about the agent
   * @returns {Object} Assembled VC object
   */
  async assembleAgentVC(params) {
    const { agentId, user, declaration } = params;

    // Validate required parameters
    if (!agentId || !user || !declaration) {
      throw new Error('Missing required parameters: agentId, user, and declaration are required');
    }

    // Validate agent address format
    if (!ethers.isAddress(agentId)) {
      throw new Error('Invalid agent address format');
    }

    const timestamp = Math.floor(Date.now() / 1000);

    // Assemble human proof from Self ID and World ID verifications
    const humanProof = {};

    // Add Self ID proof if available
    if (user.selfIdVerification && user.selfIdVerification.isVerified) {
      const selfIdData = user.selfIdVerification.verificationData;
      humanProof.selfId = {
        attestationId: selfIdData?.attestationId || 1,
        nullifier: selfIdData?.discloseOutput?.nullifier || selfIdData?.userData?.userIdentifier,
        verifiedAt: Math.floor(new Date(user.selfIdVerification.verificationDate).getTime() / 1000)
      };
    }

    // Add World ID proof if available
    if (user.worldIdVerification && user.worldIdVerification.isVerified) {
      const worldIdData = user.worldIdVerification;
      humanProof.worldId = {
        nullifierHash: worldIdData.nullifierHash,
        verificationLevel: worldIdData.verificationLevel,
        verifiedAt: Math.floor(new Date(worldIdData.verificationDate).getTime() / 1000)
      };
    }

    // Ensure at least one proof is available
    if (!humanProof.selfId && !humanProof.worldId) {
      throw new Error('No valid identity proofs found. User must have at least Self ID or World ID verification');
    }

    // Assemble the VC
    const agentVC = {
      // 🧠 Agent Identity
      agentId: agentId,
      
      // 🔐 Creator Proof (human identity attestation)
      humanProof: humanProof,
      
      // 🗣️ Declaration by Human
      declaration: {
        description: declaration,
        createdAt: timestamp
      },
      
      // VC Metadata
      vcId: this.generateVCId(),
      issuer: this.issuer,
      schema: this.schema,
      issuedAt: timestamp,
      version: '1.0.0'
    };

    return agentVC;
  }

  /**
   * Generate a canonical hash of the VC for on-chain storage
   * @param {Object} vc - The VC object
   * @returns {string} Hex-encoded hash
   */
  generateVCHash(vc) {
    // Create a copy without signature for hashing
    const vcForHashing = { ...vc };
    delete vcForHashing.signature;
    delete vcForHashing.signedAt;

    // Canonicalize JSON (sort keys recursively)
    const canonicalJson = this.canonicalizeJSON(vcForHashing);
    
    // Generate hash
    return ethers.keccak256(ethers.toUtf8Bytes(canonicalJson));
  }

  /**
   * Sign the VC with the human's wallet
   * @param {Object} vc - The VC object
   * @param {ethers.Signer} signer - The human's wallet signer
   * @returns {Object} VC with signature
   */
  async signVC(vc, signer) {
    const vcHash = this.generateVCHash(vc);
    
    // Sign the hash
    const signature = await signer.signMessage(ethers.getBytes(vcHash));
    
    // Add signature to VC
    const signedVC = {
      ...vc,
      signature: signature,
      signedAt: Math.floor(Date.now() / 1000),
      signerAddress: await signer.getAddress()
    };

    return signedVC;
  }

  /**
   * Verify a VC signature
   * @param {Object} vc - The signed VC object
   * @returns {boolean} True if signature is valid
   */
  async verifyVCSignature(vc) {
    if (!vc.signature || !vc.signerAddress) {
      return false;
    }

    try {
      const vcHash = this.generateVCHash(vc);
      const recoveredAddress = ethers.verifyMessage(
        ethers.getBytes(vcHash),
        vc.signature
      );
      
      return recoveredAddress.toLowerCase() === vc.signerAddress.toLowerCase();
    } catch (error) {
      console.error('VC signature verification failed:', error);
      return false;
    }
  }

  /**
   * Generate a unique VC ID
   * @returns {string} Unique VC identifier
   */
  generateVCId() {
    return `vc_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Canonicalize JSON object (sort keys recursively)
   * @param {Object} obj - Object to canonicalize
   * @returns {string} Canonical JSON string
   */
  canonicalizeJSON(obj) {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }

    if (Array.isArray(obj)) {
      return '[' + obj.map(item => this.canonicalizeJSON(item)).join(',') + ']';
    }

    const sortedKeys = Object.keys(obj).sort();
    const pairs = sortedKeys.map(key => 
      `"${key}":${this.canonicalizeJSON(obj[key])}`
    );
    
    return '{' + pairs.join(',') + '}';
  }

  /**
   * Validate VC structure
   * @param {Object} vc - VC to validate
   * @returns {Object} Validation result
   */
  validateVC(vc) {
    const errors = [];

    // Required fields
    if (!vc.agentId) errors.push('Missing agentId');
    if (!vc.humanProof) errors.push('Missing humanProof');
    if (!vc.declaration) errors.push('Missing declaration');
    if (!vc.vcId) errors.push('Missing vcId');
    if (!vc.issuer) errors.push('Missing issuer');
    if (!vc.issuedAt) errors.push('Missing issuedAt');

    // Validate agent address
    if (vc.agentId && !ethers.isAddress(vc.agentId)) {
      errors.push('Invalid agentId format');
    }

    // Validate human proof
    if (vc.humanProof) {
      if (!vc.humanProof.selfId && !vc.humanProof.worldId) {
        errors.push('At least one identity proof (selfId or worldId) is required');
      }
    }

    // Validate declaration
    if (vc.declaration && !vc.declaration.description) {
      errors.push('Declaration must include description');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Create a summary of the VC for display purposes
   * @param {Object} vc - The VC object
   * @returns {Object} VC summary
   */
  createVCSummary(vc) {
    const hasSelId = vc.humanProof?.selfId ? true : false;
    const hasWorldId = vc.humanProof?.worldId ? true : false;
    
    return {
      vcId: vc.vcId,
      agentId: vc.agentId,
      declaration: vc.declaration?.description,
      createdAt: vc.issuedAt,
      creatorWalletAddress: vc.declaration?.creatorWalletAddress,
      identityProofs: {
        selfId: hasSelId,
        worldId: hasWorldId
      },
      isSigned: !!vc.signature,
      signerAddress: vc.signerAddress,
      issuer: vc.issuer,
      version: vc.version
    };
  }
}

module.exports = new VCService(); 