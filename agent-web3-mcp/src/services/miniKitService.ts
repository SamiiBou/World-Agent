import { MiniKit, WalletAuthInput, MiniAppWalletAuthPayload } from '@worldcoin/minikit-js';
import { config } from '../config/environment';

// Types pour notre service
export interface WalletAuthResult {
  success: boolean;
  walletAddress?: string;
  username?: string;
  error?: string;
  payload?: MiniAppWalletAuthPayload;
}

export interface AuthenticationState {
  isAuthenticated: boolean;
  walletAddress?: string;
  username?: string;
  timestamp?: string;
}

export class MiniKitService {
  private static authState: AuthenticationState = {
    isAuthenticated: false
  };

  /**
   * Check if MiniKit is installed and ready to use
   * This will only return true if the app is opened inside the World App
   */
  static isInstalled(): boolean {
    try {
      // Primary check: Use MiniKit's built-in method
      const miniKitInstalled = MiniKit.isInstalled();
      console.log('MiniKit.isInstalled() result:', miniKitInstalled);
      
      // Secondary check: Look for World App specific indicators
      const isWorldApp = this.isRunningInWorldApp();
      console.log('isRunningInWorldApp() result:', isWorldApp);
      
      // If either check passes, consider it installed
      const result = miniKitInstalled || isWorldApp;
      console.log('Final isInstalled result:', result);
      
      return result;
    } catch (error) {
      console.error('Error checking MiniKit installation:', error);
      
      // Fallback: Try alternative detection
      try {
        const fallbackResult = this.isRunningInWorldApp();
        console.log('Fallback detection result:', fallbackResult);
        return fallbackResult;
      } catch (fallbackError) {
        console.error('Fallback detection failed:', fallbackError);
        return false;
      }
    }
  }

  /**
   * Alternative method to detect if running in World App
   */
  private static isRunningInWorldApp(): boolean {
    try {
      // Check for World App specific user agent
      const userAgent = navigator.userAgent;
      console.log('User agent:', userAgent);
      
      // Check if running in World App context
      const isWorldAppUA = userAgent.includes('WorldApp') || userAgent.includes('World App');
      
      // Check for window.MiniKit object existence
      const hasMiniKitObject = typeof window !== 'undefined' && 
                              typeof (window as any).MiniKit !== 'undefined';
      
      // Check for World App specific global variables
      const hasWorldAppGlobals = typeof window !== 'undefined' && 
                                (typeof (window as any).worldApp !== 'undefined' ||
                                 typeof (window as any).WorldApp !== 'undefined');
      
      // Check if we can access MiniKit methods
      let canAccessMiniKit = false;
      try {
        canAccessMiniKit = typeof MiniKit !== 'undefined' && 
                          typeof MiniKit.isInstalled === 'function';
      } catch (e) {
        console.log('Cannot access MiniKit methods:', e);
      }
      
      console.log('World App detection:', {
        isWorldAppUA,
        hasMiniKitObject,
        hasWorldAppGlobals,
        canAccessMiniKit
      });
      
      // If any of these indicators are true, assume we're in World App
      return isWorldAppUA || hasMiniKitObject || hasWorldAppGlobals || canAccessMiniKit;
    } catch (error) {
      console.error('Error in isRunningInWorldApp:', error);
      return false;
    }
  }

  /**
   * Get the MiniKit instance
   */
  static getMiniKit() {
    return MiniKit;
  }

  /**
   * Initialize MiniKit with optional configuration
   */
  static init(config?: any) {
    try {
      console.log('🔧 Initializing MiniKit...');
      
      // First, try to install MiniKit
      try {
        console.log('📦 Installing MiniKit...');
        const installResult = MiniKit.install();
        console.log('MiniKit install result:', installResult);
      } catch (installError) {
        console.warn('MiniKit install failed, continuing anyway:', installError);
      }
      
      // Wait a moment for MiniKit to initialize
      setTimeout(() => {
        const installed = this.isInstalled();
        console.log('MiniKit initialized:', installed);
        
        if (installed) {
          console.log('✅ MiniKit is available and ready to use');
        } else {
          console.log('❌ MiniKit is not available - running in browser mode');
        }
      }, 500);
      
      // Return immediate status (might be false initially)
      return this.isInstalled();
    } catch (error) {
      console.error('Error initializing MiniKit:', error);
      return false;
    }
  }

