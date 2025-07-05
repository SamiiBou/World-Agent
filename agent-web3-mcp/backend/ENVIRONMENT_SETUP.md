# Environment Setup for World-Agent Backend

## Required Environment Variables

Create a `.env` file in the backend directory with the following variables:

```bash
# Smart Contract Addresses
AGENT_REGISTRY_ADDRESS=0x5B2d913ca8e5D1a185fCFeD380fDc6d2369B4fE8

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/agent-web3

# Server Configuration
PORT=3001

# World Chain Configuration
WORLD_CHAIN_RPC_URL=https://worldchain-mainnet.g.alchemy.com/v2/vCq59BHgMYA2JIRKAbRPmIL8OaTeRAgu
WORLD_CHAIN_PRIVATE_KEY=your_private_key_here

# World ID Configuration
WORLD_ID_APP_ID=app_2129675f92413391ca585881fea09ac0
WORLD_ID_ACTION_NAME=poh
```

## Contract Addresses

- **AgentRegistry**: `0x5B2d913ca8e5D1a185fCFeD380fDc6d2369B4fE8`
- **Network**: World Chain Mainnet
- **Chain ID**: 480

## Setup Instructions

1. Copy the environment variables above into a `.env` file
2. Replace `your_private_key_here` with your actual private key
3. Adjust MongoDB URI if needed
4. Start the backend: `npm start`

## Testing the Configuration

You can test if the configuration is working by running:

```bash
node test-smart-contract-config.js
```

## Current Status from Logs

Based on your logs, the issue is:
- ❌ `AGENT_REGISTRY_ADDRESS: undefined` - **This variable is missing**
- ✅ `WORLD_CHAIN_PRIVATE_KEY: 'SET'` - This is correctly set
- ❌ `WORLD_CHAIN_RPC_URL: undefined` - This might also be missing

Please add these variables to your `.env` file and restart the server. 