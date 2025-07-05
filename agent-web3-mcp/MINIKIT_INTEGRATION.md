# MiniKit Integration

Ce document explique comment MiniKit-JS SDK a été intégré dans le projet pour permettre la création de mini apps compatibles avec World App.

## Installation

Les dépendances suivantes ont été installées :

```bash
npm install @worldcoin/minikit-js @worldcoin/minikit-react --legacy-peer-deps
```

## Architecture

### 1. Service MiniKit (`src/services/miniKitService.ts`)

Un service centralisé pour gérer les interactions avec MiniKit :

```typescript
import MiniKitService from './services/miniKitService';

// Vérifier si MiniKit est installé
const isInstalled = MiniKitService.isInstalled();

// Initialiser MiniKit
MiniKitService.init();

// Accéder à l'instance MiniKit
const miniKit = MiniKitService.getMiniKit();
```

### 2. Composant de Statut (`src/components/MiniKitStatus.tsx`)

Un composant React qui affiche le statut d'installation de MiniKit :

- ✅ **Running in World App** : L'app fonctionne dans World App
- ⚠️ **Running in Browser Mode** : L'app fonctionne dans un navigateur standard

## Utilisation

### Détection d'Environment

```typescript
import MiniKitService from '../services/miniKitService';

if (MiniKitService.isInstalled()) {
  // L'app fonctionne dans World App
  console.log('✅ MiniKit est disponible');
} else {
  // L'app fonctionne dans un navigateur
  console.log('⚠️ Mode navigateur');
}
```

### Accès aux Fonctionnalités MiniKit

```typescript
import { miniKit } from '../services/miniKitService';

// Utiliser les fonctionnalités MiniKit
if (MiniKitService.isInstalled()) {
  // Accéder aux fonctionnalités World App
  // Ex: Wallet, Authentification, etc.
}
```

## Intégration dans l'App

Le composant `MiniKitStatus` a été ajouté à `App.tsx` pour afficher en permanence le statut d'intégration.

## Prochaines Étapes

1. **Authentification World ID** : Implémenter la vérification d'identité
2. **Transactions Wallet** : Permettre les transactions blockchain
3. **Sharing** : Partage de contenu via World App
4. **Notifications** : Gestion des notifications push

## Ressources

- [Documentation MiniKit-JS](https://docs.world.org/mini-kit/js)
- [Templates et Exemples](https://github.com/worldcoin/minikit-js)
- [World App Documentation](https://docs.world.org/)

## Développement Local

Quand vous développez localement, l'app fonctionnera en "Browser Mode". Pour tester les fonctionnalités MiniKit complètes, vous devez :

1. Déployer l'app sur un serveur accessible
2. Configurer l'app dans World App Developer Portal
3. Tester via World App mobile

## Troubleshooting

### Erreurs d'Import

Si vous rencontrez des erreurs d'import avec MiniKit, vérifiez :

1. Les versions des packages installés
2. La compatibilité avec votre version de React
3. Utilisez `--legacy-peer-deps` si nécessaire

### Détection d'Installation

La méthode `MiniKit.isInstalled()` retourne `false` dans un navigateur standard. C'est le comportement attendu. 