import { BrowserProvider, ContractRunner, ethers } from 'ethers';

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
    signer: ContractRunner;
  }) {
    const { ensName, agentWorldAddress, worldUsername, selfNullifier, signer } = options;
    const provider = (signer as any).provider as BrowserProvider;

    // Basic sanity check
    if (!ethers.isAddress(agentWorldAddress)) {
      throw new Error('Invalid agent world address');
    }

    // 1. Fetch resolver
    const resolver = await provider.getResolver(ensName);
    if (!resolver) {
      throw new Error('ENS resolver not found for this name');
    }

    // 2. Set address record (ETH coin type)
    const addrTx = await resolver.connect(signer).setAddress(agentWorldAddress);

    // 3. Set text records
    const worldTx = await resolver.connect(signer).setText('world_username', worldUsername);
    const selfTx = await resolver.connect(signer).setText('self_nullifier', selfNullifier);

    // Await confirmations in parallel
    await Promise.all([addrTx.wait(), worldTx.wait(), selfTx.wait()]);
  }
}

export default ENSService; 