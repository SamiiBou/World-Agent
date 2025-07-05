# 📜 World-Agent Smart Contracts

Smart contract suite for the World-Agent ecosystem providing decentralized infrastructure for AI agents.

## 🏗️ Architecture

### AgentRegistry
Registry contract for registering and managing AI agents with World ID and Self ID verification.

**Key Features:**
- Agent registration with unique nullifiers
- Username management
- Agent activation/deactivation
- Owner tracking

### AgentDAO
DAO contract for decentralized governance of the agent ecosystem.

**Key Features:**
- Proposal creation by agent owners
- Weighted voting system based on number of agents
- Community treasury management
- Automatic execution of approved proposals

## 🚀 Deployment

### Prerequisites
```bash
npm install
```

### Environment Variables
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

Add your private key:
```env
PRIVATE_KEY=your_private_key_here
```

### Compilation
```bash
npm run compile
```

### Tests
```bash
npm run test
```

### Deploy to World Chain
```bash
npm run deploy
```

### Contract Verification
```bash
npm run verify
```

## 📋 Deployment Information

- **Network**: World Chain Mainnet
- **RPC URL**: https://worldchain-mainnet.g.alchemy.com/v2/vCq59BHgMYA2JIRKAbRPmIL8OaTeRAgu
- **Chain ID**: 480

## 📖 Contract Documentation

### AgentRegistry

#### Data Structures
```solidity
struct Agent {
    address agentAddress;           // Agent's Worldchain address
    address ownerWallet;           // Owner's wallet address
    bytes32 worldIdNullifier;     // World ID nullifier hash (unique)
    bytes32 selfIdNullifier;      // Self ID nullifier hash (unique)
    uint256 registrationTime;     // Registration timestamp
    bool isActive;                // Active/inactive status
    string username;              // Username
}
```

#### Main Functions
- `registerAgent()`: Register a new agent
- `deactivateAgent()`: Deactivate an agent
- `reactivateAgent()`: Reactivate an agent
- `updateUsername()`: Update username
- `getAgent()`: Get agent information
- `getAgentsByOwner()`: Get all agents of an owner

### AgentDAO

#### Proposal Types
- `GENERAL`: General proposals
- `AGENT_REMOVAL`: Agent removal
- `PARAMETER_CHANGE`: Parameter changes
- `TREASURY_SPEND`: Treasury spending

#### Main Functions
- `createProposal()`: Create a new proposal
- `vote()`: Vote on a proposal
- `executeProposal()`: Execute an approved proposal
- `getProposal()`: Get proposal details
- `getVotingWeight()`: Calculate user's voting weight

## 🔧 Configuration

### DAO Parameters
- **Voting Duration**: 7 days by default
- **Minimum Quorum**: 20% participation
- **Approval Threshold**: 50% of votes

### Voting Weight
- Each registered agent gives 1 voting point to its owner
- Only agent owners can vote and create proposals

## 🧪 Testing

Tests cover:
- Agent registration and management
- Proposal creation and voting
- Treasury management
- Security and authorization checks

Run tests:
```bash
npx hardhat test
```

## 📊 Monitoring

After deployment, contract information is saved to `deployments.json`:
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

## 🔐 Security

- OpenZeppelin contracts for secure functionality
- Reentrancy protection
- Nullifier verification to prevent duplicates
- Permission system based on agent ownership

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the project
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

**Part of the World-Agent ecosystem** 🌍
