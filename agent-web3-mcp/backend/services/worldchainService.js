const { ethers } = require('ethers');
require('dotenv').config();

class WorldChainService {
  constructor() {
    this.rpcUrl = process.env.WORLD_CHAIN_RPC_URL || 'https://worldchain-mainnet.g.alchemy.com/v2/vCq59BHgMYA2JIRKAbRPmIL8OaTeRAgu';
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
    this.chainId = 480;
    this.chainName = 'World Chain';
    this.explorerUrl = 'https://worldchain-mainnet.explorer.alchemy.com';
  }

  // Generate a new wallet
  generateWallet() {
    return ethers.Wallet.createRandom();
  }

  // Get the balance of an address
  async getBalance(address) {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }

  // Get network information
  async getNetworkInfo() {
    try {
      const network = await this.provider.getNetwork();
      return {
        name: this.chainName,
        chainId: Number(network.chainId),
        blockNumber: await this.provider.getBlockNumber()
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      return {
        name: this.chainName,
        chainId: this.chainId,
        blockNumber: 0
      };
    }
  }

  // NEW: Check if the provider can reach World Chain RPC
  async isConnected() {
    try {
      // A cheap call to verify the connection: fetch the latest block number
      await this.provider.getBlockNumber();
      return true;
    } catch (error) {
      console.error('World Chain connection error:', error);
      return false;
    }
  }

  // Simulate a transfer (for security, we don't do real transfers)
  async simulateTransfer(from, to, amount) {
    try {
      // Basic validations
      if (!ethers.isAddress(from) || !ethers.isAddress(to)) {
        throw new Error('Invalid address');
      }

      if (parseFloat(amount) <= 0) {
        throw new Error('Invalid amount');
      }

      // Simulate the transaction
      const simulatedTx = {
        from: from,
        to: to,
        value: ethers.parseEther(amount),
        gasLimit: 21000,
        gasPrice: await this.provider.getGasPrice(),
        nonce: await this.provider.getTransactionCount(from),
        chainId: this.chainId
      };

      // Calculate estimated cost
      const estimatedGas = simulatedTx.gasLimit * simulatedTx.gasPrice;
      const estimatedCost = ethers.formatEther(estimatedGas);

      return {
        success: true,
        transaction: simulatedTx,
        estimatedGas: estimatedCost,
        note: 'This is a simulation - no real transaction was sent'
      };
    } catch (error) {
      console.error('Error simulating transfer:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if an address is valid
  isValidAddress(address) {
    return ethers.isAddress(address);
  }

  // Get the explorer URL for an address
  getExplorerUrl(address, type = 'address') {
    return `${this.explorerUrl}/${type}/${address}`;
  }

  // Get gas price
  async getGasPrice() {
    try {
      const gasPrice = await this.provider.getGasPrice();
      return ethers.formatUnits(gasPrice, 'gwei');
    } catch (error) {
      console.error('Error getting gas price:', error);
      return '0';
    }
  }

  // Get provider for smart contract interactions
  async getProvider() {
    console.log('🌐 WorldChainService.getProvider() called');
    console.log('  RPC URL:', this.rpcUrl);
    console.log('  Provider exists:', !!this.provider);
    
    if (!this.provider) {
      console.log('  Creating new provider...');
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
    }
    
    // Test the provider
    try {
      const blockNumber = await this.provider.getBlockNumber();
      console.log('  Provider test successful, block number:', blockNumber);
    } catch (error) {
      console.error('  Provider test failed:', error);
      throw error;
    }
    
    return this.provider;
  }

  // Get signer for smart contract interactions
  async getSigner() {
    console.log('✍️ WorldChainService.getSigner() called');
    console.log('  Private key set:', process.env.WORLD_CHAIN_PRIVATE_KEY ? 'YES' : 'NO');
    
    if (!process.env.WORLD_CHAIN_PRIVATE_KEY) {
      throw new Error('WORLD_CHAIN_PRIVATE_KEY environment variable is not set');
    }
    
    const provider = await this.getProvider();
    const signer = new ethers.Wallet(process.env.WORLD_CHAIN_PRIVATE_KEY, provider);
    
    console.log('  Signer created successfully');
    console.log('  Signer address:', await signer.getAddress());
    
    // Test the signer
    try {
      const balance = await provider.getBalance(signer.address);
      console.log('  Signer balance:', ethers.formatEther(balance), 'ETH');
    } catch (error) {
      console.error('  Signer test failed:', error);
      throw error;
    }
    
    return signer;
  }
}

module.exports = new WorldChainService(); 