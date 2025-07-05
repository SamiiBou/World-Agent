const { ethers } = require('ethers');
const worldchainService = require('./worldchainService');

// ABI for the AgentRegistry contract
const AGENT_REGISTRY_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "agentAddress", "type": "address" },
      { "internalType": "bytes32", "name": "worldIdNullifier", "type": "bytes32" },
      { "internalType": "bytes32", "name": "selfIdNullifier", "type": "bytes32" },
      { "internalType": "string", "name": "username", "type": "string" }
    ],
    "name": "registerAgent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "agentAddress", "type": "address" }
    ],
    "name": "getAgent",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "agentAddress", "type": "address" },
          { "internalType": "address", "name": "ownerWallet", "type": "address" },
          { "internalType": "bytes32", "name": "worldIdNullifier", "type": "bytes32" },
          { "internalType": "bytes32", "name": "selfIdNullifier", "type": "bytes32" },
          { "internalType": "uint256", "name": "registrationTime", "type": "uint256" },
          { "internalType": "bool", "name": "isActive", "type": "bool" },
          { "internalType": "string", "name": "username", "type": "string" }
        ],
        "internalType": "struct AgentRegistry.Agent",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "ownerWallet", "type": "address" }
    ],
    "name": "getAgentsByOwner",
    "outputs": [
      { "internalType": "address[]", "name": "", "type": "address[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "agentAddress", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "ownerWallet", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "username", "type": "string" },
      { "indexed": false, "internalType": "bytes32", "name": "worldIdNullifier", "type": "bytes32" },
      { "indexed": false, "internalType": "bytes32", "name": "selfIdNullifier", "type": "bytes32" }
    ],
    "name": "AgentRegistered",
    "type": "event"
  }
];

