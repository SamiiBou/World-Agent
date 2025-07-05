import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import ENSService from '../services/ensService';
import MiniKitService from '../services/miniKitService';
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
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      await ENSService.linkEnsToAgent({
        ensName,
        agentWorldAddress: agentAddress,
        worldUsername: MiniKitService.getUsername() || '',
        selfNullifier: 'linked',
        signer,
      });

      setSuccess('ENS linked successfully!');
    } catch (err: any) {
      console.error('ENS link error', err);
      setError(err?.message || 'Failed to link ENS');
    } finally {
      setIsLoading(false);
    }
  };

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

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}
    </div>
  );
};

export default AddENS; 