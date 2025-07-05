# Agent VC (Verifiable Credential) Example

## 🎯 Final VC Structure

```js
const agentVC = {
  // 🧠 Agent Identity
  agentId: "0x742d35Cc6634C0532925a3b8D7389DF1",  // Agent's World Chain address

  // 🔐 Creator Proof (human identity attestation)
  humanProof: {
    selfId: {
      attestationId: 1,  // 1 = passport, 2 = EU ID card
      nullifier: "7230915005950237481573224572462468299409182712457454950691285941177864468931",
      verifiedAt: 1723456789 // timestamp
    },
    worldId: {
      nullifierHash: "0xabc123def456...", 
      verificationLevel: "orb",  // or "device"
      verifiedAt: 1723456799 // timestamp
    }
  },

  // 🗣️ Declaration by Human
  declaration: {
    description: "This agent acts on my behalf to vote on Snapshot proposals and manage my DeFi positions.",
    createdAt: 1723456799
  },

  // VC Metadata
  vcId: "vc_1723456799_a1b2c3d4",
  issuer: "agent-id-protocol", 
  schema: "https://your-protocol.xyz/schemas/agent-link-vc.json",
  issuedAt: 1723456799,
  version: "1.0.0",
  
  // 🔏 DApp Signature (proves legitimate issuance)
  signature: "0x1234567890abcdef...",
  signedAt: 1723456800,
  signerAddress: "0xDAPP_WALLET_ADDRESS"  // DApp's wallet that signed
}
```

## 🔄 How It Works

### 1. **Identity Verification** (Prerequisites)
- Human completes **Self ID** verification (passport/ID scan)
- Human completes **World ID** verification (orb or device)
- Both verifications are stored in `User` collection

### 2. **Agent Linking** 
```js
// POST /api/agents/0x742d35Cc6634C0532925a3b8D7389DF1/link
{
  walletAddress: "0x123...abc",
  declaration: "This agent acts on my behalf to vote on Snapshot proposals."
}
```

### 3. **VC Generation & DApp Signing**
- Backend assembles VC with human proofs from database
- Generates canonical hash for on-chain anchoring
- **DApp automatically signs the VC** with its private key
- Stores signed VC in MongoDB
- Returns signed VC + hash to frontend

## 🔍 Verification Process

Anyone can verify a VC by:

1. **Fetching the VC**: `GET /api/agents/{agentId}/vc`
2. **Checking DApp signature**: `POST /api/vcs/{vcId}/verify`
3. **Validating identity proofs**: Confirm Self ID and World ID nullifiers
4. **On-chain verification**: Compare hash on-chain (future feature)

## 🎨 Key Benefits

- **No redundant data**: Human proof already identifies the human
- **Implicit authorization**: Identity verification IS the authorization
- **DApp authenticity**: DApp signature proves legitimate issuance
- **Privacy-preserving**: Uses nullifiers instead of personal data
- **Verifiable**: Anyone can verify the agent-human link
- **Immutable**: Once signed, the link is cryptographically secured

## 🚀 Usage

```typescript
import { vcService } from './services/vcService';

// Link agent (DApp signs automatically)
const result = await vcService.linkAgent(agentId, {
  walletAddress: walletAddress,
  declaration: "This agent manages my DeFi positions"
});

// Verify a VC
const verification = await vcService.verifyVC(vcId);
console.log('Is valid:', verification.isValid);
```

This creates a clean, verifiable link between a human identity and an AI agent! 🤖✨ 