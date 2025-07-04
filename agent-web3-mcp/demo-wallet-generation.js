#!/usr/bin/env node

/**
 * 🔑 DEMO: Address generation for the agent
 * 
 * This script shows how the agent's World Chain address is generated
 */

const { ethers } = require('ethers');

console.log('🌍 WORLD CHAIN ADDRESS GENERATION FOR AGENT\n');

// 1. Generate a wallet (same as in the app)
console.log('1. 🔐 Generating wallet...');
const wallet = ethers.Wallet.createRandom();

console.log('2. ✅ Wallet generated successfully:');
console.log('   📍 Address:', wallet.address);
console.log('   🔑 Private key:', wallet.privateKey);
console.log('   📝 Mnemonic:', wallet.mnemonic.phrase);

// 2. Address verification
console.log('\n3. ✅ Address verification:');
console.log('   🔍 Valid address:', ethers.utils.isAddress(wallet.address));
console.log('   📏 Address length:', wallet.address.length);
console.log('   🏷️  Address format:', wallet.address.substring(0, 6) + '...' + wallet.address.substring(38));

// 3. Explorer link
console.log('\n4. 🔗 Explorer links:');
const explorerBaseUrl = 'https://worldchain-mainnet.explorer.alchemy.com';
console.log('   📍 Address:', `${explorerBaseUrl}/address/${wallet.address}`);
console.log('   💰 Balance:', `${explorerBaseUrl}/address/${wallet.address}#balance`);

// 4. Connection to World Chain
console.log('\n5. 🌐 Connection to World Chain:');
const rpcUrl = 'https://worldchain-mainnet.g.alchemy.com/v2/vCq59BHgMYA2JIRKAbRPmIL8OaTeRAgu';

try {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  console.log('   ✅ Provider created successfully');
  
  // Test connection
  provider.getNetwork().then(network => {
    console.log('   🌍 Network:', network.name);
    console.log('   🔗 Chain ID:', network.chainId);
    console.log('   💰 Initial balance: 0 ETH (new address)');
    
    // Test balance (will be 0 for new address)
    provider.getBalance(wallet.address).then(balance => {
      console.log('   📊 Current balance:', ethers.utils.formatEther(balance), 'ETH');
    });
  }).catch(err => {
    console.log('   ⚠️ Connection error:', err.message);
  });
  
} catch (error) {
  console.log('   ❌ Connection error:', error.message);
}

// 5. How it works in the app
console.log('\n6. 🎯 How it works in the app:');
console.log('   1. On first launch, the agent generates a new address');
console.log('   2. The agent stores it in the database');
console.log('   3. On subsequent launches, the agent uses the same address');
console.log('   4. The address is displayed in the chat interface');
console.log('   5. The agent can use this address for all World Chain operations');

console.log('\n' + '='.repeat(60));
console.log('📝 This address will be used by the agent for all World Chain operations.');
console.log('💡 To test with real ETH:');
console.log('   - Send ETH to this address');
console.log('   - Check the balance via the agent');
console.log('   - Test transfers between addresses');

console.log('\n🔄 Agent process flow:');
console.log('1. On first launch, the agent generates a new address');
console.log('2. The address is stored in localStorage');
console.log('3. On subsequent launches, the agent uses the same address');
console.log('4. The address is displayed in the chat interface');
console.log('5. The agent can use this address for all World Chain operations');

console.log('\n✅ Done! The agent is ready to interact with World Chain.'); 