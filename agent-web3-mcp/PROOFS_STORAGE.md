# 📋 Stockage des Preuves - World ID & Self Protocol

## 🎯 Objectif

Ce document explique le nouveau système de stockage complet des preuves de vérification pour **World ID** et **Self Protocol** dans la base de données MongoDB.

## 🔄 Flux de Données

### 1. Connexion Utilisateur
- L'utilisateur se connecte avec son **wallet address**
- Un utilisateur est créé ou récupéré dans la base de données

### 2. Vérification World ID
- L'utilisateur effectue la vérification World ID
- **Toutes les preuves** sont stockées dans `worldIdVerification`
- Les données incluent : proof, merkle_root, nullifier_hash, verification_level, etc.

### 3. Vérification Self Protocol
- L'utilisateur effectue la vérification Self Protocol
- **Toutes les preuves** sont stockées dans `selfIdVerification`
- Les données incluent : proof (a, b, c), publicSignals, userContextData, etc.

## 📊 Structure du Modèle User

### World ID Verification
```javascript
worldIdVerification: {
  isVerified: Boolean,
  nullifierHash: String,
  fullProof: {
    proof: String,
    merkleRoot: String,
    nullifierHash: String,
    verificationLevel: String // 'device' ou 'orb'
  },
  verificationData: {
    action: String, // 'poh'
    signal: String,
    appId: String,
    walletAddress: String
  },
  verificationDate: Date,
  verificationResult: Mixed // Résultat complet de la vérification
}
```

### Self Protocol Verification
```javascript
selfIdVerification: {
  isVerified: Boolean,
  userIdentifier: String,
  fullProof: {
    attestationId: Number,
    proof: {
      a: [String],
      b: [[String, String], [String, String]],
      c: [String],
      curve: String,
      protocol: String
    },
    publicSignals: [String],
    userContextData: String
  },
  verificationResult: {
    attestationId: Number,
    isValidDetails: {
      isValid: Boolean,
      isMinimumAgeValid: Boolean,
      isOfacValid: Boolean
    },
    forbiddenCountriesList: [String],
    discloseOutput: {
      nullifier: String,
      name: String,
      nationality: String,
      dateOfBirth: String,
      // ... autres champs
    },
    userData: Mixed
  },
  verificationDate: Date,
  verificationId: String
}
```

## 🛠️ Nouvelles Méthodes

### Méthodes du Modèle User

#### `verifyWorldId(payload, verificationData, verificationResult)`
Stocke une vérification World ID complète.

#### `verifySelfId(attestationId, proof, publicSignals, userContextData, verificationResult, verificationId)`
Stocke une vérification Self Protocol complète.

#### `getFullProofs()`
Retourne toutes les preuves complètes de l'utilisateur.

#### `getPublicInfo()`
Retourne les informations publiques de l'utilisateur (mise à jour).

### Méthodes Statiques

#### `findByUserIdentifier(userIdentifier)`
Trouve un utilisateur par son identifiant Self Protocol.

## 🌐 Nouvelles Routes API

### World ID Routes

#### `POST /api/worldid/verify`
Vérification World ID - **Stockage complet des preuves**

**Requête :**
```json
{
  "payload": {
    "proof": "0x...",
    "merkle_root": "0x...",
    "nullifier_hash": "0x...",
    "verification_level": "orb"
  },
  "action": "poh",
  "signal": "0x...",
  "walletAddress": "0x..."
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "World ID verification successful",
  "user": { ... },
  "verificationResult": {
    "nullifierHash": "0x...",
    "verificationLevel": "orb",
    "verificationDate": "2024-01-01T00:00:00.000Z",
    "fullProofStored": true
  }
}
```

#### `GET /api/worldid/user/:walletAddress/proofs`
Récupère toutes les preuves d'un utilisateur.

### Self Protocol Routes

#### `POST /api/self/verify`
Vérification Self Protocol - **Stockage complet des preuves**

**Requête :**
```json
{
  "attestationId": 1,
  "proof": {
    "a": ["...", "..."],
    "b": [["...", "..."], ["...", "..."]],
    "c": ["...", "..."],
    "curve": "",
    "protocol": "groth16"
  },
  "publicSignals": ["...", "..."],
  "userContextData": "...",
  "walletAddress": "0x..." // NOUVEAU : Liaison avec l'utilisateur
}
```

**Réponse :**
```json
{
  "status": "success",
  "result": true,
  "verified": true,
  "message": "Identity verification successful",
  "verificationResult": { ... },
  "verificationId": "...",
  "userIdentifier": "...",
  "walletAddress": "0x...",
  "fullProofStored": true // NOUVEAU : Indique si la preuve est stockée
}
```

#### `GET /api/self/user/:walletAddress/proofs`
Récupère toutes les preuves d'un utilisateur.

## 🔍 Exemples d'Utilisation

### Récupérer toutes les preuves d'un utilisateur
```bash
curl -X GET "http://localhost:3001/api/worldid/user/0x21bee69e692ceb4c02b66c7a45620684904ba395/proofs"
```

### Réponse
```json
{
  "success": true,
  "message": "User proofs retrieved successfully",
  "data": {
    "id": "...",
    "walletAddress": "0x21bee69e692ceb4c02b66c7a45620684904ba395",
    "worldIdVerification": {
      "isVerified": true,
      "nullifierHash": "0x...",
      "fullProof": { ... },
      "verificationData": { ... },
      "verificationResult": { ... }
    },
    "selfIdVerification": {
      "isVerified": true,
      "userIdentifier": "...",
      "fullProof": { ... },
      "verificationResult": { ... }
    }
  }
}
```

