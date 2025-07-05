import { MiniKit, VerifyCommandInput, VerificationLevel, ISuccessResult, MiniAppVerifyActionPayload } from '@worldcoin/minikit-js';
import { config } from '../config/environment';

export interface WorldIdVerificationResult {
  success: boolean;
  proof?: string;
  merkleRoot?: string;
  nullifierHash?: string;
  verificationLevel?: VerificationLevel;
  error?: string;
  errorCode?: string;
  userInfo?: any;
}

export interface WorldIdVerificationStatus {
  isVerified: boolean;
  verificationLevel?: VerificationLevel;
  verificationDate?: string;
  nullifierHash?: string;
}

export class WorldIdService {
  private static readonly ACTION_ID = 'poh';
  private static readonly APP_ID = 'app_2129675f92413391ca585881fea09ac0';

  /**
   * Verify user's World ID using MiniKit
   */
  static async verifyWorldId(
    walletAddress: string,
    signal?: string,
    verificationLevel: VerificationLevel = VerificationLevel.Orb
  ): Promise<WorldIdVerificationResult> {
    try {
      console.log('🌍 Starting World ID verification...');
      console.log('- Wallet Address:', walletAddress);
      console.log('- Action ID:', this.ACTION_ID);
      console.log('- Signal:', signal);
      console.log('- Verification Level:', verificationLevel);

      // Check if MiniKit is installed
      if (!MiniKit.isInstalled()) {
        console.error('MiniKit not installed');
        return {
          success: false,
          error: 'MiniKit not installed. Please make sure you are running this app inside World App.',
          errorCode: 'MINIKIT_NOT_INSTALLED'
        };
      }

      // Prepare verification payload
      const verifyPayload: VerifyCommandInput = {
        action: this.ACTION_ID,
        signal: signal || walletAddress, // Use wallet address as signal if not provided
        verification_level: verificationLevel,
      };

      console.log('📋 Verification payload:', verifyPayload);

      // Execute World ID verification
      console.log('🔍 Executing World ID verification...');
      const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload);

      console.log('📄 World ID verification response:', finalPayload);

      // Check if verification was successful
      if (finalPayload.status === 'error') {
        console.error('World ID verification failed:', finalPayload);
        return {
          success: false,
          error: finalPayload.error_code || 'Unknown error',
          errorCode: finalPayload.error_code
        };
      }

      // Extract verification data
      const successPayload = finalPayload as any; // Type assertion for success payload
      const verificationData = {
        proof: successPayload.proof,
        merkle_root: successPayload.merkle_root,
        nullifier_hash: successPayload.nullifier_hash,
        verification_level: successPayload.verification_level
      };

      console.log('✅ World ID verification successful:', verificationData);

      // Send verification to backend
      console.log('📤 Sending verification to backend...');
      const backendResult = await this.sendVerificationToBackend(
        verificationData,
        walletAddress,
        signal
      );

      if (!backendResult.success) {
        console.error('Backend verification failed:', backendResult.error);
        return {
          success: false,
          error: backendResult.error,
          errorCode: backendResult.errorCode
        };
      }

      console.log('🎉 World ID verification completed successfully!');

      return {
        success: true,
        proof: verificationData.proof,
        merkleRoot: verificationData.merkle_root,
        nullifierHash: verificationData.nullifier_hash,
        verificationLevel: verificationData.verification_level,
        userInfo: backendResult.user
      };

    } catch (error) {
      console.error('💥 World ID verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorCode: 'VERIFICATION_ERROR'
      };
    }
  }

  /**
   * Send verification to backend for storage and final verification
   */
  private static async sendVerificationToBackend(
    verificationData: any,
    walletAddress: string,
    signal?: string
  ): Promise<{ success: boolean; error?: string; errorCode?: string; user?: any }> {
    try {
      const backendUrl = config.backend.baseUrl;
      const response = await fetch(`${backendUrl}/api/worldid/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payload: verificationData,
          action: this.ACTION_ID,
          signal: signal || walletAddress,
          walletAddress: walletAddress
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Backend verification failed:', result);
        return {
          success: false,
          error: result.message || 'Backend verification failed',
          errorCode: result.errorCode || 'BACKEND_ERROR'
        };
      }

      console.log('✅ Backend verification successful:', result);
      return {
        success: true,
        user: result.user
      };

    } catch (error) {
      console.error('Backend verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        errorCode: 'NETWORK_ERROR'
      };
    }
  }

  /**
   * Check user's World ID verification status
   */
  static async checkVerificationStatus(walletAddress: string): Promise<WorldIdVerificationStatus> {
    try {
      console.log('🔍 Checking World ID verification status for:', walletAddress);

      const backendUrl = config.backend.baseUrl;
      const response = await fetch(`${backendUrl}/api/worldid/status/${walletAddress}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Status check failed:', result);
        return {
          isVerified: false
        };
      }

      if (result.verified && result.user) {
        return {
          isVerified: true,
          verificationLevel: result.user.worldIdVerification.verificationLevel,
          verificationDate: result.user.worldIdVerification.verificationDate,
          nullifierHash: result.user.worldIdVerification.nullifierHash
        };
      }

      return {
        isVerified: false
      };

    } catch (error) {
      console.error('Error checking verification status:', error);
      return {
        isVerified: false
      };
    }
  }

  /**
   * Get verification level display name
   */
  static getVerificationLevelName(level: VerificationLevel): string {
    switch (level) {
      case VerificationLevel.Orb:
        return 'Orb Verified';
      case VerificationLevel.Device:
        return 'Device Verified';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get verification level description
   */
  static getVerificationLevelDescription(level: VerificationLevel): string {
    switch (level) {
      case VerificationLevel.Orb:
        return 'Verified using Worldcoin Orb - highest level of verification';
      case VerificationLevel.Device:
        return 'Verified using device - basic level of verification';
      default:
        return 'Unknown verification level';
    }
  }

  /**
   * Check if user can verify (not already verified)
   */
  static async canVerify(walletAddress: string): Promise<boolean> {
    try {
      const status = await this.checkVerificationStatus(walletAddress);
      return !status.isVerified;
    } catch (error) {
      console.error('Error checking if user can verify:', error);
      return true; // Allow verification attempt if status check fails
    }
  }
}

export default WorldIdService; 