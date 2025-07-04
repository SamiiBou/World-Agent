#!/usr/bin/env node

/**
 * Test script for World Chain integration
 * This script demonstrates the agent's World Chain capabilities
 */

const { worldchainService } = require('./src/services/worldchainService');
const { agentService } = require('./src/services/agentService');

async function testWorldChainIntegration() {
  console.log('🌍 Testing World Chain Integration\n');

  try {
    // Initialize World Chain service
    console.log('1. Initializing World Chain service...');
    await worldchainService.initialize();
    
    // Get agent wallet info
    console.log('2. Getting agent wallet information...');
    const walletInfo = await worldchainService.getAgentWalletInfo();
    console.log('   📍 Agent Address:', walletInfo.address);
    console.log('   💰 Balance:', walletInfo.balanceFormatted);
    console.log('   🔗 Explorer:', walletInfo.blockExplorerUrl);
    console.log('   🌍 Network:', walletInfo.chainName, `(Chain ID: ${walletInfo.chainId})`);
    
    // Test chat responses
    console.log('\n3. Testing chat responses...');
    
    const testMessages = [
      "Hello",
      "What's my address?",
      "What's my balance?",
      "worldchain",
      "help"
    ];
    
    for (const message of testMessages) {
      console.log(`\n   User: "${message}"`);
      const response = await agentService.processMessage(message);
      console.log(`   Agent: ${response.response.substring(0, 100)}...`);
      
      if (response.toolCalls.length > 0) {
        console.log(`   🔧 Tool used: ${response.toolCalls[0].name}`);
      }
    }
    
    console.log('\n✅ World Chain integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testWorldChainIntegration();
} 