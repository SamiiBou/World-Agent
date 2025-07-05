#!/usr/bin/env node

/**
 * 🔍 Script simple pour décoder les informations d'un agent
 * Usage: node decode-agent.js [AGENT_ADDRESS]
 */

const { ethers } = require('ethers');

// Configuration
const AGENT_REGISTRY_ADDRESS = '0x5B2d913ca8e5D1a185fCFeD380fDc6d2369B4fE8';
const RPC_URL = 'https://worldchain-mainnet.g.alchemy.com/public';

// ABI simplifié pour getAgent
const AGENT_REGISTRY_ABI = [
  "function getAgent(address agentAddress) external view returns (address ownerWallet, bytes32 worldIdNullifier, bytes32 selfIdNullifier, uint256 registrationTime, bool isActive, string memory username)"
];

async function decodeAgent(agentAddress) {
  try {
    console.log('\n🔍 Décodage de l\'agent:', agentAddress);
    console.log('📡 Connexion au réseau...');

    // Connexion au réseau
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(AGENT_REGISTRY_ADDRESS, AGENT_REGISTRY_ABI, provider);

    // Récupération des données
    console.log('📋 Récupération des données...');
    const agentData = await contract.getAgent(agentAddress);

    // Affichage des résultats
    console.log('\n✅ INFORMATIONS DE L\'AGENT:');
    console.log('================================');
    console.log('🏷️  Username:', agentData.username);
    console.log('👤 Propriétaire:', agentData.ownerWallet);
    console.log('🌍 World ID:', agentData.worldIdNullifier);
    console.log('🆔 Self ID:', agentData.selfIdNullifier);
    console.log('📅 Enregistré le:', new Date(Number(agentData.registrationTime) * 1000).toLocaleString());
    console.log('✅ Actif:', agentData.isActive ? 'Oui' : 'Non');
    console.log('================================');

    // Liens utiles
    console.log('\n🔗 LIENS UTILES:');
    console.log('📍 Agent sur explorer:', `https://worldchain-mainnet.explorer.alchemy.com/address/${agentAddress}`);
    console.log('👤 Propriétaire sur explorer:', `https://worldchain-mainnet.explorer.alchemy.com/address/${agentData.ownerWallet}`);
    console.log('📋 Contrat sur explorer:', `https://worldchain-mainnet.explorer.alchemy.com/address/${AGENT_REGISTRY_ADDRESS}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    
    if (error.message.includes('Agent not found')) {
      console.log('\n💡 Cet agent n\'existe pas ou n\'est pas enregistré.');
    } else if (error.message.includes('invalid address')) {
      console.log('\n💡 Adresse invalide. Vérifiez le format (0x...)');
    } else {
      console.log('\n💡 Vérifiez votre connexion internet et l\'adresse.');
    }
  }
}

// Utilisation
const agentAddress = process.argv[2];

if (!agentAddress) {
  console.log('\n🚀 USAGE:');
  console.log('node decode-agent.js [AGENT_ADDRESS]');
  console.log('\n📝 EXEMPLE:');
  console.log('node decode-agent.js 0x9882d180769329b1bf7df1c036302cd9149225b3');
  console.log('\n💡 Pour votre agent Agent2:');
  console.log('node decode-agent.js 0x9882d180769329b1bf7df1c036302cd9149225b3');
  process.exit(1);
}

// Validation simple de l'adresse
if (!agentAddress.startsWith('0x') || agentAddress.length !== 42) {
  console.error('❌ Adresse invalide. Format attendu: 0x...');
  process.exit(1);
}

// Exécution
decodeAgent(agentAddress); 