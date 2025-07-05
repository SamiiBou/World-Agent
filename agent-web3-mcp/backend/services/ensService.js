import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();

// -------------------------------------------------------------------
// Configuration
// -------------------------------------------------------------------
// Use Sepolia test-net by default for cheap / free demos
export const RPC_URL = process.env.ALCHEMY_SEPOLIA_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo';
export const ENS_OWNER_PK = process.env.ENS_OWNER_PK; // wallet that pays gas / registers
// ENS core registry is the same address on all networks
const ENS_REGISTRY_ADDR = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
// EthRegistrarController on Sepolia (v0.8.0) – update via env if different
const ENS_CONTROLLER_ADDR = process.env.ENS_CONTROLLER_ADDR || '0xBd2dbCFfD5Cf0f0b6C60C2035096Bb1Bd8C7fC85';

// Public resolver address (Sepolia)
const PUBLIC_RESOLVER = process.env.ENS_PUBLIC_RESOLVER || '0xD9bB5eA4f7A1A2C3A46b96528ca7fE788203aC9C';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer   = ENS_OWNER_PK ? new ethers.Wallet(ENS_OWNER_PK, provider) : provider.getSigner();

// Minimal ABIs --------------------------------------------------------
const TEXT_ABI = [
  'function setText(bytes32 node,string key,string value) external'
];

const CONTROLLER_ABI = [
  'function rentPrice(string name,uint256 duration) external view returns(uint256)',
  'function register(string name,address owner,uint256 duration,address resolver,bytes[] calldata data) external payable'
];

// -------------------------------------------------------------------
// Helper: register a .eth name on Sepolia & configure initial resolver
// -------------------------------------------------------------------
export async function registerEnsName(ensName, ownerAddress, durationYears = 1) {
  if (!ensName.endsWith('.eth')) throw new Error('Name must end with .eth');
  const label = ensName.replace('.eth', '');
  const duration = durationYears * 31536000; // seconds

  const controller = new ethers.Contract(ENS_CONTROLLER_ADDR, CONTROLLER_ABI, signer);

  // 1. query rent price
  const rent = await controller.rentPrice(label, duration);
  console.log(`Rent for ${durationYears}y:`, ethers.formatEther(rent), 'ETH');

  // 2. register (single tx variant)
  const tx = await controller.register(label, ownerAddress, duration, PUBLIC_RESOLVER, [], { value: rent });
  await tx.wait();
  console.log('✅ Registered', ensName, 'hash:', tx.hash);

  return tx.hash;
}

// -------------------------------------------------------------------
// Add / update custom agent text-records under an existing ENS name
// -------------------------------------------------------------------
export async function writeAgentRecord(ensName, payload) {
  const resolverAddr = await provider.getResolver(ensName);
  if (!resolverAddr) throw new Error('No resolver for this ENS name');
  const resolver = new ethers.Contract(resolverAddr, TEXT_ABI, signer);
  const node     = ethers.namehash(ensName);   // namehash in v6

  const tx = await resolver.setText(node, 'app.hva.agent.v1', JSON.stringify(payload));
  await tx.wait();
  console.log('📝 Text record updated for', ensName);
}