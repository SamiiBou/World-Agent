# 🔍 Comment vérifier les agents dans le Smart Contract

## 🚀 **Méthodes de vérification**

### **1. Scripts de ligne de commande**

#### Vérifier tous les agents
```bash
cd agent-web3-mcp/backend
node check-agent-registry.js
```

#### Vérifier un agent spécifique
```bash
cd agent-web3-mcp/backend
node check-agent-registry.js 0x1234567890123456789012345678901234567890
```

### **2. API REST**

#### Vérifier un agent par ID
```bash
curl http://localhost:3001/api/agents/AGENT_ID/verify
```

#### Statistiques du registry
```bash
curl http://localhost:3001/api/registry/stats
```

#### Agents d'un propriétaire
```bash
curl http://localhost:3001/api/registry/agents/0x21bee69e692ceb4c02b66c7a45620684904ba395
```

### **3. Explorateur Blockchain**

#### Contrat AgentRegistry
- **Adresse**: `0x2D4c6D47A5003ab2C6503B445c860245dDcDC88F`
- **Explorer**: https://worldchain-mainnet.explorer.alchemy.com/address/0x2D4c6D47A5003ab2C6503B445c860245dDcDC88F

#### Vérifier un agent spécifique
1. Allez sur l'explorateur du contrat
2. Connectez-vous en lecture seule
3. Appelez la fonction `getAgent(agentAddress)`
4. Vérifiez les données retournées

#### Vérifier tous les agents d'un propriétaire
1. Appelez `getAgentsByOwner(ownerAddress)`
2. Obtenez la liste des adresses d'agents
3. Appelez `getAgent()` pour chaque adresse

### **4. Interface Web (Frontend)**

Dans l'interface de gestion des agents, vous verrez maintenant :
- ✅ **Statut d'enregistrement** : "Registered on blockchain"
- 🔗 **Lien transaction** : "View Transaction" 
- 📍 **Adresse du contrat** et liens vers l'explorateur

## 📊 **Informations disponibles**

Pour chaque agent enregistré, vous pouvez vérifier :

```json
{
  "agentAddress": "0x...",           // Adresse Worldchain de l'agent
  "ownerWallet": "0x...",            // Wallet du propriétaire  
  "worldIdNullifier": "0x...",       // Nullifier World ID
  "selfIdNullifier": "0x...",        // Nullifier Self ID
  "registrationTime": "2024-01-15...", // Date d'enregistrement
  "isActive": true,                  // Statut actif/inactif
  "username": "myagent123"           // Nom d'utilisateur unique
}
```

## 🧪 **Tests rapides**

### Tester la configuration
```bash
cd agent-web3-mcp/backend
node test-smart-contract-config.js
```

### Vérifier la connectivité
```bash
curl http://localhost:3001/api/registry/stats
```

### Comparer database vs blockchain
```bash
node check-agent-registry.js
```

## 🔗 **Liens utiles**

- **Contrat AgentRegistry**: https://worldchain-mainnet.explorer.alchemy.com/address/0x2D4c6D47A5003ab2C6503B445c860245dDcDC88F
- **Votre wallet**: https://worldchain-mainnet.explorer.alchemy.com/address/[YOUR_WALLET_ADDRESS]
- **Documentation World Chain**: https://worldchain.org

## ⚠️ **Résolution de problèmes**

### Agent non trouvé dans le contrat
```bash
# Vérifiez si l'agent existe en base
curl http://localhost:3001/api/agents/AGENT_ID

# Vérifiez les logs du serveur lors de la création
tail -f logs/server.log

# Testez la connexion au contrat
node test-smart-contract-config.js
```

### Données incohérentes
```bash
# Comparez database vs blockchain
node check-agent-registry.js

# Vérifiez les transactions
curl http://localhost:3001/api/agents/AGENT_ID/verify
```

## 📱 **Intégration dans votre app**

### JavaScript/TypeScript
```typescript
// Vérifier un agent
const response = await fetch(`/api/agents/${agentId}/verify`);
const data = await response.json();

if (data.registry.isRegistered) {
  console.log('Agent registered:', data.registry.contractData);
} else {
  console.log('Agent not registered:', data.registry.error);
}

// Statistiques
const stats = await fetch('/api/registry/stats');
const registryStats = await stats.json();
console.log('Total agents in contract:', registryStats.smartContract.totalAgents);
```

### React Component
```jsx
const AgentVerification = ({ agentId }) => {
  const [verification, setVerification] = useState(null);
  
  useEffect(() => {
    fetch(`/api/agents/${agentId}/verify`)
      .then(res => res.json())
      .then(setVerification);
  }, [agentId]);
  
  if (!verification) return <div>Loading...</div>;
  
  return (
    <div>
      {verification.registry.isRegistered ? (
        <div>
          ✅ Agent registered on blockchain
          <a href={verification.registry.explorerUrl}>View on Explorer</a>
        </div>
      ) : (
        <div>❌ Agent not registered: {verification.registry.error}</div>
      )}
    </div>
  );
};
``` 