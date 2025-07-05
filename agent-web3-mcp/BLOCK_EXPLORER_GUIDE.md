# 🔍 Guide Block Explorer - Comment vérifier vos agents

## 📋 Informations du contrat
- **Adresse du contrat** : `0x2D4c6D47A5003ab2C6503B445c860245dDcDC88F`
- **Réseau** : World Chain (Mainnet)
- **Nom du contrat** : AgentRegistry

## 🌐 Block Explorers disponibles

### 1. **World Chain Explorer** (Recommandé)
🔗 **Lien direct vers le contrat** : 
```
https://worldchain-mainnet.explorer.alchemy.com/address/0x2D4c6D47A5003ab2C6503B445c860245dDcDC88F
```

### 2. **Blockscout** (Alternative)
🔗 **Lien du contrat** :
```
https://worldchain.blockscout.com/address/0x2D4c6D47A5003ab2C6503B445c860245dDcDC88F
```

## 🔎 Comment vérifier vos agents

### Méthode 1 : Via les transactions
1. **Ouvrez le lien du contrat** dans votre navigateur
2. **Allez dans l'onglet "Transactions"**
3. **Cherchez les transactions "registerAgent"**
4. **Cliquez sur une transaction** pour voir les détails

### Méthode 2 : Via "Read Contract"
1. **Ouvrez le lien du contrat**
2. **Allez dans l'onglet "Read Contract"**
3. **Utilisez ces fonctions** :

#### 🔹 `getAgent(address agentAddress)`
- **Entrez l'adresse de votre agent** (ex: 0x123...)
- **Cliquez "Query"**
- **Vous verrez** : ownerWallet, worldIdNullifier, selfIdNullifier, registrationTime, isActive, username

#### 🔹 `getAgentsByOwner(address ownerWallet)`
- **Entrez votre adresse wallet** (ex: 0xabc...)
- **Cliquez "Query"**
- **Vous verrez** : liste de tous vos agents

#### 🔹 `isAgentRegistered(address agentAddress)`
- **Entrez l'adresse de votre agent**
- **Cliquez "Query"**
- **Retourne** : true/false

## 🔓 **DÉCODER LES DONNÉES HEXADÉCIMALES**

### Quand vous voyez des données comme ça :
```
[topic0] 0xf1ae3709cabbf444b998e7e79831813257aeca347ca30463c09483ee98f83b0d
[topic1] 0x0000000000000000000000009882d180769329b1bf7df1c036302cd9149225b3
[topic2] 0x000000000000000000000000e336f4ee3e5d374db4fe63af16a9ec5fe06918d5
4167656e74320000000000000000000000000000000000000000000000000000
```

### 🔍 **Voici ce que cela signifie** :

#### **Topics (sujets indexés)** :
- **topic0** : `0xf1ae3709...` = Signature de l'event "AgentRegistered"
- **topic1** : `0x...9882d180769329b1bf7df1c036302cd9149225b3` = **Adresse de l'agent**
- **topic2** : `0x...e336f4ee3e5d374db4fe63af16a9ec5fe06918d5` = **Adresse du propriétaire**

#### **Données (data)** :
```
0000000000000000000000000000000000000000000000000000000000000060  <- Position du username
1020db39fee35e87eae05f259d0f3736fff9237a003b7e5e5b4833ba0d22a26c  <- worldIdNullifier
2673ea38e4ae2f127e67e0c9cf0ba715b8b3c6c1f9630a418873936c9638ae21  <- selfIdNullifier
0000000000000000000000000000000000000000000000000000000000000006  <- Longueur du username
4167656e74320000000000000000000000000000000000000000000000000000  <- Username en hex
```

### 🧮 **Décodage pratique** :

#### **1. Adresses** (enlevez les zéros au début) :
- **Agent** : `0x9882d180769329b1bf7df1c036302cd9149225b3`
- **Propriétaire** : `0xe336f4ee3e5d374db4fe63af16a9ec5fe06918d5`