class AgentRegistryService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.registryAddress = process.env.AGENT_REGISTRY_ADDRESS || '0x5B2d913ca8e5D1a185fCFeD380fDc6d2369B4fE8';
  }

  async initialize() {
    try {
      console.log('🔧 === INITIALIZING AGENT REGISTRY SERVICE ===');
      console.log('📍 Registry address:', this.registryAddress);
      console.log('🔐 Environment variables check:', {
        AGENT_REGISTRY_ADDRESS: process.env.AGENT_REGISTRY_ADDRESS,
        WORLD_CHAIN_RPC_URL: process.env.WORLD_CHAIN_RPC_URL,
        WORLD_CHAIN_PRIVATE_KEY: process.env.WORLD_CHAIN_PRIVATE_KEY ? 'SET' : 'NOT SET'
      });
      
      if (!this.provider) {
        console.log('🌐 Getting provider from worldchainService...');
        this.provider = await worldchainService.getProvider();
        console.log('✅ Provider obtained:', this.provider ? 'SUCCESS' : 'FAILED');
      }
      
      if (!this.signer) {
        console.log('✍️ Getting signer from worldchainService...');
        this.signer = await worldchainService.getSigner();
        console.log('✅ Signer obtained:', this.signer ? 'SUCCESS' : 'FAILED');
        if (this.signer) {
          console.log('🔑 Signer address:', await this.signer.getAddress());
        }
      }

      if (!this.contract) {
        console.log('📄 Creating contract instance...');
        console.log('  Registry address:', this.registryAddress);
        console.log('  Signer exists:', !!this.signer);
        console.log('  ABI length:', AGENT_REGISTRY_ABI.length);
        
        this.contract = new ethers.Contract(
          this.registryAddress,
          AGENT_REGISTRY_ABI,
          this.signer
        );
        
        console.log('✅ Contract instance created');
        console.log('  Contract exists:', !!this.contract);
        console.log('  Contract target:', this.contract.target);
        console.log('  Contract interface exists:', !!this.contract.interface);
        
        if (this.contract.interface && this.contract.interface.functions) {
          console.log('  Contract interface methods:', Object.keys(this.contract.interface.functions));
        } else {
          console.log('  ⚠️  Contract interface or functions not available');
        }
      }

      console.log('✅ AgentRegistry service initialized successfully');
      console.log('📍 Registry address:', this.registryAddress);
      
      return true;
    } catch (error) {
      console.error('❌ Error initializing AgentRegistry service:', error);
      console.error('📊 Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Register an agent in the smart contract
   * @param {string} agentAddress - The agent's wallet address
   * @param {string} worldIdNullifier - World ID nullifier hash
   * @param {string} selfIdNullifier - Self ID nullifier hash
   * @param {string} username - Agent username
   * @returns {Promise<Object>} Transaction receipt
   */
  async registerAgent(agentAddress, worldIdNullifier, selfIdNullifier, username) {
    try {
      console.log('🔗 === REGISTERING AGENT IN SMART CONTRACT ===');
      console.log('📋 Input parameters:');
      console.log('  Agent Address:', agentAddress);
      console.log('  Username:', username);
      console.log('  World ID Nullifier (raw):', worldIdNullifier);
      console.log('  Self ID Nullifier (raw):', selfIdNullifier);

      console.log('🔧 Initializing service...');
      await this.initialize();

      // Convert nullifiers to bytes32 format if they're not already
      console.log('🔄 Formatting nullifiers...');
      const formattedWorldIdNullifier = this.formatNullifier(worldIdNullifier);
      const formattedSelfIdNullifier = this.formatNullifier(selfIdNullifier);
      
      console.log('📝 Formatted nullifiers:');
      console.log('  World ID Nullifier (formatted):', formattedWorldIdNullifier);
      console.log('  Self ID Nullifier (formatted):', formattedSelfIdNullifier);

      console.log('🔍 Contract details:');
      console.log('  Contract address:', this.contract.target);
      console.log('  Signer address:', await this.signer.getAddress());
      console.log('  Contract exists:', !!this.contract);
      console.log('  Contract methods available:', !!this.contract.registerAgent);
      
      // Debug contract methods
      if (this.contract) {
        console.log('  Available methods on contract:', Object.getOwnPropertyNames(this.contract).filter(name => typeof this.contract[name] === 'function'));
        
        // Check if registerAgent exists in different forms
        console.log('  registerAgent function:', typeof this.contract.registerAgent);
        console.log('  getFunction registerAgent:', typeof this.contract.getFunction);
        
        if (this.contract.getFunction) {
          try {
            const registerAgentFunc = this.contract.getFunction('registerAgent');
            console.log('  getFunction registerAgent result:', !!registerAgentFunc);
          } catch (error) {
            console.log('  getFunction registerAgent failed:', error.message);
          }
        }
      }
      
      console.log('💰 Checking signer balance...');
      const balance = await this.provider.getBalance(this.signer.address);
      console.log('  Signer balance:', ethers.formatEther(balance), 'ETH');
      
      console.log('⛽ Estimating gas...');
      console.log('  Contract registerAgent method exists:', !!this.contract.registerAgent);
      
      try {
        // Try to estimate gas using the method directly
        let gasEstimate;
        if (this.contract.registerAgent && this.contract.registerAgent.estimateGas) {
          gasEstimate = await this.contract.registerAgent.estimateGas(
            agentAddress,
            formattedWorldIdNullifier,
            formattedSelfIdNullifier,
            username
          );
        } else if (this.contract.getFunction) {
          // Alternative approach for ethers v6
          const func = this.contract.getFunction('registerAgent');
          gasEstimate = await func.estimateGas(
            agentAddress,
            formattedWorldIdNullifier,
            formattedSelfIdNullifier,
            username
          );
        } else {
          // Basic estimation
          gasEstimate = await this.contract.estimateGas.registerAgent(
            agentAddress,
            formattedWorldIdNullifier,
            formattedSelfIdNullifier,
            username
          );
        }
        console.log('  Gas estimate:', gasEstimate.toString());
      } catch (gasError) {
        console.error('❌ Gas estimation failed:', gasError);
        console.error('  Gas error details:', gasError.message);
        // Continue anyway, gas estimation is optional
        console.log('⚠️  Continuing without gas estimation...');
      }

      // Final check before sending transaction
      if (!this.contract) {
        throw new Error('Contract is not initialized');
      }
      
      if (!this.contract.registerAgent) {
        throw new Error('registerAgent method not found on contract');
      }

      console.log('📤 Sending transaction...');
      
      let tx;
      if (this.contract.registerAgent) {
        // Direct method call
        tx = await this.contract.registerAgent(
          agentAddress,
          formattedWorldIdNullifier,
          formattedSelfIdNullifier,
          username
        );
      } else if (this.contract.getFunction) {
        // Alternative approach for ethers v6
        const func = this.contract.getFunction('registerAgent');
        tx = await func(
          agentAddress,
          formattedWorldIdNullifier,
          formattedSelfIdNullifier,
          username
        );
      } else {
        throw new Error('Unable to find registerAgent method on contract');
      }

      console.log('✅ Transaction sent successfully!');
      console.log('📄 Transaction hash:', tx.hash);
      console.log('⏳ Waiting for confirmation...');
      
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed!');
      console.log('📄 Transaction receipt:', receipt);
      console.log('🔗 Block number:', receipt.blockNumber);
      console.log('⛽ Gas used:', receipt.gasUsed.toString());

      const result = {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        timestamp: new Date(),
        gasUsed: receipt.gasUsed.toString(),
        success: true
      };
      
      console.log('🎉 Registration completed successfully!');
      console.log('📋 Final result:', result);
      
      return result;
    } catch (error) {
      console.error('❌ === REGISTRATION FAILED ===');
      console.error('💥 Error type:', error.constructor.name);
      console.error('📝 Error message:', error.message);
      console.error('📊 Error stack:', error.stack);
      
      if (error.code) {
        console.error('🔢 Error code:', error.code);
      }
      
      if (error.reason) {
        console.error('💬 Error reason:', error.reason);
      }
      
      throw error;
    }
  }

  /**
   * Get agent information from the smart contract
   * @param {string} agentAddress - The agent's wallet address
   * @returns {Promise<Object>} Agent information
   */
  async getAgent(agentAddress) {
    try {
      await this.initialize();

      const agentInfo = await this.contract.getAgent(agentAddress);
      
      return {
        agentAddress: agentInfo.agentAddress,
        ownerWallet: agentInfo.ownerWallet,
        worldIdNullifier: agentInfo.worldIdNullifier,
        selfIdNullifier: agentInfo.selfIdNullifier,
        registrationTime: new Date(agentInfo.registrationTime.toNumber() * 1000),
        isActive: agentInfo.isActive,
        username: agentInfo.username
      };
    } catch (error) {
      console.error('❌ Error getting agent:', error);
      throw error;
    }
  }

  /**
   * Get all agents owned by a specific address
   * @param {string} ownerAddress - The owner's wallet address
   * @returns {Promise<Array>} Array of agent addresses
   */
  async getAgentsByOwner(ownerAddress) {
    try {
      await this.initialize();

      const agentAddresses = await this.contract.getAgentsByOwner(ownerAddress);
      return agentAddresses;
    } catch (error) {
      console.error('❌ Error getting agents by owner:', error);
      throw error;
    }
  }

  /**
   * Check if an agent is registered in the contract
   * @param {string} agentAddress - The agent's wallet address
   * @returns {Promise<boolean>} True if registered
   */
  async isAgentRegistered(agentAddress) {
    try {
      const agentInfo = await this.getAgent(agentAddress);
      return agentInfo.agentAddress !== ethers.constants.AddressZero;
    } catch (error) {
      // If the call fails, the agent is not registered
      return false;
    }
  }

  /**
   * Format nullifier to bytes32 format
   * @param {string} nullifier - The nullifier string
   * @returns {string} Formatted bytes32 string
   */
  formatNullifier(nullifier) {
    console.log('🔄 Formatting nullifier:', nullifier);
    console.log('  Type:', typeof nullifier);
    console.log('  Length:', nullifier?.length);
    
    if (!nullifier) {
      console.log('  Result: Empty nullifier, using HashZero');
      return ethers.ZeroHash;
    }
    
    // If it's already a proper bytes32, return as is
    if (nullifier.startsWith && nullifier.startsWith('0x') && nullifier.length === 66) {
      console.log('  Result: Already proper bytes32 format');
      return nullifier;
    }
    
    // If it's a large number (like BigInt), convert to hex bytes32
    if (/^\d+$/.test(nullifier.toString())) {
      console.log('  Result: Converting large number to bytes32');
      const hexValue = ethers.toBeHex(BigInt(nullifier), 32);
      console.log('  Formatted result:', hexValue);
      return hexValue;
    }
    
    // If it's a regular string, convert to bytes32
    console.log('  Result: Converting string to bytes32');
    const formatted = ethers.formatBytes32String(nullifier);
    console.log('  Formatted result:', formatted);
    return formatted;
  }

  /**
   * Get contract address
   * @returns {string} Contract address
   */
  getContractAddress() {
    return this.registryAddress;
  }

  /**
   * Get contract instance
   * @returns {ethers.Contract} Contract instance
   */
  getContract() {
    return this.contract;
  }
}

module.exports = new AgentRegistryService(); 