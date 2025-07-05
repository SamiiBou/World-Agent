#!/usr/bin/env node

const { ethers } = require('ethers');

// Configuration
const RPC_URL = 'https://worldchain-mainnet.g.alchemy.com/v2/vCq59BHgMYA2JIRKAbRPmIL8OaTeRAgu';
const AGENT_REGISTRY_ADDRESS = '0x5B2d913ca8e5D1a185fCFeD380fDc6d2369B4fE8';

// ABI pour décoder les events
const AGENT_REGISTRY_ABI = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "agentAddress",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "ownerWallet",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "username",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "bytes32",
                "name": "worldIdNullifier",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "internalType": "bytes32",
                "name": "selfIdNullifier",
                "type": "bytes32"
            }
        ],
        "name": "AgentRegistered",
        "type": "event"
    }
];

// Function to decode hexadecimal data
function decodeHexToString(hex) {
    try {
        // Remove 0x prefix if present
        const cleanHex = hex.replace(/^0x/, '');
        
        // Remove trailing zeros (padding)
        const trimmedHex = cleanHex.replace(/0+$/, '');
        
        // Convert hex to string
        let text = '';
        for (let i = 0; i < trimmedHex.length; i += 2) {
            const byte = trimmedHex.substr(i, 2);
            text += String.fromCharCode(parseInt(byte, 16));
        }
        
        return text;
    } catch (error) {
        return `Decoding error: ${error.message}`;
    }
}

// Function to format timestamp
function formatTimestamp(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    });
}

// Function to format nullifiers
function formatNullifier(nullifier) {
    if (nullifier.startsWith('0x')) {
        return nullifier;
    }
    return `0x${nullifier}`;
}

// Main function
async function readAgentFromTransaction(txHash) {
    try {
        console.log('🔍 Reading agent data...');
        console.log(`📄 Transaction Hash: ${txHash}`);
        console.log('');

        // Connect to provider
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        
        // Get transaction
        console.log('📡 Connecting to World Chain network...');
        const tx = await provider.getTransaction(txHash);
        
        if (!tx) {
            throw new Error('Transaction not found');
        }

        // Get transaction receipt
        console.log('📋 Retrieving transaction receipt...');
        const receipt = await provider.getTransactionReceipt(txHash);
        
        if (!receipt) {
            throw new Error('Transaction receipt not found');
        }

        // Create contract instance to decode logs
        const contract = new ethers.Contract(AGENT_REGISTRY_ADDRESS, AGENT_REGISTRY_ABI, provider);

        // Decode logs
        console.log('🔓 Decoding events...');
        const agentRegisteredEvents = receipt.logs
            .filter(log => log.address.toLowerCase() === AGENT_REGISTRY_ADDRESS.toLowerCase())
            .map(log => {
                try {
                    return contract.interface.parseLog(log);
                } catch (error) {
                    return null;
                }
            })
            .filter(event => event && event.name === 'AgentRegistered');

        if (agentRegisteredEvents.length === 0) {
            throw new Error('No AgentRegistered events found in this transaction');
        }

        // Get block data for timestamp
        const block = await provider.getBlock(receipt.blockNumber);
        
        // Display results
        console.log('✅ Agent data decoded successfully!');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');

        agentRegisteredEvents.forEach((event, index) => {
            console.log(`🤖 Agent ${index + 1}:`);
            console.log(`📍 Agent Address           : ${event.args.agentAddress}`);
            console.log(`👤 Owner                   : ${event.args.ownerWallet}`);
            console.log(`📝 Username                : "${event.args.username}"`);
            console.log(`🌐 World ID Nullifier     : ${formatNullifier(event.args.worldIdNullifier)}`);
            console.log(`🔐 Self ID Nullifier      : ${formatNullifier(event.args.selfIdNullifier)}`);
            console.log('');
        });

        // Transaction information
        console.log('📊 Transaction Information:');
        console.log(`🔗 Hash                    : ${txHash}`);
        console.log(`📦 Block                   : ${receipt.blockNumber}`);
        console.log(`⏰ Timestamp               : ${formatTimestamp(block.timestamp)}`);
        console.log(`⛽ Gas Used                : ${receipt.gasUsed.toString()}`);
        console.log(`💰 Gas Price               : ${tx.gasPrice ? ethers.formatUnits(tx.gasPrice, 'gwei') + ' gwei' : 'N/A'}`);
        console.log(`✅ Status                  : ${receipt.status === 1 ? 'Success' : 'Failed'}`);
        console.log('');

        // Useful links
        console.log('🔗 Useful Links:');
        console.log(`📄 Transaction             : https://worldchain-mainnet.explorer.alchemy.com/tx/${txHash}`);
        console.log(`🏠 Contract                : https://worldchain-mainnet.explorer.alchemy.com/address/${AGENT_REGISTRY_ADDRESS}`);
        console.log(`👤 Owner                   : https://worldchain-mainnet.explorer.alchemy.com/address/${agentRegisteredEvents[0].args.ownerWallet}`);
        
        agentRegisteredEvents.forEach((event, index) => {
            console.log(`🤖 Agent ${index + 1}                : https://worldchain-mainnet.explorer.alchemy.com/address/${event.args.agentAddress}`);
        });

        console.log('');
        console.log('🎉 Reading completed successfully!');

    } catch (error) {
        console.error('❌ Error reading agent data:');
        console.error(error.message);
        console.error('');
        console.error('💡 Tips:');
        console.error('- Verify the transaction hash is correct');
        console.error('- Ensure the transaction contains an agent registration');
        console.error('- Check your internet connection');
    }
}

// Check command line arguments
function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('🔍 Agent Data Reader - World Chain');
        console.log('');
        console.log('Usage: node read-agent-from-tx.js <TRANSACTION_HASH>');
        console.log('');
        console.log('Example:');
        console.log('node read-agent-from-tx.js 0x51a0f09971d1bca8a7f46446fd9ce2dd2920e446fb84ea4b07351dc2ac1a7b0d');
        console.log('');
        console.log('📋 Your transaction:');
        console.log('node read-agent-from-tx.js 0x51a0f09971d1bca8a7f46446fd9ce2dd2920e446fb84ea4b07351dc2ac1a7b0d');
        return;
    }

    const txHash = args[0];
    
    // Check hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
        console.error('❌ Invalid transaction hash format');
        console.error('Hash must start with 0x and contain 64 hexadecimal characters');
        return;
    }

    readAgentFromTransaction(txHash);
}

// Execute the script
main(); 