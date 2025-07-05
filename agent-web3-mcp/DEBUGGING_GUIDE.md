# 🔧 Debugging Guide for Smart Contract Integration

## Quick Start - Test Your Configuration

Before creating agents, run this test to verify everything is working:

```bash
cd agent-web3-mcp/backend
node test-smart-contract-config.js
```

This will check:
- ✅ Environment variables
- ✅ WorldChain connectivity
- ✅ Smart contract access
- ✅ Transaction simulation

## Required Environment Variables

Create a `.env` file in the `backend` directory with these variables:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/agent-web3

# World Chain Configuration
WORLD_CHAIN_RPC_URL=https://worldchain-mainnet.g.alchemy.com/v2/your-api-key
WORLD_CHAIN_PRIVATE_KEY=your-private-key-here

# Smart Contract Addresses
AGENT_REGISTRY_ADDRESS=0x2D4c6D47A5003ab2C6503B445c860245dDcDC88F
AGENT_DAO_ADDRESS=0xc84eE72859AA1Cb9872D4875cd7FA329cCDd073c
```

## Common Issues and Solutions

### 1. "WORLD_CHAIN_PRIVATE_KEY environment variable is not set"

**Problem**: The private key for signing transactions is missing.

**Solution**: 
1. Get a private key from a wallet that has ETH on World Chain
2. Add it to your `.env` file:
   ```env
   WORLD_CHAIN_PRIVATE_KEY=0x1234567890abcdef...
   ```

### 2. "Provider test failed" or "Signer test failed"

**Problem**: Cannot connect to World Chain RPC.

**Solution**:
1. Check your RPC URL in `.env`
2. Verify the RPC endpoint is working:
   ```bash
   curl -X POST -H "Content-Type: application/json" \
     --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
     https://worldchain-mainnet.g.alchemy.com/v2/your-api-key
   ```

### 3. "Signer has no balance for gas fees"

**Problem**: The wallet has no ETH to pay for gas fees.

**Solution**:
1. Send some ETH to your signer address
2. Check balance with: `node test-smart-contract-config.js`

### 4. "World ID verification is required" or "Self ID verification is required"

**Problem**: User hasn't completed the required verifications.

**Solution**:
1. Complete World ID verification through the app
2. Complete Self ID verification through the app
3. Verify the user's verification status in the database

### 5. "Transaction simulation failed"

**Problem**: Smart contract interaction is failing.

**Solution**:
1. Check if the contract address is correct
2. Verify the contract is deployed on World Chain
3. Check if you have the correct ABI

## Debug Logs Explanation

When creating an agent, you'll see these logs:

### ✅ Successful Flow:
```
🚀 === STARTING AGENT CREATION ===
📝 Request body: { name: "MyAgent", username: "myagent123", ... }
👤 User data: { worldIdVerified: true, selfIdVerified: true, ... }
✅ All validations passed
🔑 Generating World Chain wallet...
✅ Generated wallet address: 0x...
🔍 Extracting nullifiers from user verifications...
🔐 Nullifiers extracted: { worldIdNullifier: "0x...", selfIdNullifier: "0x..." }
📄 Creating agent in database...
💾 Saving agent to database...
✅ Agent saved to database with ID: 64f...
🔗 === STARTING SMART CONTRACT REGISTRATION ===
📋 Registration parameters: { agentAddress: "0x...", username: "myagent123", ... }
🔄 Calling agentRegistryService.registerAgent...
🔧 === INITIALIZING AGENT REGISTRY SERVICE ===
📍 Registry address: 0x2D4c6D47A5003ab2C6503B445c860245dDcDC88F
🔐 Environment variables check: { AGENT_REGISTRY_ADDRESS: "0x2D4c...", ... }
🌐 Getting provider from worldchainService...
✅ Provider obtained: SUCCESS
✍️ Getting signer from worldchainService...
✅ Signer obtained: SUCCESS
🔑 Signer address: 0x...
📄 Creating contract instance...
✅ Contract instance created
✅ AgentRegistry service initialized successfully
🔗 === REGISTERING AGENT IN SMART CONTRACT ===
📋 Input parameters: { agentAddress: "0x...", username: "myagent123", ... }
🔧 Initializing service...
🔄 Formatting nullifiers...
📝 Formatted nullifiers: { worldIdNullifier: "0x...", selfIdNullifier: "0x..." }
🔍 Contract details: { contractAddress: "0x2D4c...", signerAddress: "0x..." }
💰 Checking signer balance...
  Signer balance: 0.1 ETH
⛽ Estimating gas...
  Gas estimate: 150000
📤 Sending transaction...
✅ Transaction sent successfully!
📄 Transaction hash: 0x...
⏳ Waiting for confirmation...
✅ Transaction confirmed!
🔗 Block number: 12345
⛽ Gas used: 143210
🎉 Registration completed successfully!
📤 Smart contract registration result: { txHash: "0x...", success: true }
📝 Updating agent with registry information...
💾 Saving updated agent with registry info...
✅ Agent successfully registered in smart contract
🔗 Transaction hash: 0x...
🔗 Linking agent to user...
✅ Agent linked to user successfully
📤 Sending success response...
🎉 === AGENT CREATION COMPLETED SUCCESSFULLY ===
```

### ❌ Error Indicators:
Look for these error patterns:
- `❌ World ID verification missing`
- `❌ Self ID verification missing`
- `❌ Error initializing AgentRegistry service`
- `❌ Gas estimation failed`
- `❌ === REGISTRATION FAILED ===`

## Manual Testing

### 1. Test Smart Contract Directly

```bash
cd agent-web3-mcp/backend
node -e "
const service = require('./services/agentRegistryService');
service.initialize().then(() => {
  console.log('✅ Service initialized');
  return service.getContract().getTotalAgents();
}).then(total => {
  console.log('📊 Total agents:', total.toString());
}).catch(console.error);
"
```

### 2. Test User Verifications

```bash
cd agent-web3-mcp/backend
node -e "
const User = require('./models/User');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agent-web3')
  .then(() => User.findOne({ walletAddress: 'YOUR_WALLET_ADDRESS' }))
  .then(user => {
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    console.log('👤 User found:', user.walletAddress);
    console.log('🌍 World ID verified:', user.worldIdVerification?.isVerified);
    console.log('🔐 Self ID verified:', user.selfIdVerification?.isVerified);
    console.log('🔑 World ID nullifier:', user.worldIdVerification?.nullifierHash);
    console.log('🔑 Self ID nullifier:', user.selfIdVerification?.verificationResult?.discloseOutput?.nullifier);
  })
  .catch(console.error)
  .finally(() => process.exit(0));
"
```

### 3. Check Contract on Explorer

Visit the World Chain explorer to verify your contract:
- Contract: https://worldchain-mainnet.explorer.alchemy.com/address/0x2D4c6D47A5003ab2C6503B445c860245dDcDC88F
- Your transactions: https://worldchain-mainnet.explorer.alchemy.com/address/YOUR_SIGNER_ADDRESS

## Next Steps

1. **Run the test script**: `node test-smart-contract-config.js`
2. **Check your logs**: Look for the debug patterns above
3. **Verify on blockchain**: Check the explorer for your transactions
4. **Create an agent**: Try creating an agent through the frontend

## Support

If you're still having issues:
1. Share the complete logs from agent creation
2. Run `node test-smart-contract-config.js` and share the output
3. Verify your contract addresses match the deployed contracts 