  /**
   * Get current authentication state
   */
  static getAuthState(): AuthenticationState {
    return this.authState;
  }

  /**
   * Set authentication state
   */
  static setAuthState(state: AuthenticationState) {
    this.authState = state;
  }

  /**
   * Sign in with Ethereum wallet using MiniKit
   */
  static async signInWithWallet(): Promise<WalletAuthResult> {
    try {
      console.log('🔐 Starting wallet authentication...');
      
      // First, check if MiniKit is installed
      if (!this.isInstalled()) {
        console.log('MiniKit not detected, attempting to install...');
        
        // Try to install MiniKit
        try {
          const installResult = MiniKit.install();
          console.log('MiniKit install attempt result:', installResult);
          
          // Wait a moment for installation to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check again
          if (!this.isInstalled()) {
            return {
              success: false,
              error: 'MiniKit could not be initialized. Please make sure you are running this app inside World App.'
            };
          }
        } catch (installError) {
          console.error('MiniKit installation failed:', installError);
          return {
            success: false,
            error: 'MiniKit installation failed. Please make sure you are running this app inside World App.'
          };
        }
      }

      console.log('Starting wallet authentication...');

      // 1. Get nonce from backend
      console.log('🔍 Fetching nonce from backend...');
      const backendUrl = config.backend.baseUrl;
      const nonceUrl = `${backendUrl}/api/nonce`;
      console.log('Making request to:', nonceUrl);
      
      let nonceResponse;
      try {
        nonceResponse = await fetch(nonceUrl);
        console.log('Nonce response status:', nonceResponse.status);
        console.log('Nonce response headers:', Object.fromEntries(nonceResponse.headers.entries()));
      } catch (fetchError) {
        console.error('❌ Fetch error:', fetchError);
        throw new Error(`Network error when fetching nonce: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      }
      
      if (!nonceResponse.ok) {
        const responseText = await nonceResponse.text();
        console.error('❌ Non-OK response:', responseText);
        throw new Error(`Failed to get nonce from server: ${nonceResponse.status} ${nonceResponse.statusText} - ${responseText}`);
      }
      
      let nonceData;
      try {
        const responseText = await nonceResponse.text();
        console.log('Raw response text:', responseText);
        nonceData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        throw new Error(`Invalid JSON response from nonce endpoint: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
      }
      
      const nonce = nonceData.nonce;

      console.log('Got nonce:', nonce);

      // Validate nonce format
      if (!nonce || typeof nonce !== 'string' || nonce.length < 8) {
        throw new Error('Invalid nonce format received from server');
      }

      // 2. Prepare wallet auth parameters
      const now = new Date();
      const walletAuthInput: WalletAuthInput = {
        nonce: nonce,
        requestId: '0', // Optional
        expirationTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
        notBefore: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24 hours ago
        statement: 'Sign in to World Agent App to access your decentralized AI assistant.',
      };

      console.log('🔧 Prepared wallet auth input:', {
        ...walletAuthInput,
        nonce: nonce.substring(0, 8) + '...' // Log only first 8 chars for security
      });

      // 3. Call MiniKit wallet auth with error handling
      console.log('📱 Calling MiniKit wallet auth...');
      let commandPayload, finalPayload;
      try {
        const result = await MiniKit.commandsAsync.walletAuth(walletAuthInput);
        commandPayload = result.commandPayload;
        finalPayload = result.finalPayload;
        
        console.log('MiniKit wallet auth successful:', {
          commandStatus: (commandPayload as any)?.status,
          finalStatus: (finalPayload as any)?.status,
          address: (finalPayload as any)?.address?.substring(0, 6) + '...' + (finalPayload as any)?.address?.substring(-4)
        });
        
      } catch (miniKitError) {
        console.error('❌ MiniKit wallet auth failed:', miniKitError);
        
        // Enhanced error handling
        if (miniKitError instanceof Error) {
          const errorMessage = miniKitError.message;
          
          if (errorMessage.includes('not installed')) {
            return {
              success: false,
              error: 'MiniKit is not properly installed. Please close and reopen this app in World App.'
            };
          }
          
          if (errorMessage.includes('expected pattern')) {
            return {
              success: false,
              error: 'Invalid parameter format. This might be a configuration issue. Please try again.'
            };
          }
          
          if (errorMessage.includes('DOMException')) {
            return {
              success: false,
              error: 'Authentication was cancelled or failed. Please try again.'
            };
          }
          
          return {
            success: false,
            error: `Authentication failed: ${errorMessage}`
          };
        }
        
        // For DOMException or other non-Error objects
        return {
          success: false,
          error: 'Authentication was cancelled or failed. Please try again.'
        };
      }

      // 4. Validate the response
      if (!finalPayload) {
        return {
          success: false,
          error: 'No response received from MiniKit authentication'
        };
      }

      console.log('MiniKit response status:', (finalPayload as any).status);

      // 5. Check if authentication was successful
      if ((finalPayload as any).status === 'error') {
        return {
          success: false,
          error: `Authentication failed: ${(finalPayload as any).error_code || 'Unknown error'}`,
          payload: finalPayload
        };
      }

      if ((finalPayload as any).status !== 'success') {
        return {
          success: false,
          error: `Authentication incomplete: ${(finalPayload as any).status}`,
          payload: finalPayload
        };
      }

      // 6. Validate wallet address
      const walletAddress = (finalPayload as any).address;
      if (!walletAddress) {
        return {
          success: false,
          error: 'No wallet address received from authentication'
        };
      }

      // 7. Get user info from MiniKit
      const userInfo = {
        username: MiniKit.user?.username,
        walletAddress: walletAddress
      };

      console.log('👤 User info:', {
        username: userInfo.username,
        address: userInfo.walletAddress?.substring(0, 6) + '...' + userInfo.walletAddress?.substring(-4)
      });

      // 8. Complete authentication with backend
      console.log('🔐 Completing authentication with backend...');
      const completeSiweUrl = `${backendUrl}/api/complete-siwe`;
      console.log('Making complete-siwe request to:', completeSiweUrl);
      
      const authResponse = await fetch(completeSiweUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payload: finalPayload,
          nonce: nonce,
          userInfo: userInfo
        }),
      });

      if (!authResponse.ok) {
        throw new Error(`Backend authentication verification failed: ${authResponse.status} ${authResponse.statusText}`);
      }

      const authResult = await authResponse.json();
      console.log('✅ Backend authentication result:', authResult);

      if (authResult.status === 'success') {
        // Update local auth state
        this.setAuthState({
          isAuthenticated: true,
          walletAddress: authResult.walletAddress,
          username: authResult.username,
          timestamp: authResult.timestamp
        });

        return {
          success: true,
          walletAddress: authResult.walletAddress,
          username: authResult.username,
          payload: finalPayload
        };
      } else {
        return {
          success: false,
          error: authResult.error || 'Authentication verification failed',
          payload: finalPayload
        };
      }

    } catch (error) {
      console.error('💥 Wallet authentication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Sign out and clear authentication state
   */
  static signOut() {
    this.setAuthState({
      isAuthenticated: false
    });
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  /**
   * Get authenticated wallet address
   */
  static getWalletAddress(): string | undefined {
    return this.authState.walletAddress;
  }

  /**
   * Get authenticated username
   */
  static getUsername(): string | undefined {
    return this.authState.username;
  }
}

// Export for easier access
export const miniKit = MiniKit;
export default MiniKitService; 