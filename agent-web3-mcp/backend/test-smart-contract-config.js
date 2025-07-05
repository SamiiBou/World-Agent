const { ethers } = require('ethers');
const agentRegistryService = require('./services/agentRegistryService');
const worldchainService = require('./services/worldchainService');
require('dotenv').config();

async function testSmartContractConfig() {
  console.log('🧪 === TESTING SMART CONTRACT CONFIGURATION ===');
  console.log('');
  
  // Test 1: Environment variables
  console.log('1️⃣ Testing environment variables:');
  console.log('  AGENT_REGISTRY_ADDRESS:', process.env.AGENT_REGISTRY_ADDRESS || 'NOT SET');
  console.log('  WORLD_CHAIN_RPC_URL:', process.env.WORLD_CHAIN_RPC_URL || 'NOT SET');
  console.log('  WORLD_CHAIN_PRIVATE_KEY:', process.env.WORLD_CHAIN_PRIVATE_KEY ? 'SET' : 'NOT SET');
  
  if (!process.env.AGENT_REGISTRY_ADDRESS) {
    console.log('❌ AGENT_REGISTRY_ADDRESS is not set!');
  }
  
  if (!process.env.WORLD_CHAIN_RPC_URL) {
    console.log('❌ WORLD_CHAIN_RPC_URL is not set!');
  }
  
  if (!process.env.WORLD_CHAIN_PRIVATE_KEY) {
    console.log('❌ WORLD_CHAIN_PRIVATE_KEY is not set!');
  }
  
  console.log('');
  
  // Test 2: WorldChain Service
  console.log('2️⃣ Testing WorldChain Service:');
  try {
    const provider = await worldchainService.getProvider();
    console.log('  ✅ Provider created successfully');
    
    const signer = await worldchainService.getSigner();
    console.log('  ✅ Signer created successfully');
    
    console.log('  📍 Signer address:', await signer.getAddress());
    const balance = await signer.getBalance();
    console.log('  💰 Balance:', ethers.formatEther(balance), 'ETH');
    
    if (parseFloat(ethers.formatEther(balance)) === 0) {
      console.log('  ⚠️  Warning: Signer has no balance for gas fees');
    }
    
  } catch (error) {
    console.log('  ❌ WorldChain Service test failed:', error.message);
    return;
  }
  
  console.log('');
  
  // Test 3: Agent Registry Service
  console.log('3️⃣ Testing Agent Registry Service:');
  try {
    await agentRegistryService.initialize();
    console.log('  ✅ Agent Registry Service initialized successfully');
    
    // Test contract connection by checking if we can read from it
    const contractAddress = agentRegistryService.getContractAddress();
    console.log('  📍 Contract address:', contractAddress);
    
    // Try to call a view function to test connectivity
    const totalAgents = await agentRegistryService.getContract().getTotalAgents();
    console.log('  📊 Total agents in registry:', totalAgents.toString());
    
  } catch (error) {
    console.log('  ❌ Agent Registry Service test failed:', error.message);
    return;
  }
  
  console.log('');
  
  // Test 4: Test transaction simulation
  console.log('4️⃣ Testing transaction simulation:');
  try {
    const testAddress = '0x1234567890123456789012345678901234567890';
    const testUsername = 'test_user_' + Date.now();
    const testWorldId = ethers.ZeroHash;
    const testSelfId = ethers.ZeroHash;
    
    console.log('  📋 Test parameters:');
    console.log('    Agent Address:', testAddress);
    console.log('    Username:', testUsername);
    console.log('    World ID Nullifier:', testWorldId);
    console.log('    Self ID Nullifier:', testSelfId);
    
    // Estimate gas for the transaction
    const contract = agentRegistryService.getContract();
    const gasEstimate = await contract.estimateGas.registerAgent(
      testAddress,
      testWorldId,
      testSelfId,
      testUsername
    );
    
    console.log('  ⛽ Gas estimate:', gasEstimate.toString());
    
    const gasPrice = await agentRegistryService.getContract().runner.provider.getGasPrice();
    const estimatedCost = gasEstimate * gasPrice;
    console.log('  💰 Estimated cost:', ethers.formatEther(estimatedCost), 'ETH');
    
    console.log('  ✅ Transaction simulation successful');
    
  } catch (error) {
    console.log('  ❌ Transaction simulation failed:', error.message);
    if (error.reason) {
      console.log('  💬 Reason:', error.reason);
    }
    return;
  }
  
  console.log('');
  console.log('🎉 === ALL TESTS PASSED ===');
  console.log('✅ Your smart contract configuration is working correctly!');
  console.log('');
  console.log('🚀 You can now create agents and they will be registered in the smart contract.');
}

// Run the test
testSmartContractConfig().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 