#### **2. Username** (convertir hex vers texte) :
- **Hex** : `4167656e74320000...`
- **Texte** : `Agent2` (les zéros à la fin sont du padding)

#### **3. Nullifiers** (gardez tel quel) :
- **World ID** : `0x1020db39fee35e87eae05f259d0f3736fff9237a003b7e5e5b4833ba0d22a26c`
- **Self ID** : `0x2673ea38e4ae2f127e67e0c9cf0ba715b8b3c6c1f9630a418873936c9638ae21`

### 🛠️ **Outils de décodage** :

#### **Option 1 : Convertisseur en ligne**
- **Hex vers texte** : https://www.rapidtables.com/convert/number/hex-to-ascii.html
- **Copiez** : `4167656e7432`
- **Résultat** : `Agent2`

#### **Option 2 : JavaScript (console navigateur)**
```javascript
// Pour décoder le username
const hex = "4167656e74320000000000000000000000000000000000000000000000000000";
const clean = hex.replace(/00+$/, ''); // Enlever les zéros à la fin
const text = Buffer.from(clean, 'hex').toString('utf8');
console.log(text); // "Agent2"
```

## 📱 Exemple pratique

### Étape 1 : Récupérer votre adresse d'agent
Dans votre application, après avoir créé un agent, notez :
- **Agent Address** : 0x123abc...
- **Transaction Hash** : 0x456def...

### Étape 2 : Vérifier sur le block explorer
1. **Allez sur** : https://worldchain-mainnet.explorer.alchemy.com/address/0x2D4c6D47A5003ab2C6503B445c860245dDcDC88F
2. **Cliquez sur "Read Contract"**
3. **Trouvez la fonction "getAgent"**
4. **Entrez votre agent address**
5. **Cliquez "Query"**

### Étape 3 : Interpréter les résultats
Vous verrez quelque chose comme :
```
ownerWallet: 0xabc123...
worldIdNullifier: 0x789def...
selfIdNullifier: 0x456ghi...
registrationTime: 1734567890
isActive: true
username: "mon_agent_username"
```

## 🎯 Recherche par transaction

### Si vous avez le hash de transaction
1. **Allez sur** : https://worldchain-mainnet.explorer.alchemy.com/
2. **Collez votre transaction hash** dans la barre de recherche
3. **Appuyez Enter**
4. **Vous verrez** : tous les détails de l'enregistrement

### Information dans les logs
Dans les "Event Logs", cherchez :
- **Event** : `AgentRegistered`
- **Topics** : contient l'adresse de l'agent et du propriétaire

## 🔧 Liens utiles

### Pour votre wallet
- **Voir toutes vos transactions** : https://worldchain-mainnet.explorer.alchemy.com/address/[VOTRE_ADRESSE_WALLET]
- **Remplacez [VOTRE_ADRESSE_WALLET]** par votre vraie adresse

### Pour un agent spécifique
- **Voir l'agent** : https://worldchain-mainnet.explorer.alchemy.com/address/[ADRESSE_AGENT]
- **Remplacez [ADRESSE_AGENT]** par l'adresse de votre agent

## 📊 Que chercher

### ✅ Agent correctement enregistré
- **Statut** : Transaction "Success" ✅
- **Event** : "AgentRegistered" présent
- **Fonction** : "registerAgent" appelée
- **Données** : ownerWallet, nullifiers, username visibles

### ❌ Problème d'enregistrement
- **Statut** : Transaction "Failed" ❌
- **Erreur** : message d'erreur dans les logs
- **Pas d'event** : "AgentRegistered" absent

## 🎨 Interface utilisateur

Dans votre app, vous pouvez ajouter des liens directs :
- **Lien vers l'agent** : `https://worldchain-mainnet.explorer.alchemy.com/address/${agentAddress}`
- **Lien vers la transaction** : `https://worldchain-mainnet.explorer.alchemy.com/tx/${transactionHash}`

## 🔐 Privacy Note
- **Toutes les données** sont publiques sur la blockchain
- **Vos nullifiers** sont visibles mais ne révèlent pas votre identité
- **Votre username** est public 