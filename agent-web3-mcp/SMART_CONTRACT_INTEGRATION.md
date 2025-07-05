# Smart Contract Integration for Agent Registration

## Overview

This document describes the integration of smart contract-based agent registration using the AgentRegistry contract deployed on World Chain.

## Features

### Agent Registration
When creating an agent, the system now:
1. Validates that the user has both World ID and Self ID verifications
2. Creates the agent in the local database
3. Registers the agent in the AgentRegistry smart contract
4. Stores registry information for future reference

### Required Information
Each agent registration includes:
- `agentAddress`: The generated World Chain wallet address for the agent
- `ownerWallet`: The wallet address of the user creating the agent
- `worldIdNullifier`: The nullifier hash from World ID verification
- `selfIdNullifier`: The nullifier hash from Self ID verification
- `username`: A unique username for the agent
- `registrationTime`: Timestamp of registration (set by the smart contract)
- `isActive`: Status flag (true by default)

## Configuration

### Environment Variables
Add these variables to your `.env` file:

```env
# Smart Contract Addresses
AGENT_REGISTRY_ADDRESS=0x2D4c6D47A5003ab2C6503B445c860245dDcDC88F
AGENT_DAO_ADDRESS=0xc84eE72859AA1Cb9872D4875cd7FA329cCDd073c

# World Chain Configuration
WORLD_CHAIN_RPC_URL=https://worldchain-mainnet.g.alchemy.com/public
WORLD_CHAIN_PRIVATE_KEY=your_private_key_here
```

### Prerequisites
Before creating an agent, users must:
1. Complete World ID verification
2. Complete Self ID verification
3. Have a connected wallet

## Technical Implementation

### Backend Changes
- **New Service**: `agentRegistryService.js` - Handles smart contract interactions
- **Enhanced Model**: `Agent.js` - Added `username` and `registry` fields
- **Updated Route**: `/api/agents` POST - Now includes smart contract registration

### Frontend Changes
- **Enhanced Form**: Agent creation form now includes username field
- **Registry Display**: Shows smart contract registration status
- **Transaction Links**: Direct links to blockchain explorer for registration transactions

### Smart Contract Integration
The system uses the AgentRegistry contract with the following key functions:
- `registerAgent(address, bytes32, bytes32, string)` - Registers a new agent
- `getAgent(address)` - Retrieves agent information
- `getAgentsByOwner(address)` - Gets all agents owned by an address

## Error Handling

### Registration Failures
If smart contract registration fails:
1. The agent is removed from the local database
2. An error message is returned to the user
3. The transaction is rolled back

### Common Issues
- **Insufficient Gas**: Ensure the deploying wallet has enough ETH
- **Duplicate Username**: Usernames must be unique across all agents
- **Missing Verifications**: Both World ID and Self ID must be completed
- **Network Issues**: Check World Chain RPC connectivity

## Data Flow

1. **User Input**: User fills out agent creation form with name, username, description, avatar
2. **Validation**: System validates user has required verifications
3. **Wallet Generation**: New World Chain wallet is created for the agent
4. **Database Creation**: Agent is created in MongoDB
5. **Smart Contract Registration**: Agent is registered in AgentRegistry contract
6. **Registry Update**: Local agent record is updated with registration details
7. **Response**: User receives confirmation with blockchain transaction hash

## Monitoring

### Registry Status
Each agent includes registry information:
- `isRegistered`: Boolean flag indicating successful registration
- `registrationTxHash`: Transaction hash of the registration
- `registrationBlockNumber`: Block number where registration was mined
- `registrationTimestamp`: When the registration occurred

### Blockchain Verification
Users can verify registration by:
1. Viewing the transaction on World Chain explorer
2. Calling the `getAgent()` function on the smart contract
3. Checking the agent's registry status in the UI

## Future Enhancements

### Planned Features
- Agent deactivation/reactivation through smart contract
- Username updates via smart contract
- Agent transfer between owners
- Integration with AgentDAO for governance

### Security Considerations
- Private keys are stored encrypted in the database
- Only verified users can create agents
- Nullifiers ensure unique identity linkage
- Smart contract enforces uniqueness constraints

## Troubleshooting

### Common Commands
```bash
# Check agent registration status
curl -X GET "http://localhost:3001/api/agents/{agentId}"

# View smart contract on explorer
https://worldchain-mainnet.explorer.alchemy.com/address/0x2D4c6D47A5003ab2C6503B445c860245dDcDC88F

# Check transaction status
https://worldchain-mainnet.explorer.alchemy.com/tx/{txHash}
```

### Debug Logs
The system logs registration steps:
- `📝 Registering agent in smart contract...`
- `📤 Transaction sent: {txHash}`
- `✅ Agent successfully registered in smart contract`
- `❌ Error registering agent in smart contract` 