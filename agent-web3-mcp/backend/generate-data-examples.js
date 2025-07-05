const mongoose = require('mongoose');

// Function to generate data structure examples
function generateDataExamples() {
  console.log('🔍 DATA STRUCTURE EXAMPLES - MODELS');
  console.log('='.repeat(80));

  // 1. User structure example
  console.log('\n📋 USER MODEL STRUCTURE:');
  console.log('-'.repeat(50));
  
  const userExample = {
    _id: new mongoose.Types.ObjectId(),
    walletAddress: "0x742d35Cc6634C0532925a3b8D7389d846e1234567",
    
    // World ID verification
    worldIdVerification: {
      isVerified: true,
      nullifierHash: "0x1234567890abcdef1234567890abcdef12345678",
      fullProof: {
        proof: "0x1234567890abcdef...",
        merkleRoot: "0x1234567890abcdef...",
        nullifierHash: "0x1234567890abcdef...",
        verificationLevel: "orb"
      },
      verificationData: {
        action: "poh",
        signal: "user_verification_signal",
        appId: "app_2129675f92413391ca585881fea09ac0",
        walletAddress: "0x742d35Cc6634C0532925a3b8D7389d846e1234567"
      },
      verificationDate: new Date(),
      verificationResult: {
        success: true,
        verification_level: "orb"
      }
    },
    
    // Self ID verification
    selfIdVerification: {
      isVerified: true,
      userIdentifier: "user_12345",
      fullProof: {
        attestationId: 12345,
        proof: {
          a: ["0x1234...", "0x5678..."],
          b: [["0x1234...", "0x5678..."], ["0x9abc...", "0xdef0..."]],
          c: ["0x1234...", "0x5678..."],
          curve: "bn128",
          protocol: "groth16"
        },
        publicSignals: ["signal1", "signal2", "signal3"],
        userContextData: "encrypted_user_data"
      },
      verificationResult: {
        attestationId: 12345,
        isValidDetails: {
          isValid: true,
          isMinimumAgeValid: true,
          isOfacValid: true
        },
        forbiddenCountriesList: ["US", "CN"],
        discloseOutput: {
          nullifier: "0x1234567890abcdef",
          forbiddenCountriesListPacked: ["US", "CN"],
          issuingState: "FR",
          name: "JOHN DOE",
          idNumber: "123456789",
          nationality: "FR",
          dateOfBirth: "1990-01-01",
          gender: "M",
          expiryDate: "2030-01-01",
          minimumAge: "18",
          ofac: [false, false]
        },
        userData: {
          userIdentifier: "user_12345",
          userDefinedData: "custom_data"
        }
      },
      verificationDate: new Date(),
      verificationId: "verification_abc123"
    },
    
    // Linked agents
    linkedAgents: [
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId()
    ],
    
    // Statistics
    stats: {
      totalTransactions: 15,
      totalInteractions: 42,
      lastActivity: new Date()
    },
    
    // Metadata
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  console.log(JSON.stringify(userExample, null, 2));

  // 2. Agent structure example
  console.log('\n\n📋 AGENT MODEL STRUCTURE:');
  console.log('-'.repeat(50));
  
  const agentExample = {
    _id: new mongoose.Types.ObjectId(),
    name: "MyAgent",
    description: "Intelligent agent for Web3 transactions",
    avatar: "🤖",
    
    // WorldChain information
    worldchain: {
      address: "0x1234567890abcdef1234567890abcdef12345678",
      privateKey: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      mnemonic: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
      balance: "1.5",
      lastBalanceUpdate: new Date()
    },
    
    // Self ID information
    selfId: {
      uniqueHash: "unique_hash_123",
      isValidDetails: {
        isValid: true,
        isMinimumAgeValid: true,
        isOfacValid: true
      },
      forbiddenCountriesList: ["US", "CN"]
    },
    
    // Owner
    owner: new mongoose.Types.ObjectId(),
    ownerWalletAddress: "0x742d35Cc6634C0532925a3b8D7389d846e1234567",
    
    // Statistics
    stats: {
      totalTransactions: 8,
      totalInteractions: 23,
      lastActivity: new Date()
    },
    
    // Configuration
    config: {
      isActive: true,
      capabilities: ["worldchain_balance", "worldchain_transfer", "web3_balance", "api_call"],
      maxTransactionAmount: 1.0
    },
    
    // Metadata
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  console.log(JSON.stringify(agentExample, null, 2));

  // 3. SelfId structure example
  console.log('\n\n📋 SELFID MODEL STRUCTURE:');
  console.log('-'.repeat(50));
  
  const selfIdExample = {
    _id: new mongoose.Types.ObjectId(),
    uniqueHash: "unique_hash_123456",
    proof: {
      a: ["0x1234...", "0x5678..."],
      b: [["0x1234...", "0x5678..."], ["0x9abc...", "0xdef0..."]],
      c: ["0x1234...", "0x5678..."],
      curve: "bn128",
      protocol: "groth16"
    },
    pubSignals: ["signal1", "signal2", "signal3", "signal4"],
    isValidDetails: {
      isValid: true,
      isMinimumAgeValid: true,
      isOfacValid: true
    },
    forbiddenCountriesList: ["US", "CN", "RU"],
    discloseOutput: {
      nullifier: "0x1234567890abcdef",
      forbiddenCountriesListPacked: ["US", "CN", "RU"],
      issuingState: "FR",
      name: "JOHN DOE",
      idNumber: "123456789",
      nationality: "FR",
      dateOfBirth: "1990-01-01",
      gender: "M",
      expiryDate: "2030-01-01",
      minimumAge: "18",
      ofac: [false, false, false]
    },
    verifiedAt: new Date(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
  };
  
  console.log(JSON.stringify(selfIdExample, null, 2));

  // 4. Summary of important fields
  console.log('\n\n📊 IMPORTANT FIELDS SUMMARY:');
  console.log('-'.repeat(50));
  
  console.log('\n👥 USER MODEL:');
  console.log('  • walletAddress: Wallet address (unique)');
  console.log('  • worldIdVerification: Complete World ID verification');
  console.log('  • selfIdVerification: Complete Self Protocol verification');
  console.log('  • linkedAgents: List of linked agents');
  console.log('  • stats: Usage statistics');
  
  console.log('\n🤖 AGENT MODEL:');
  console.log('  • name: Agent name');
  console.log('  • worldchain: WorldChain wallet information');
  console.log('  • owner: Reference to owner (User)');
  console.log('  • config: Configuration and capabilities');
  console.log('  • stats: Usage statistics');
  
  console.log('\n🔐 SELFID MODEL:');
  console.log('  • uniqueHash: Unique proof hash');
  console.log('  • proof: Complete cryptographic proof');
  console.log('  • isValidDetails: Validity details');
  console.log('  • discloseOutput: Disclosed data');
  console.log('  • expiresAt: Expiration date');

  console.log('\n' + '='.repeat(80));
  console.log('✅ STRUCTURE EXAMPLES GENERATED');
  console.log('='.repeat(80));
}

// Execute example generation
if (require.main === module) {
  generateDataExamples();
}

module.exports = { generateDataExamples }; 