export interface AgentVC {
  vcId: string;
  agentId: string;
  humanProof: {
    selfId?: {
      attestationId: number;
      nullifier: string;
      verifiedAt: number;
    };
    worldId?: {
      nullifierHash: string;
      verificationLevel: string;
      verifiedAt: number;
    };
  };
  declaration: {
    description: string;
    createdAt: number;
  };
  issuer: string;
  schema: string;
  issuedAt: number;
  version: string;
  signature?: string;
  signedAt?: number;
  signerAddress?: string;
}

export interface VCSummary {
  vcId: string;
  agentId: string;
  declaration: string;
  createdAt: number;
  identityProofs: {
    selfId: boolean;
    worldId: boolean;
  };
  isSigned: boolean;
  signerAddress?: string;
  isAnchored: boolean;
  status: string;
  issuer: string;
  version: string;
}

export interface LinkAgentRequest {
  walletAddress: string;
  declaration: string;
}

export interface LinkAgentResponse {
  success: boolean;
  message: string;
  vc: VCSummary;
  vcHash: string;
  agent: any;
  user: any;
}

class VCService {
  private backendUrl: string;

  constructor() {
    this.backendUrl = process.env.REACT_APP_API_URL || 'https://37b2a30b1f1c.ngrok.app/api';
  }

  private async fetchAPI(endpoint: string, options: RequestInit = {}) {
    const url = `${this.backendUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Link an agent to a user and generate a VC
   */
  async linkAgent(agentId: string, request: LinkAgentRequest): Promise<LinkAgentResponse> {
    try {
      const response = await this.fetchAPI(`/agents/${agentId}/link`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to link agent');
      }
      
      return response;
    } catch (error: any) {
      console.error('Error linking agent:', error);
      throw new Error(error.message || 'Failed to link agent');
    }
  }

  /**
   * Get VC for an agent
   */
  async getAgentVC(agentId: string): Promise<{ success: boolean; vc: AgentVC; summary: VCSummary; vcHash: string }> {
    try {
      const response = await this.fetchAPI(`/agents/${agentId}/vc`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to get agent VC');
      }
      
      return response;
    } catch (error: any) {
      console.error('Error getting agent VC:', error);
      throw new Error(error.message || 'Failed to get agent VC');
    }
  }

  /**
   * Get all VCs for a user
   */
  async getUserVCs(walletAddress: string): Promise<{ success: boolean; count: number; vcs: VCSummary[] }> {
    try {
      const response = await this.fetchAPI(`/users/${walletAddress}/vcs`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to get user VCs');
      }
      
      return response;
    } catch (error: any) {
      console.error('Error getting user VCs:', error);
      throw new Error(error.message || 'Failed to get user VCs');
    }
  }

  /**
   * Verify a VC signature
   */
  async verifyVC(vcId: string): Promise<{ success: boolean; isValid: boolean; vc: VCSummary; message: string }> {
    try {
      const response = await this.fetchAPI(`/vcs/${vcId}/verify`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to verify VC');
      }
      
      return response;
    } catch (error: any) {
      console.error('Error verifying VC:', error);
      throw new Error(error.message || 'Failed to verify VC');
    }
  }

  /**
   * Format VC for display
   */
  formatVCForDisplay(vc: VCSummary): string {
    const proofs = [];
    if (vc.identityProofs.selfId) proofs.push('Self ID');
    if (vc.identityProofs.worldId) proofs.push('World ID');
    
    const signerDisplay = vc.signerAddress ? `${vc.signerAddress.slice(0, 8)}...${vc.signerAddress.slice(-6)}` : 'unsigned';
    return `Agent ${vc.agentId.slice(0, 8)}...${vc.agentId.slice(-6)} linked with ${proofs.join(' + ')} verification (signed by ${signerDisplay})`;
  }

  /**
   * Get VC status color for UI
   */
  getVCStatusColor(status: string): string {
    switch (status) {
      case 'draft': return '#6B7280';
      case 'issued': return '#3B82F6';
      case 'signed': return '#10B981';
      case 'anchored': return '#8B5CF6';
      case 'revoked': return '#EF4444';
      default: return '#6B7280';
    }
  }

  /**
   * Check if user can link an agent (has identity verification)
   */
  async canUserLinkAgent(walletAddress: string): Promise<{ canLink: boolean; reason?: string; verifications: { selfId: boolean; worldId: boolean } }> {
    try {
      // Check World ID verification
      const worldIdResponse = await this.fetchAPI(`/worldid/status/${walletAddress}`);
      const hasWorldId = worldIdResponse.success && worldIdResponse.verified;

      // Check Self ID verification (this would need to be implemented)
      // For now, assume we can check via user endpoint
      let hasSelfId = false;
      try {
        const userVCs = await this.getUserVCs(walletAddress);
        hasSelfId = userVCs.vcs.some(vc => vc.identityProofs.selfId);
      } catch (error) {
        // User might not exist yet
      }

      const canLink = hasWorldId || hasSelfId;
      const reason = canLink ? undefined : 'User must complete at least one identity verification (Self ID or World ID)';

      return {
        canLink,
        reason,
        verifications: {
          selfId: hasSelfId,
          worldId: hasWorldId
        }
      };
    } catch (error: any) {
      console.error('Error checking user link eligibility:', error);
      return {
        canLink: false,
        reason: 'Failed to check user verification status',
        verifications: {
          selfId: false,
          worldId: false
        }
      };
    }
  }
}

export const vcService = new VCService(); 