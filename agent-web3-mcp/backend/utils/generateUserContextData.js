// Shared utility for generating consistent userContextData
// This ensures frontend and backend use the exact same logic
const { v4: uuidv4 } = require('uuid');

function generateUserContextData(input) {
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
  // Node.js hex encoding
  const hexString = Buffer.from(jsonString, 'utf8').toString('hex');
  
  return hexString;
}

module.exports = { generateUserContextData }; 