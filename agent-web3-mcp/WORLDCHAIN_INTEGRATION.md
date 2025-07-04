# 🌍 World Chain Integration

Your agent now has an address on World Chain and can interact with this network.

## 🚀 How it Works

### 🏦 Agent Address on World Chain
- **Automatic generation**: The agent automatically generates a World Chain address on first launch
- **Secure storage**: The address is stored locally for reuse
- **Display**: The address is visible in the chat interface

### 💰 Available Features

#### Balance Checking
```javascript
// Check balance of a specific address
const balance = await worldchainService.getBalance('0x742d35Cc6634C0532925a3b8C17345C4C74Ca94e');
```

#### Transfer Simulation
```javascript
// Simulate a transfer
const transfer = await worldchainService.simulateTransfer(
  'fromAddress',
  'toAddress', 
  '0.1' // amount in ETH
);
```

## 🔧 Technical Configuration

### Network Details
- **Network name**: World Chain
- **Chain ID**: 480
- **RPC URL**: https://worldchain-mainnet.g.alchemy.com/v2/vCq59BHgMYA2JIRKAbRPmIL8OaTeRAgu
- **Currency**: ETH
- **Block explorer**: https://worldchain-mainnet.explorer.alchemy.com

### Agent Integration
The agent now displays its World Chain address in the welcome message:

```
🌍 **My World Chain Address**: 0x742d35Cc6634C0532925a3b8C17345C4C74Ca94e
💰 **Current Balance**: 0 ETH
```

## 🤖 Available Commands

You can now ask your agent:
- `"What's my address?"` - Displays the agent's address
- `"What's my balance?"` - Checks the current balance
- `"Transfer 0.1 ETH to 0x..."` - Simulates a transfer
- `"Check balance of 0x..."` - Checks balance of any address

## 🔍 Tools Available

### `worldchain_balance`
- **Description**: Check World Chain balance
- **Parameters**: 
  - `address`: Address to check or "agent" for agent's balance

### `worldchain_transfer`
- **Description**: Transfer ETH on World Chain
- **Parameters**:
  - `to`: Destination address
  - `amount`: Amount to transfer

## 🛡️ Security

### Address validation
- Verification of Ethereum address format
- Validation of amounts and parameters

### Private key management
- Secure storage of credentials
- No exposure of private keys in logs

### Transaction simulation
- Wallet generation/loading
- Balance checking
- Transfer simulation

## 🌐 Integration with Block Explorer

- Transaction and address visualization
- Direct links to World Chain explorer
- Real-time balance verification

## 📊 Usage Example

```bash
# Check your agent's balance
curl -X POST http://localhost:3001/api/mcp/call \
  -H "Content-Type: application/json" \
  -d '{
    "method": "worldchain_balance",
    "params": {
      "address": "agent"
    }
  }'

# Transfer simulation
curl -X POST http://localhost:3001/api/mcp/call \
  -H "Content-Type: application/json" \
  -d '{
    "method": "worldchain_transfer", 
    "params": {
      "to": "0x742d35Cc6634C0532925a3b8C17345C4C74Ca94e",
      "amount": "0.1"
    }
  }'
```

## 🎯 Next Steps

1. **Send ETH** to your agent's address to test real balances
2. **Explore the block explorer** to see your address
3. **Test transfers** with small amounts
4. **Integrate with your applications** via the API

---

🌍 **Your agent is now ready to interact with World Chain!** 