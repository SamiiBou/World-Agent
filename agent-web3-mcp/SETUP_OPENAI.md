# 🤖 Configuration OpenAI pour l'Agent

## Problème
Votre agent utilise actuellement des réponses simulées au lieu d'utiliser OpenAI GPT-4o. C'est pourquoi vous obtenez des réponses répétitives comme "I understand you're asking about...".

## Solution

### 1. Obtenir une clé API OpenAI
1. Allez sur [OpenAI Platform](https://platform.openai.com/)
2. Créez un compte ou connectez-vous
3. Allez dans "API Keys" 
4. Cliquez sur "Create new secret key"
5. Copiez la clé (elle commence par `sk-`)

### 2. Configurer la clé API

**Option A : Fichier .env (Recommandé)**
```bash
# Créez un fichier .env à la racine du projet
touch .env

# Ajoutez votre clé API OpenAI
echo "REACT_APP_OPENAI_API_KEY=sk-your-actual-api-key-here" >> .env
```

**Option B : Variables d'environnement**
```bash
# Pour la session actuelle
export REACT_APP_OPENAI_API_KEY=sk-your-actual-api-key-here

# Pour MacOS/Linux (permanent)
echo 'export REACT_APP_OPENAI_API_KEY=sk-your-actual-api-key-here' >> ~/.bashrc
source ~/.bashrc
```

### 3. Exemple de fichier .env complet
```env
# OpenAI Configuration
REACT_APP_OPENAI_API_KEY=sk-your-actual-api-key-here

# Agent Configuration
REACT_APP_AGENT_NAME=AgentWeb3
REACT_APP_AGENT_DESCRIPTION=AI Agent with World Chain and MCP support

# MCP Configuration
REACT_APP_MCP_SERVER_URL=https://7048b6546b0f.ngrok.app/mcp

# World Chain Configuration (already configured)
REACT_APP_WORLDCHAIN_ALCHEMY_API_KEY=vCq59BHgMYA2JIRKAbRPmIL8OaTeRAgu
REACT_APP_WORLDCHAIN_RPC_URL=https://worldchain-mainnet.g.alchemy.com/v2/vCq59BHgMYA2JIRKAbRPmIL8OaTeRAgu
```

### 4. Redémarrer l'application
```bash
# Arrêtez l'application (Ctrl+C)
# Puis redémarrez
npm start
```

### 5. Tester l'agent
Une fois configuré, votre agent devrait :
- ✅ Utiliser GPT-4o pour des réponses naturelles
- ✅ Comprendre le contexte et les nuances
- ✅ Répondre de manière conversationnelle
- ✅ Éviter les réponses répétitives

## Dépannage

### L'agent utilise toujours des réponses simulées
1. Vérifiez que votre clé API est valide
2. Assurez-vous que la variable d'environnement est bien définie
3. Redémarrez complètement l'application
4. Vérifiez la console pour les erreurs

### Erreurs d'API OpenAI
- Assurez-vous d'avoir des crédits sur votre compte OpenAI
- Vérifiez que votre clé API n'est pas expirée
- Consultez les logs dans la console du navigateur

## Coûts
- GPT-4o coûte environ $0.005 par 1000 tokens
- Pour un usage normal, cela représente quelques centimes par conversation
- Surveillez votre usage sur le dashboard OpenAI

## Sécurité
- ⚠️ Ne partagez jamais votre clé API
- ⚠️ Ajoutez `.env` à votre `.gitignore`
- ⚠️ Utilisez des variables d'environnement en production

## Améliorations apportées
J'ai déjà amélioré le code pour :
- ✅ Utiliser GPT-4o au lieu de gpt-4o-mini
- ✅ Améliorer les réponses simulées en attendant
- ✅ Gérer mieux les questions conversationnelles
- ✅ Réduire les réponses répétitives 