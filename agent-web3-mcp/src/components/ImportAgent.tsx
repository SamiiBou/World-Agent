import React, { useState } from 'react';
import { isAddress, BrowserProvider, toUtf8Bytes, verifyMessage } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function ImportAgent() {
  const [address, setAddress]   = useState('');
  const [status,  setStatus]    = useState<'idle'|'signing'|'linked'|'error'>('idle');

  const linkAgent = async () => {
    try {
      if (!isAddress(address)) throw new Error('Invalid address');

      // 1. connect wallet
      if (!window.ethereum) throw new Error('No EVM wallet found');
      const provider = new BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer  = await provider.getSigner();
      const account = await signer.getAddress();
      if (account.toLowerCase() !== address.toLowerCase())
        throw new Error('Wallet address ≠ agent address');

      // 2. build challenge – normally request it from backend
      const { uniqueHash } = JSON.parse(localStorage.getItem('verification')!); // whatever key you used
      const nonce   = Math.random().toString(36).slice(2);
      const expires = Date.now() + 5*60_000;
      const challenge = `HVA_LINK\nuh:${uniqueHash}\naddr:${address}\nnonce:${nonce}\nexp:${expires}`;

      setStatus('signing');
      const signature = await signer.signMessage(challenge);

      // 3. send to backend
      await fetch('/api/agents/import', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ agentAddress: address, uniqueHash, challenge, signature })
      }).then(r => {
        if (!r.ok) throw new Error('Backend rejected import');
      });

      setStatus('linked');
    } catch (err:any) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="import-container">
      <h2>Import Existing Agent</h2>
      <input
        type="text"
        placeholder="0xAgentAddress…"
        value={address}
        onChange={e => setAddress(e.target.value)}
      />
      <button onClick={linkAgent} disabled={status==='signing'}>
        {status==='signing' ? 'Signing…' : 'Link Agent'}
      </button>

      {status==='linked' && <p>✅ Agent linked to your identity!</p>}
      {status==='error'  && <p>❌ Failed to link agent—see console.</p>}
    </div>
  );
} 