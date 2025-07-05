import { BrowserProvider, ethers } from 'ethers';

/**
 * ENSService provides helper methods to resolve ENS names and set records.
 * All write operations require the user to be the owner of the ENS name –
 * they will be prompted to sign transactions in their wallet (World App / MiniKit's wallet provider).
 */
export class ENSService {
  /**
   * Resolve the primary ENS name of an address (if any)
   */
  static async getEnsName(address: string, provider?: BrowserProvider): Promise<string | null> {
    const _provider = provider || new BrowserProvider((window as any).ethereum);
    try {
      const name = await _provider.lookupAddress(address);
      return name;
    } catch (err) {
      console.error('ENS lookup failed', err);
      return null;
    }
  }

  /**
   * Get text record from an ENS name
   */
  static async getText(ensName: string, key: string, provider?: BrowserProvider): Promise<string | null> {
    const _provider = provider || new BrowserProvider((window as any).ethereum);
    try {
      const resolver = await _provider.getResolver(ensName);
      if (!resolver) return null;
      return await resolver.getText(key);
    } catch (err) {
      console.error('getText failed', err);
      return null;
    }
  }

  /**
   * Link ENS to agent & add custom text records.
   *
   * This will:
   * 1. Set the address record of the ENS name to the agent's World address.
   * 2. Add text records for `world_username` and `self_nullifier`.
   *
   * The caller must pass in a Signer that controls the ENS name.
   */
  static async linkEnsToAgent(options: {
    ensName: string;
    agentWorldAddress: string;
    worldUsername: string;
    selfNullifier: string;
    signer: ethers.Signer;
  }) {
    const { ensName, agentWorldAddress, worldUsername, selfNullifier, signer } = options;
    const provider: BrowserProvider = (signer.provider as BrowserProvider) || new ethers.BrowserProvider((window as any).ethereum);

    if (!ethers.isAddress(agentWorldAddress)) {
      throw new Error('Invalid agent world address');
    }

    // Fetch resolver address
    const resolverInfo: any = await provider.getResolver(ensName);
    if (!resolverInfo) throw new Error('ENS resolver not found for this name');

    const resolverAddress: string = typeof resolverInfo === 'string' ? resolverInfo : resolverInfo.address;

    // Minimal ABI for write operations we need
    const PUBLIC_RESOLVER_ABI = [
      'function setAddr(bytes32 node, address addr) external',
      'function setText(bytes32 node, string key, string value) external'
    ];

    const resolver = new ethers.Contract(resolverAddress, PUBLIC_RESOLVER_ABI, signer);
    const node = ethers.namehash(ensName);

    // Submit transactions sequentially or in parallel
    const txAddr = await resolver.setAddr(node, agentWorldAddress);
    const txWorld = await resolver.setText(node, 'world_username', worldUsername);
    const txSelf = await resolver.setText(node, 'self_nullifier', selfNullifier);

    await Promise.all([txAddr.wait(), txWorld.wait(), txSelf.wait()]);
  }
}

export default ENSService; 