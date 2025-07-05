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
      
      // === COMPREHENSIVE WALLET & DEVICE INFO LOGGING ===
      console.log('📱 === MINIKIT COMPREHENSIVE INFO ===');
      
      // 1. MiniKit Installation & Version Info
      console.log('🔧 MiniKit Installation Status:', this.isInstalled());
      console.log('🔧 MiniKit App ID:', MiniKit.appId);
      
      // 2. Complete User Information
      console.log('👤 === COMPLETE USER INFO ===');
      console.log('👤 Full User Object:', JSON.stringify(MiniKit.user, null, 2));
      if (MiniKit.user) {
        console.log('👤 User Wallet Address:', MiniKit.user.walletAddress);
        console.log('👤 User Username:', MiniKit.user.username);
        console.log('👤 User Profile Picture URL:', MiniKit.user.profilePictureUrl);
        console.log('👤 User Permissions:', JSON.stringify(MiniKit.user.permissions, null, 2));
        console.log('👤 User Opted Into Optional Analytics:', MiniKit.user.optedIntoOptionalAnalytics);
        console.log('👤 User World App Version (deprecated):', MiniKit.user.worldAppVersion);
        console.log('👤 User Device OS (deprecated):', MiniKit.user.deviceOS);
      }
      
      // 3. Device Properties
      console.log('📱 === DEVICE PROPERTIES ===');
      console.log('📱 Full Device Properties:', JSON.stringify(MiniKit.deviceProperties, null, 2));
      if (MiniKit.deviceProperties) {
        console.log('📱 Safe Area Insets:', JSON.stringify(MiniKit.deviceProperties.safeAreaInsets, null, 2));
        console.log('📱 Device OS:', MiniKit.deviceProperties.deviceOS);
        console.log('📱 World App Version:', MiniKit.deviceProperties.worldAppVersion);
      }
      
      // 4. Try to get additional user info by address
      if (MiniKit.user?.walletAddress) {
        try {
          console.log('👤 === ADDITIONAL USER INFO BY ADDRESS ===');
          const userByAddress = await MiniKit.getUserByAddress(MiniKit.user.walletAddress);
          console.log('👤 User by Address:', JSON.stringify(userByAddress, null, 2));
          
          const userInfo = await MiniKit.getUserInfo(MiniKit.user.walletAddress);
          console.log('👤 User Info:', JSON.stringify(userInfo, null, 2));
        } catch (userInfoError) {
          console.log('👤 Could not fetch additional user info:', userInfoError);
        }
      }
      
      // 5. Try to get user by username if available
      if (MiniKit.user?.username) {
        try {
          console.log('👤 === USER INFO BY USERNAME ===');
          const userByUsername = await MiniKit.getUserByUsername(MiniKit.user.username);
          console.log('👤 User by Username:', JSON.stringify(userByUsername, null, 2));
        } catch (usernameError) {
          console.log('👤 Could not fetch user by username:', usernameError);
        }
      }
      
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
        if (!nonceResponse.ok) {
          throw new Error(`Failed to fetch nonce: ${nonceResponse.status} ${nonceResponse.statusText}`);
        }
      } catch (fetchError) {
        console.error('Failed to fetch nonce:', fetchError);
        return {
          success: false,
          error: `Failed to connect to backend: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`
        };
      }

      const nonceData = await nonceResponse.json();
      const nonce = nonceData.nonce;
      console.log('✅ Got nonce:', nonce ? `${nonce.substring(0, 8)}...` : 'null');

      if (!nonce) {
        return {
          success: false,
          error: 'Failed to get authentication nonce from backend'
        };
      }

      // 2. Prepare wallet auth input
      const walletAuthInput: WalletAuthInput = {
        nonce: nonce,
        statement: 'Sign in to World Agent',
        requestId: `world-agent-${Date.now()}`
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
        
        // === COMPREHENSIVE AUTHENTICATION RESULT LOGGING ===
        console.log('🎉 === COMPLETE AUTHENTICATION RESULT ===');
        console.log('🎉 Full Command Payload:', JSON.stringify(commandPayload, null, 2));
        console.log('🎉 Full Final Payload:', JSON.stringify(finalPayload, null, 2));
        
        // Detailed breakdown of the authentication payload
        if (finalPayload) {
          console.log('🎉 === AUTHENTICATION PAYLOAD BREAKDOWN ===');
          console.log('🎉 Status:', (finalPayload as any).status);
          console.log('🎉 Message:', (finalPayload as any).message);
          console.log('🎉 Signature:', (finalPayload as any).signature);
          console.log('🎉 Address:', (finalPayload as any).address);
          console.log('🎉 Version:', (finalPayload as any).version);
          
          // Check for error details
          if ((finalPayload as any).error_code) {
            console.log('❌ Error Code:', (finalPayload as any).error_code);
            console.log('❌ Error Details:', (finalPayload as any).details);
          }
        }
        
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

      console.log('👤 === FINAL USER INFO COMPILATION ===');
      console.log('👤 Final User Info:', JSON.stringify(userInfo, null, 2));
      console.log('👤 Username:', userInfo.username);
      console.log('👤 Wallet Address:', userInfo.walletAddress);
      console.log('👤 Address (formatted):', userInfo.walletAddress?.substring(0, 6) + '...' + userInfo.walletAddress?.substring(-4));

      // 8. Complete authentication with backend
      console.log('🔐 Completing authentication with backend...');
      const completeSiweUrl = `${backendUrl}/api/complete-siwe`;
      console.log('Making complete-siwe request to:', completeSiweUrl);
      
      // Log the complete data being sent to backend
      const backendPayload = {
        payload: finalPayload,
        nonce: nonce,
        userInfo: userInfo
      };
      console.log('📤 === COMPLETE BACKEND PAYLOAD ===');
      console.log('📤 Backend Payload:', JSON.stringify(backendPayload, null, 2));
      
      const authResponse = await fetch(completeSiweUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendPayload),
      });

      if (!authResponse.ok) {
        throw new Error(`Backend authentication verification failed: ${authResponse.status} ${authResponse.statusText}`);
      }

      const authResult = await authResponse.json();
      console.log('✅ === COMPLETE BACKEND AUTHENTICATION RESULT ===');
      console.log('✅ Backend Response:', JSON.stringify(authResult, null, 2));

      if (authResult.status === 'success') {
        // Update local auth state
        this.setAuthState({
          isAuthenticated: true,
          walletAddress: authResult.walletAddress,
          username: authResult.username,
          timestamp: authResult.timestamp
        });

        // Final success logging
        console.log('🎊 === AUTHENTICATION SUCCESS SUMMARY ===');
        console.log('🎊 Success: true');
        console.log('🎊 Wallet Address:', authResult.walletAddress);
        console.log('🎊 Username:', authResult.username);
        console.log('🎊 Timestamp:', authResult.timestamp);
        console.log('🎊 Authentication completed successfully!');

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
  static signOut(): void {
    console.log('🔐 Signing out user...');
    
    // Clear authentication state
    this.authState = {
      isAuthenticated: false
    };
    
    // Clear any stored tokens or session data
    // In a production app, you might want to:
    // - Clear localStorage/sessionStorage
    // - Invalidate server-side sessions
    // - Clear any cached user data
    
    console.log('✅ User signed out successfully');
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