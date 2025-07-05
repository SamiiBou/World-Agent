import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_MAINNET_URL);
const signer   = new ethers.Wallet(process.env.ENS_OWNER_PK, provider);

const TEXT_ABI = [
  'function setText(bytes32 node,string key,string value) external'
];

export async function writeAgentRecord(ensName, payload) {
  const resolverAddr = await provider.getResolver(ensName);
  if (!resolverAddr) throw new Error('No resolver for this ENS name');
  const resolver = new ethers.Contract(resolverAddr, TEXT_ABI, signer);
  const node     = ethers.namehash(ensName);   // namehash in v6

  const tx = await resolver.setText(node, 'app.hva.agent.v1', JSON.stringify(payload));
  await tx.wait();
}