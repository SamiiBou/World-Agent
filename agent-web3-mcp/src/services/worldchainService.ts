import { ethers } from 'ethers';
import { config } from '../config/environment';

export interface AgentWallet {
  address: string;
  privateKey: string;
  mnemonic: string;
}

export interface WalletInfo {
  address: string;
  balance: string;
  balanceFormatted: string;
  chainId: number;
  chainName: string;
  blockExplorerUrl: string;
}

class WorldChainService {
  private provider: ethers.JsonRpcProvider;
  private agentWallet: AgentWallet | null = null;
  private isInitialized = false;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.worldchain.rpcUrl);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if we already have an agent wallet stored
      const storedWallet = this.getStoredWallet();
      
      if (storedWallet) {
        this.agentWallet = storedWallet;
        console.log('🔓 Agent wallet loaded from storage');
      } else {
        // Generate a new wallet for the agent
        this.agentWallet = await this.generateNewWallet();
        this.storeWallet(this.agentWallet);
        console.log('🔑 New agent wallet generated and stored');
      }

      this.isInitialized = true;
      console.log(`🌍 Agent connected to World Chain`);
      console.log(`📍 Agent address: ${this.agentWallet.address}`);
    } catch (error) {
      console.error('Error initializing World Chain service:', error);
      throw error;
    }
  }

  private async generateNewWallet(): Promise<AgentWallet> {
    const wallet = ethers.Wallet.createRandom();
    
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase || ''
    };
  }

  private storeWallet(wallet: AgentWallet): void {
    // Store in localStorage (in production, use more secure storage)
    const walletData = {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic
    };
    
    localStorage.setItem('agent_worldchain_wallet', JSON.stringify(walletData));
  }

  private getStoredWallet(): AgentWallet | null {
    try {
      const stored = localStorage.getItem('agent_worldchain_wallet');
      if (stored) {
        return JSON.parse(stored) as AgentWallet;
      }
    } catch (error) {
      console.error('Error reading stored wallet:', error);
    }
    return null;
  }

  async getAgentWalletInfo(): Promise<WalletInfo> {
    await this.initialize();
    
    if (!this.agentWallet) {
      throw new Error('Agent wallet not initialized');
    }

    const balance = await this.provider.getBalance(this.agentWallet.address);
    const balanceFormatted = ethers.formatEther(balance);

    return {
      address: this.agentWallet.address,
      balance: balance.toString(),
      balanceFormatted: `${balanceFormatted} ETH`,
      chainId: config.worldchain.chainId,
      chainName: config.worldchain.chainName,
      blockExplorerUrl: config.worldchain.blockExplorerUrl
    };
  }

  async getBalance(address?: string): Promise<string> {
    await this.initialize();
    
    const targetAddress = address || this.agentWallet?.address;
    if (!targetAddress) {
      throw new Error('No address provided');
    }

    const balance = await this.provider.getBalance(targetAddress);
    return ethers.formatEther(balance);
  }

  async sendTransaction(to: string, amount: string): Promise<string> {
    await this.initialize();
    
    if (!this.agentWallet) {
      throw new Error('Agent wallet not initialized');
    }

    const wallet = new ethers.Wallet(this.agentWallet.privateKey, this.provider);
    const tx = {
      to: to,
      value: ethers.parseEther(amount)
    };

    const transaction = await wallet.sendTransaction(tx);
    return transaction.hash;
  }

  async estimateGas(to: string, amount: string): Promise<string> {
    await this.initialize();
    
    if (!this.agentWallet) {
      throw new Error('Agent wallet not initialized');
    }

    const tx = {
      to: to,
      value: ethers.parseEther(amount)
    };

    const gasEstimate = await this.provider.estimateGas(tx);
    return ethers.formatEther(gasEstimate);
  }

  getAgentAddress(): string | null {
    return this.agentWallet?.address || null;
  }

  getExplorerUrl(address?: string): string {
    const targetAddress = address || this.agentWallet?.address;
    if (!targetAddress) {
      return config.worldchain.blockExplorerUrl;
    }
    return `${config.worldchain.blockExplorerUrl}/address/${targetAddress}`;
  }

  async getNetworkInfo(): Promise<any> {
    const network = await this.provider.getNetwork();
    return {
      chainId: Number(network.chainId),
      name: network.name
    };
  }

  // Reset wallet (for testing purposes)
  resetWallet(): void {
    localStorage.removeItem('agent_worldchain_wallet');
    this.agentWallet = null;
    this.isInitialized = false;
    console.log('🔄 Agent wallet reset');
  }
}

export const worldchainService = new WorldChainService(); 