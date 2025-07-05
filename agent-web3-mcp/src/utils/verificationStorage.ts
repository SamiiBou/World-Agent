// Utility functions for managing user verification data

export interface VerificationData {
  sessionUserId: string;
  selfUserId?: string; // The actual Self-provided user identifier
  verificationTimestamp: number;
  selfVerificationData?: any;
  worldIdData?: any;
  isVerified: boolean;
  verificationType: 'self-id' | 'world-id';
  linkedAgents?: string[]; // Array of agent addresses linked to this verification
}

export class VerificationStorage {
  private static STORAGE_KEY = 'userVerification';
  private static SESSION_KEY = 'currentVerification';

  // Store verification data
  static storeVerification(data: VerificationData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to store verification data:', error);
    }
  }

  // Get current verification data
  static getVerification(): VerificationData | null {
    try {
      // Try session storage first (current session)
      const sessionData = sessionStorage.getItem(this.SESSION_KEY);
      if (sessionData) {
        return JSON.parse(sessionData);
      }

      // Fall back to localStorage (persistent)
      const localData = localStorage.getItem(this.STORAGE_KEY);
      if (localData) {
        const data = JSON.parse(localData);
        // Refresh session storage
        sessionStorage.setItem(this.SESSION_KEY, localData);
        return data;
      }

      return null;
    } catch (error) {
      console.error('Failed to retrieve verification data:', error);
      return null;
    }
  }

  // Check if user is verified
  static isUserVerified(): boolean {
    const data = this.getVerification();
    return data?.isVerified === true;
  }

  // Get verification type
  static getVerificationType(): string | null {
    const data = this.getVerification();
    return data?.verificationType || null;
  }

  // Get the Self-provided user identifier (the real Self ID)
  static getSelfUserId(): string | null {
    const data = this.getVerification();
    return data?.selfUserId || null;
  }

  // Get the primary user identifier (prefer Self ID over session ID)
  static getPrimaryUserId(): string | null {
    const data = this.getVerification();
    return data?.selfUserId || data?.sessionUserId || null;
  }

  // Link an agent address to the verification
  static linkAgentToVerification(agentAddress: string): boolean {
    try {
      const data = this.getVerification();
      if (!data) {
        console.error('No verification data found to link agent');
        return false;
      }

      if (!data.linkedAgents) {
        data.linkedAgents = [];
      }

      // Add agent if not already linked
      if (!data.linkedAgents.includes(agentAddress)) {
        data.linkedAgents.push(agentAddress);
        this.storeVerification(data);
        console.log(`Agent ${agentAddress} linked to verification`);
        return true;
      }

      return false; // Already linked
    } catch (error) {
      console.error('Failed to link agent to verification:', error);
      return false;
    }
  }

  // Get linked agents
  static getLinkedAgents(): string[] {
    const data = this.getVerification();
    return data?.linkedAgents || [];
  }

  // Check if specific agent is linked
  static isAgentLinked(agentAddress: string): boolean {
    const linkedAgents = this.getLinkedAgents();
    return linkedAgents.includes(agentAddress);
  }

  // Clear verification data (logout)
  static clearVerification(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      sessionStorage.removeItem(this.SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear verification data:', error);
    }
  }

  // Get verification summary for display
  static getVerificationSummary(): {
    isVerified: boolean;
    type: string | null;
    timestamp: Date | null;
    linkedAgentCount: number;
    selfUserId: string | null;
    primaryUserId: string | null;
  } {
    const data = this.getVerification();
    
    return {
      isVerified: data?.isVerified || false,
      type: data?.verificationType || null,
      timestamp: data?.verificationTimestamp ? new Date(data.verificationTimestamp) : null,
      linkedAgentCount: data?.linkedAgents?.length || 0,
      selfUserId: data?.selfUserId || null,
      primaryUserId: data?.selfUserId || data?.sessionUserId || null
    };
  }
}

export default VerificationStorage; 