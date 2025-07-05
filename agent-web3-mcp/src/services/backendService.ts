import { MiniKitService } from './miniKitService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://37b2a30b1f1c.ngrok.app/api';

export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  username: string;
  address: string;
  balance: string;
  lastBalanceUpdate: string;
  registry?: {
    isRegistered: boolean;
    registrationTxHash: string;
    registrationBlockNumber: number;
    registrationTimestamp: string;
  };
  stats: {
    totalTransactions: number;
    totalInteractions: number;
    lastActivity: string;
  };
  config: {
    isActive: boolean;
    capabilities: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentRequest {
  name: string;
  description?: string;
  avatar?: string;
  username?: string;
  capabilities?: string[];
}

export interface TransferRequest {
  to: string;
  amount: string;
}

class BackendService {
  private async fetchAPI(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Prepare headers with wallet address if authenticated
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    
    // Add wallet address header if user is authenticated
    if (MiniKitService.isAuthenticated()) {
      const walletAddress = MiniKitService.getWalletAddress();
      if (walletAddress) {
        (headers as Record<string, string>)['x-wallet-address'] = walletAddress;
      }
    }
    
    const response = await fetch(url, {
      headers,
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // 📊 Get server status
  async getServerStatus() {
    return this.fetchAPI('/status');
  }

  // 🤖 Create a new agent
  async createAgent(agentData: CreateAgentRequest): Promise<{
    message: string;
    agent: Agent;
    explorerUrl: string;
  }> {
    return this.fetchAPI('/agents', {
      method: 'POST',
      body: JSON.stringify(agentData),
    });
  }

  // 📋 List all agents
  async getAgents(options: {
    active?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    agents: Agent[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    const params = new URLSearchParams();
    
    if (options.active !== undefined) {
      params.append('active', options.active.toString());
    }
    if (options.limit) {
      params.append('limit', options.limit.toString());
    }
    if (options.offset) {
      params.append('offset', options.offset.toString());
    }

    const query = params.toString();
    return this.fetchAPI(`/agents${query ? `?${query}` : ''}`);
  }

  // 🔍 Get an agent by ID
  async getAgent(id: string): Promise<{
    agent: Agent;
    explorerUrl: string;
  }> {
    return this.fetchAPI(`/agents/${id}`);
  }

  // 💰 Get agent balance
  async getAgentBalance(id: string): Promise<{
    address: string;
    balance: string;
    balanceFormatted: string;
    chainId: number;
    chainName: string;
    explorerUrl: string;
    lastUpdate: string;
  }> {
    return this.fetchAPI(`/agents/${id}/balance`);
  }

  // 💸 Perform a transfer
  async transferFunds(id: string, transferData: TransferRequest): Promise<{
    message: string;
    transaction: {
      hash: string;
      from: string;
      to: string;
      amount: string;
      status: string;
      explorerUrl: string;
      timestamp: string;
    };
    note: string;
  }> {
    return this.fetchAPI(`/agents/${id}/transfer`, {
      method: 'POST',
      body: JSON.stringify(transferData),
    });
  }

  // 🔄 Update an agent
  async updateAgent(id: string, updateData: Partial<CreateAgentRequest> & {
    isActive?: boolean;
  }): Promise<{
    message: string;
    agent: Agent;
  }> {
    return this.fetchAPI(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // 🗑️ Delete an agent
  async deleteAgent(id: string): Promise<{
    message: string;
    deletedAgent: {
      id: string;
      name: string;
      address: string;
    };
  }> {
    return this.fetchAPI(`/agents/${id}`, {
      method: 'DELETE',
    });
  }

  // 🔗 Get explorer URL for an address
  getExplorerUrl(address: string): string {
    return `https://worldchain-mainnet.explorer.alchemy.com/address/${address}`;
  }

  // 📡 Check backend connectivity
  async isBackendConnected(): Promise<boolean> {
    try {
      await this.getServerStatus();
      return true;
    } catch (error) {
      console.error('Backend connection failed:', error);
      return false;
    }
  }

  // 🧾 Get VC for an agent
  async getAgentVC(agentAddress: string): Promise<any> {
    return this.fetchAPI(`/agents/${agentAddress}/vc`);
  }
}

export const backendService = new BackendService(); 