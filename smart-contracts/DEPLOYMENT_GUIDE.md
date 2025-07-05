# 🚀 Smart Contracts Deployment Guide

This guide will walk you through deploying the World-Agent smart contracts on World Chain.

## 📋 What's Been Created

### Smart Contracts
1. **AgentRegistry.sol** - Registry for AI agents with World ID and Self ID verification
2. **AgentDAO.sol** - DAO for governance and voting on agent-related proposals

### Features Implemented
- ✅ Agent registration with unique nullifiers (World ID & Self ID)
- ✅ Username management system
- ✅ Agent activation/deactivation
- ✅ DAO voting system based on agent ownership
- ✅ Treasury management
- ✅ Comprehensive test suite (32 tests passing)

## 🔧 Setup Instructions

### 1. Environment Setup

Create your `.env` file:
```bash
cp .env.example .env
```

Add your private key to `.env`:
```
PRIVATE_KEY=your_private_key_without_0x_prefix
ETHERSCAN_API_KEY=your_etherscan_api_key_for_verification
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Compile Contracts
```bash
npm run compile
```

### 4. Run Tests
```bash
npm run test
```

## 🌍 Deployment to World Chain

### Network Configuration
- **Network**: World Chain Mainnet
- **RPC URL**: https://worldchain-mainnet.g.alchemy.com/v2/vCq59BHgMYA2JIRKAbRPmIL8OaTeRAgu
- **Chain ID**: 480

### Deploy the Contracts
```bash
npm run deploy
```

This will:
1. Deploy `AgentRegistry` first
2. Deploy `AgentDAO` with reference to `AgentRegistry`
3. Save deployment addresses to `deployments.json`
4. Run basic functionality tests

### Verify Contracts (Optional)
```bash
npm run verify
```

### Interact with Deployed Contracts
```bash
npm run interact
```

## 📊 Contract Addresses

After deployment, you'll find the contract addresses in `deployments.json`:

```json
{
  "network": "worldchain",
  "chainId": 480,
  "deployer": "0x...",
  "contracts": {
    "AgentRegistry": "0x...",
    "AgentDAO": "0x..."
  },
  "deploymentTime": "2024-01-01T00:00:00.000Z"
}
```

## 🔑 Key Functions

### AgentRegistry
```solidity
// Register a new agent
function registerAgent(
    address agentAddress,
    bytes32 worldIdNullifier,
    bytes32 selfIdNullifier,
    string calldata username
) external;

// Get agent information
function getAgent(address agentAddress) external view returns (Agent memory);

// Check username availability
function isUsernameAvailable(string calldata username) external view returns (bool);
```

### AgentDAO
```solidity
// Create a proposal
function createProposal(
    string calldata title,
    string calldata description,
    ProposalType proposalType,
    address targetAgent,
    uint256 amount,
    address recipient
) external;

// Vote on a proposal
function vote(uint256 proposalId, VoteChoice choice) external;

// Execute approved proposal
function executeProposal(uint256 proposalId) external;
```

## 🎯 Integration with Your Frontend

To integrate these contracts with your React frontend:

1. **Install ethers.js** (if not already installed):
```bash
npm install ethers
```

2. **Create contract instances**:
```javascript
import { ethers } from 'ethers';
import deployments from './deployments.json';

const provider = new ethers.JsonRpcProvider(
  'https://worldchain-mainnet.g.alchemy.com/v2/vCq59BHgMYA2JIRKAbRPmIL8OaTeRAgu'
);

const agentRegistry = new ethers.Contract(
  deployments.contracts.AgentRegistry,
  AgentRegistryABI, // You'll need to import the ABI
  provider
);

const agentDAO = new ethers.Contract(
  deployments.contracts.AgentDAO,
  AgentDAOABI, // You'll need to import the ABI
  provider
);
```

3. **Register an agent**:
```javascript
async function registerAgent(agentAddress, worldIdNullifier, selfIdNullifier, username) {
  const signer = await provider.getSigner();
  const registryWithSigner = agentRegistry.connect(signer);
  
  const tx = await registryWithSigner.registerAgent(
    agentAddress,
    worldIdNullifier,
    selfIdNullifier,
    username
  );
  
  await tx.wait();
  console.log('Agent registered successfully!');
}
```

## ⚠️ Important Notes

1. **Gas Optimization**: The contracts use the `viaIR` compilation option for better gas optimization
2. **Security**: All contracts use OpenZeppelin libraries for security
3. **Nullifier Uniqueness**: Each World ID and Self ID nullifier can only be used once
4. **Voting Weight**: Each registered agent gives 1 voting point to its owner
5. **DAO Parameters**: 
   - Voting duration: 7 days
   - Quorum: 20%
   - Approval threshold: 50%

## 🔍 Monitoring & Verification

After deployment:
- Monitor contract interactions on World Chain explorer
- Verify contracts for transparency
- Use the `interact` script to test functionality
- Check treasury balance and DAO proposals

## 🛠️ Troubleshooting

### Common Issues:
1. **"insufficient funds"** - Ensure your wallet has enough ETH
2. **"nonce too high"** - Reset your MetaMask account or wait
3. **"network mismatch"** - Ensure you're connected to World Chain

### Getting Help:
- Check Hardhat documentation
- Review World Chain documentation
- Examine the test files for usage examples

---

**Your World-Agent smart contracts are now ready for World Chain! 🌍** 