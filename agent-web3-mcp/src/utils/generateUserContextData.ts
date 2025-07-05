// Shared utility for generating consistent userContextData
// This ensures frontend and backend use the exact same logic
import { v4 as uuidv4 } from 'uuid';

export interface UserContextInput {
  userId?: string;
  sessionId?: string;
  scope: string;
  endpoint: string;
  timestamp?: number;
  customData?: Record<string, unknown>;
}

export function generateUserContextData(input: UserContextInput): string {
  // Use current timestamp if not provided
  const timestamp = input.timestamp || Date.now();
  
  // Generate a deterministic userId if not provided
  const userId = input.userId || uuidv4();
  
  // Generate a sessionId if not provided
  const sessionId = input.sessionId || `session-${Math.random().toString(36).substr(2, 9)}`;
  
  const contextData = {
    userId,
    sessionId,
    scope: input.scope,
    endpoint: input.endpoint,
    timestamp,
    ...input.customData
  };
  
  const jsonString = JSON.stringify(contextData);
  // Browser-compatible hex encoding without Buffer
  const hexString = Array.from(new TextEncoder().encode(jsonString))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return hexString;
}

// For testing - calculate the hash that Self SDK will generate
export async function calculateUserContextHash(userContextData: string): Promise<string> {
  // Browser-compatible crypto using Web Crypto API
  // const encoder = new TextEncoder();
  // const data = encoder.encode(userContextData);
  
  // Convert hex string back to bytes
  const bytes = new Uint8Array(userContextData.length / 2);
  for (let i = 0; i < userContextData.length; i += 2) {
    bytes[i / 2] = parseInt(userContextData.substr(i, 2), 16);
  }
  
  // Use Web Crypto API for hashing
  const sha256Hash = await crypto.subtle.digest('SHA-256', bytes);
  // Note: RIPEMD160 is not available in Web Crypto API
  // This is a simplified version - you may need a polyfill for full compatibility
  const hashArray = Array.from(new Uint8Array(sha256Hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return BigInt('0x' + hashHex.substring(0, 40)).toString();
}

export default generateUserContextData; 