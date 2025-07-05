const { ethers } = require('ethers');
const agentRegistryService = require('./services/agentRegistryService');
const Agent = require('./models/Agent');
const mongoose = require('mongoose');
require('dotenv').config();

async function checkAgentRegistry() {
  console.log('🔍 === CHECKING AGENT REGISTRY ===\n');

  // Connect to database
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agent-web3');
    console.log('✅ Connected to database\n');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return;
  }

  try {
    // Initialize the registry service
    await agentRegistryService.initialize();
    console.log('✅ AgentRegistry service initialized\n');

    // 1. Get total agents in registry
    console.log('📊 === TOTAL AGENTS IN REGISTRY ===');
    try {
      const totalAgents = await agentRegistryService.getContract().getTotalAgents();
      console.log(`Total agents registered: ${totalAgents.toString()}\n`);
    } catch (error) {
      console.error('❌ Failed to get total agents:', error.message, '\n');
    }

    // 2. Check agents from database
    console.log('📋 === CHECKING AGENTS FROM DATABASE ===');
    const dbAgents = await Agent.find().limit(10);
    
    if (dbAgents.length === 0) {
      console.log('No agents found in database\n');
      return;
    }

    for (const dbAgent of dbAgents) {
      console.log(`\n🤖 Checking agent: ${dbAgent.name} (@${dbAgent.username})`);
      console.log(`   Database ID: ${dbAgent._id}`);
      console.log(`   Wallet Address: ${dbAgent.worldchain.address}`);
      console.log(`   Registry Status: ${dbAgent.registry?.isRegistered ? '✅ Registered' : '❌ Not registered'}`);
      
      if (dbAgent.registry?.registrationTxHash) {
        console.log(`   Transaction: ${dbAgent.registry.registrationTxHash}`);
      }

      // Check if agent exists in smart contract
      try {
        const contractAgent = await agentRegistryService.getAgent(dbAgent.worldchain.address);
        console.log('   📄 Smart Contract Data:');
        console.log(`      Agent Address: ${contractAgent.agentAddress}`);
        console.log(`      Owner: ${contractAgent.ownerWallet}`);
        console.log(`      Username: ${contractAgent.username}`);
        console.log(`      Registration Time: ${contractAgent.registrationTime}`);
        console.log(`      Is Active: ${contractAgent.isActive}`);
        console.log(`      World ID Nullifier: ${contractAgent.worldIdNullifier}`);
        console.log(`      Self ID Nullifier: ${contractAgent.selfIdNullifier}`);
        console.log('   ✅ Agent found in smart contract');
      } catch (error) {
        console.log('   ❌ Agent not found in smart contract or error:', error.message);
      }
    }

    // 3. Check agents by owner
    console.log('\n👥 === CHECKING AGENTS BY OWNER ===');
    if (dbAgents.length > 0) {
      const firstAgent = dbAgents[0];
      const ownerAddress = firstAgent.ownerWalletAddress;
      
      try {
        const ownerAgents = await agentRegistryService.getAgentsByOwner(ownerAddress);
        console.log(`Owner ${ownerAddress} has ${ownerAgents.length} agents in smart contract:`);
        
        for (const agentAddress of ownerAgents) {
          try {
            const agentInfo = await agentRegistryService.getAgent(agentAddress);
            console.log(`   - ${agentInfo.username} (${agentAddress})`);
          } catch (error) {
            console.log(`   - ${agentAddress} (failed to get info: ${error.message})`);
          }
        }
      } catch (error) {
        console.error('❌ Failed to get agents by owner:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Registry check failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

// Function to check a specific agent
async function checkSpecificAgent(agentAddress) {
  console.log(`🔍 === CHECKING SPECIFIC AGENT: ${agentAddress} ===\n`);
  
  try {
    await agentRegistryService.initialize();
    
    const agentInfo = await agentRegistryService.getAgent(agentAddress);
    
    console.log('📄 Agent Information:');
    console.log(`   Agent Address: ${agentInfo.agentAddress}`);
    console.log(`   Owner Wallet: ${agentInfo.ownerWallet}`);
    console.log(`   Username: ${agentInfo.username}`);
    console.log(`   Registration Time: ${agentInfo.registrationTime}`);
    console.log(`   Is Active: ${agentInfo.isActive}`);
    console.log(`   World ID Nullifier: ${agentInfo.worldIdNullifier}`);
    console.log(`   Self ID Nullifier: ${agentInfo.selfIdNullifier}`);
    
    console.log('\n🔗 Blockchain Links:');
    console.log(`   Agent on Explorer: https://worldchain-mainnet.explorer.alchemy.com/address/${agentInfo.agentAddress}`);
    console.log(`   Owner on Explorer: https://worldchain-mainnet.explorer.alchemy.com/address/${agentInfo.ownerWallet}`);
    
  } catch (error) {
    console.error('❌ Failed to check agent:', error.message);
  }
}

// Check if called with specific agent address
const agentAddress = process.argv[2];
if (agentAddress) {
  if (ethers.isAddress(agentAddress)) {
    checkSpecificAgent(agentAddress);
  } else {
    console.error('❌ Invalid agent address provided');
  }
} else {
  checkAgentRegistry();
} 