## 📝 Notes Importantes

1. **Liaison automatique** : Les vérifications Self Protocol sont maintenant automatiquement liées à l'utilisateur via son wallet address
2. **Stockage complet** : Toutes les preuves sont stockées intégralement pour audit et traçabilité
3. **Compatibilité** : Les anciennes fonctionnalités restent compatibles
4. **Sécurité** : Les preuves sont stockées de manière sécurisée avec indexation appropriée

## 🚀 Intégration Frontend

Pour intégrer ces nouvelles fonctionnalités dans le frontend, il suffit d'ajouter le `walletAddress` dans les requêtes de vérification Self Protocol :

```javascript
// Exemple d'appel API
const response = await fetch('/api/self/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    attestationId: 1,
    proof: selfProof,
    publicSignals: publicSignals,
    userContextData: userContextData,
    walletAddress: connectedWalletAddress // NOUVEAU
  })
});
```

## 🎉 Résultat

Maintenant, chaque utilisateur qui se connecte avec son wallet et effectue les vérifications World ID et Self Protocol aura **toutes ses preuves complètes** stockées en base de données, liées à son compte utilisateur ! 🎯 

## 📝 Troubleshooting

### Self Protocol "InvalidRoot" Error

**Error Message:**
```
💥 Verification error: _ConfigMismatchError: [InvalidRoot]: Onchain root does not exist, received: 2814370226424041284690914757882545061522712457336534200508505252813825932727
```

**Cause:**
This error occurs when the Merkle root from the Self Protocol proof doesn't exist on the blockchain. This typically happens when:
1. The proof was generated for a different network (testnet vs mainnet)
2. The Merkle root hasn't been synchronized to the blockchain yet
3. Network configuration mismatch

**Solutions:**

1. **Network Configuration Fix (Recommended):**
   - The SelfBackendVerifier has been configured to use testnet mode
   - This should resolve most InvalidRoot errors
   - Configuration is in `backend/routes/selfVerify.js`

2. **Check Self Protocol App Settings:**
   - Ensure your Self Protocol app is configured for the correct network
   - Check if you're using the correct attestation ID (1 for passport, 2 for EU ID)

3. **Retry the Verification:**
   - Sometimes the issue is temporary due to network synchronization
   - Wait a few minutes and try again
   - Clear your browser cache and regenerate the QR code

4. **Check Network Connectivity:**
   - Ensure stable internet connection
   - Check if Self Protocol services are operational
   - Verify your ngrok tunnel is working properly

**Prevention:**
- Always use consistent network settings across your application
- Monitor Self Protocol service status
- Implement retry logic for temporary network issues

### World ID Verification Issues

**Common Issues:**
1. **Verification Level Mismatch:** Ensure you're using the correct verification level (orb, device, etc.)
2. **Signal Mismatch:** The signal used must match exactly between frontend and backend
3. **Action ID Mismatch:** Verify the action ID matches your World ID app configuration

**Debugging Steps:**
1. Check the console logs for detailed error messages
2. Verify your World ID app configuration in the Developer Portal
3. Ensure the nullifier hash is unique and not already used
4. Check that the Merkle root exists on the World ID registry

## 📝 Notes Importantes

1. **Liaison automatique** : Les vérifications Self Protocol sont maintenant automatiquement liées à l'utilisateur via son wallet address
2. **Stockage complet** : Toutes les preuves sont stockées intégralement pour audit et traçabilité
3. **Compatibilité** : Les anciennes fonctionnalités restent compatibles
4. **Sécurité** : Les preuves sont stockées de manière sécurisée avec indexation appropriée

## 🚀 Intégration Frontend

Pour intégrer ces nouvelles fonctionnalités dans le frontend, il suffit d'ajouter le `walletAddress` dans les requêtes de vérification Self Protocol :

```javascript
// Exemple d'appel API
const response = await fetch('/api/self/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    attestationId: 1,
    proof: selfProof,
    publicSignals: publicSignals,
    userContextData: userContextData,
    walletAddress: connectedWalletAddress // NOUVEAU
  })
});
```

## 🎉 Résultat

Maintenant, chaque utilisateur qui se connecte avec son wallet et effectue les vérifications World ID et Self Protocol aura **toutes ses preuves complètes** stockées en base de données, liées à son compte utilisateur ! 🎯 

## 📝 Database Management

### Clearing Verification Data
Use the provided database scripts to clear test data:

```bash
# Clear all verification data
node backend/clear-database.js

# Reset database with fresh indexes
node backend/clear-database.js reset
```

### Inspecting Stored Proofs
Use the inspection script to view stored proofs:

```bash
node backend/inspect-database.js
```

## 📝 Security Considerations

1. **Proof Uniqueness:** Each proof should only be used once
2. **Temporal Validation:** Proofs have expiration times
3. **Network Validation:** Ensure proofs match the expected network
4. **Data Integrity:** Verify proof signatures and merkle roots

## 📝 Performance Optimization

1. **Proof Storage:** Store complete proofs for audit trails
2. **Indexing:** Use appropriate database indexes for quick lookups
3. **Caching:** Cache verification results to reduce API calls
4. **Cleanup:** Regularly clean up expired proofs

## 📝 Monitoring and Maintenance

1. **Log Monitoring:** Monitor verification success/failure rates
2. **Error Tracking:** Track common verification errors
3. **Performance Metrics:** Monitor API response times
4. **Database Health:** Monitor database size and performance
5. **Network Status:** Monitor Self Protocol and World ID service availability 