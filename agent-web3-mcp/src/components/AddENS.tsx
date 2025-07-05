import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import ENSService from '../services/ensService';
import MiniKitService from '../services/miniKitService';
import { MiniKit } from '@worldcoin/minikit-js';
import './AddENS.css';

const AddENS: React.FC = () => {
  // Get agent address passed via navigation state
  const location = useLocation() as any;
  const navigate = useNavigate();
  const agentAddress: string = location?.state?.agentId || '';

  // Local state
  const [ensName, setEnsName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLinkEns = async () => {
    if (!agentAddress) {
      setError('Agent address is missing.');
      return;
    }
    if (!ensName) {
      setError('Please enter an ENS name.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let ethProvider: any = (window as any).ethereum;
      // Fallback: try MiniKit's injected provider if available
      if (!ethProvider && (window as any).MiniKit?.ethereum) {
        ethProvider = (window as any).MiniKit.ethereum;
      }

      if (ethProvider) {
        const provider = new ethers.BrowserProvider(ethProvider);
        // Ensure we have account access
        await provider.send('eth_requestAccounts', []);
        const signer = await provider.getSigner();

        await ENSService.linkEnsToAgent({
          ensName,
          agentWorldAddress: agentAddress,
          worldUsername: MiniKitService.getUsername() || '',
          selfNullifier: 'linked',
          signer,
        });
      } else if (MiniKit.isInstalled()) {
        // === World App fallback ===
        // 1. Resolve ENS data using a public provider
        const publicProvider = ethers.getDefaultProvider('mainnet');
        const resolver = await publicProvider.getResolver(ensName);
        if (!resolver) throw new Error('ENS resolver not found for this name');
        const resolverAddress = typeof resolver === 'string' ? resolver : resolver.address;

        const iface = new ethers.Interface([
          'function setAddr(bytes32 node, address addr)',
          'function setText(bytes32 node, string key, string value)'
        ]);

        const node = ethers.namehash(ensName);

        const txs = [
          iface.encodeFunctionData('setAddr', [node, agentAddress]),
          iface.encodeFunctionData('setText', [node, 'world_username', MiniKitService.getUsername() || '']),
          iface.encodeFunctionData('setText', [node, 'self_nullifier', 'linked'])
        ];

        for (const data of txs) {
          const response = await MiniKit.commandsAsync.sendTransaction({
            to: resolverAddress,
            value: '0',
            data,
            chainId: 1 // Ethereum mainnet
          } as any);
          console.log('MiniKit tx response', response);
        }
        setSuccess('ENS linked successfully via World App!');
      } else {
        setError('No Ethereum provider found and MiniKit not available.');
        return;
      }
    } catch (err: any) {
      console.error('ENS link error', err);
      setError(err?.message || 'Failed to link ENS');
    } finally {
      setIsLoading(false);
    }
  };

  console.log('[MiniKit] installed?', MiniKit.isInstalled());

  return (
    <div className="add-ens-container">
      <h2>➕ Link ENS to Agent</h2>
      <p className="subtitle">Agent Address: <code>{agentAddress || 'Unknown'}</code></p>

      <div className="form-group">
        <label htmlFor="ensName">ENS Name (.eth)</label>
        <input
          id="ensName"
          type="text"
          placeholder="yourname.eth"
          value={ensName}
          onChange={(e) => setEnsName(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <button className="link-btn" onClick={handleLinkEns} disabled={isLoading}> {isLoading ? 'Linking...' : 'Link ENS'} </button>
      <button className="cancel-btn" onClick={() => navigate(-1)} disabled={isLoading}>Cancel</button>

      {error && (
        <div className="error-msg">
          {error}
          {error.includes('No Ethereum provider') && (
            <>
              <p style={{fontSize:12,marginTop:10}}>Open this link in Safari / Chrome:</p>
              <pre style={{fontSize:11,wordBreak:'break-all'}}>
                {window.location.href}
              </pre>
            </>
          )}
        </div>
      )}
      {success && <div className="success-msg">{success}</div>}
    </div>
  );
};

export default AddENS; 