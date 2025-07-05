import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { vcService, VCSummary } from '../services/vcService';
import MiniKitService from '../services/miniKitService';
import ENSService from '../services/ensService';
import { useLocation } from 'react-router-dom';

interface AgentLinkingProps {
  agentId?: string;
  walletAddress?: string;
}

const AgentLinking: React.FC<AgentLinkingProps> = ({ agentId, walletAddress }) => {
  const location = useLocation() as any;
  const [currentAgentId, setCurrentAgentId] = useState(agentId || '');
  const [currentWalletAddress, setCurrentWalletAddress] = useState(walletAddress || '');
  const [declaration, setDeclaration] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedVC, setGeneratedVC] = useState<VCSummary | null>(null);
  const [userVCs, setUserVCs] = useState<VCSummary[]>([]);
  const [canLink, setCanLink] = useState(false);
  const [linkReason, setLinkReason] = useState<string | null>(null);
  const [verifications, setVerifications] = useState({ selfId: false, worldId: false });
  const [ensName, setEnsName] = useState<string>(() => localStorage.getItem('ensName') || '');

  // Auto-detect agentId from navigation state if not provided
  useEffect(() => {
    if (!currentAgentId && location?.state?.agentId) {
      setCurrentAgentId(location.state.agentId);
    }
  }, [location, currentAgentId]);

  // Initialize with MiniKit wallet if available
  useEffect(() => {
    if (MiniKitService.isAuthenticated() && !currentWalletAddress) {
      const address = MiniKitService.getWalletAddress();
      if (address) {
        setCurrentWalletAddress(address);
      }
    }
  }, [currentWalletAddress]);

  // Check if user can link agents
  useEffect(() => {
    const checkLinkEligibility = async () => {
      if (!currentWalletAddress) return;

      try {
        const result = await vcService.canUserLinkAgent(currentWalletAddress);
        setCanLink(result.canLink);
        setLinkReason(result.reason || null);
        setVerifications(result.verifications);
      } catch (error) {
        console.error('Error checking link eligibility:', error);
      }
    };

    checkLinkEligibility();
  }, [currentWalletAddress]);

  // Load user's existing VCs
  useEffect(() => {
    const loadUserVCs = async () => {
      if (!currentWalletAddress) return;

      try {
        const result = await vcService.getUserVCs(currentWalletAddress);
        setUserVCs(result.vcs);
      } catch (error) {
        console.error('Error loading user VCs:', error);
      }
    };

    loadUserVCs();
  }, [currentWalletAddress]);

  // Load ENS name for user wallet automatically
  useEffect(() => {
    const loadEns = async () => {
      if (!currentWalletAddress) return;
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const name = await provider.lookupAddress(currentWalletAddress);
        if (!ensName && name) setEnsName(name);
      } catch (err) {
        console.warn('ENS lookup failed', err);
      }
    };
    loadEns();
  }, [currentWalletAddress, ensName]);

  const handleLinkAgent = async () => {
    if (!currentAgentId || !currentWalletAddress || !declaration) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Link agent (DApp will sign automatically)
      const result = await vcService.linkAgent(currentAgentId, {
        walletAddress: currentWalletAddress,
        declaration: declaration
      });

      setGeneratedVC(result.vc);
      setSuccess('Agent linked successfully and VC generated!');
      
      // Reload user VCs
      const updatedVCs = await vcService.getUserVCs(currentWalletAddress);
      setUserVCs(updatedVCs.vcs);

      // Clear form
      setDeclaration('');

      // If user provided ENS name, write text records
      if (ensName) {
        try {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const signer = await provider.getSigner();

          await ENSService.linkEnsToAgent({
            ensName: ensName,
            agentWorldAddress: currentAgentId,
            worldUsername: MiniKitService.getUsername() || '',
            selfNullifier: verifications.selfId ? 'verified' : 'unverified',
            signer,
          });

          console.log('ENS records updated');
        } catch (ensErr) {
          console.error('Failed to update ENS', ensErr);
        }
      }

    } catch (error: any) {
      console.error('Error linking agent:', error);
      setError(error.message || 'Failed to link agent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyVC = async (vcId: string) => {
    try {
      const result = await vcService.verifyVC(vcId);
      alert(`VC Verification: ${result.message}`);
    } catch (error: any) {
      alert(`Verification failed: ${error.message}`);
    }
  };

  const renderVerificationStatus = () => {
    if (!currentWalletAddress) return null;

    return (
      <div className="verification-status">
        <h3>Identity Verification Status</h3>
        <div className="verification-badges">
          <span className={`badge ${verifications.selfId ? 'verified' : 'unverified'}`}>
            Self ID: {verifications.selfId ? '✅ Verified' : '❌ Not Verified'}
          </span>
          <span className={`badge ${verifications.worldId ? 'verified' : 'unverified'}`}>
            World ID: {verifications.worldId ? '✅ Verified' : '❌ Not Verified'}
          </span>
        </div>
        {!canLink && linkReason && (
          <div className="warning">
            ⚠️ {linkReason}
          </div>
        )}
      </div>
    );
  };

  const renderVCCard = (vc: VCSummary) => {
    const statusColor = vcService.getVCStatusColor(vc.status);
    
    return (
      <div key={vc.vcId} className="vc-card">
        <div className="vc-header">
          <h4>Agent VC</h4>
          <span className="vc-status" style={{ color: statusColor }}>
            {vc.status.toUpperCase()}
          </span>
        </div>
        
        <div className="vc-details">
          <p><strong>Agent:</strong> {vc.agentId.slice(0, 8)}...{vc.agentId.slice(-6)}</p>
          <p><strong>Declaration:</strong> {vc.declaration}</p>
          <p><strong>Created:</strong> {new Date(vc.createdAt * 1000).toLocaleString()}</p>
          
          <div className="identity-proofs">
            <strong>Identity Proofs:</strong>
            {vc.identityProofs.selfId && <span className="proof-badge">Self ID</span>}
            {vc.identityProofs.worldId && <span className="proof-badge">World ID</span>}
          </div>
          
          <div className="vc-actions">
            {vc.isSigned && (
              <button 
                onClick={() => handleVerifyVC(vc.vcId)}
                className="verify-btn"
              >
                Verify Signature
              </button>
            )}
            {!vc.isSigned && (
              <span className="unsigned-notice">⚠️ Unsigned</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="agent-linking">
      <h2>🤖 Agent Linking with VC Generation</h2>
      
      {renderVerificationStatus()}
      
      <div className="linking-form">
        <h3>Link New Agent</h3>
        
        <div className="form-group">
          <label>Agent Address:</label>
          <input
            type="text"
            value={currentAgentId}
            onChange={(e) => setCurrentAgentId(e.target.value)}
            placeholder="0x..."
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label>Your Wallet Address:</label>
          <input
            type="text"
            value={currentWalletAddress}
            onChange={(e) => setCurrentWalletAddress(e.target.value)}
            placeholder="0x..."
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label>Declaration:</label>
          <textarea
            value={declaration}
            onChange={(e) => setDeclaration(e.target.value)}
            placeholder="This agent acts on my behalf to..."
            disabled={isLoading}
            rows={3}
          />
        </div>
        
        <div className="form-group">
          <label>Your ENS Name (optional):</label>
          <input
            type="text"
            value={ensName}
            onChange={(e) => setEnsName(e.target.value)}
            placeholder="myname.eth"
            disabled={isLoading}
          />
        </div>
        
        <button
          onClick={handleLinkAgent}
          disabled={isLoading || !canLink || !currentAgentId || !currentWalletAddress || !declaration}
          className="link-btn"
        >
          {isLoading ? 'Linking...' : 'Link Agent & Generate Signed VC'}
        </button>
      </div>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      {generatedVC && (
        <div className="generated-vc">
          <h3>✅ Generated VC</h3>
          {renderVCCard(generatedVC)}
        </div>
      )}
      
      {userVCs.length > 0 && (
        <div className="user-vcs">
          <h3>Your Agent VCs ({userVCs.length})</h3>
          <div className="vcs-grid">
            {userVCs.map(renderVCCard)}
          </div>
        </div>
      )}
      
      <style>{`
        .agent-linking {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .verification-status {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }
        
        .verification-badges {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }
        
        .badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .badge.verified {
          background: #d4edda;
          color: #155724;
        }
        
        .badge.unverified {
          background: #f8d7da;
          color: #721c24;
        }
        
        .warning {
          margin-top: 12px;
          padding: 8px;
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 4px;
          color: #856404;
        }
        
        .linking-form {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
        }
        
        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .link-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .link-btn:hover:not(:disabled) {
          background: #0056b3;
        }
        
        .link-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
        
        .error {
          background: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 4px;
          margin: 12px 0;
        }
        
        .success {
          background: #d4edda;
          color: #155724;
          padding: 12px;
          border-radius: 4px;
          margin: 12px 0;
        }
        
        .vc-card {
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          background: white;
        }
        
        .vc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .vc-header h4 {
          margin: 0;
        }
        
        .vc-status {
          font-size: 12px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 3px;
          background: #f8f9fa;
        }
        
        .vc-details p {
          margin: 8px 0;
          font-size: 14px;
        }
        
        .identity-proofs {
          margin: 12px 0;
        }
        
        .proof-badge {
          display: inline-block;
          background: #e7f3ff;
          color: #0066cc;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 11px;
          margin-right: 6px;
        }
        
        .vc-actions {
          margin-top: 12px;
        }
        
        .verify-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .unsigned-notice {
          color: #856404;
          font-size: 12px;
        }
        
        .vcs-grid {
          display: grid;
          gap: 16px;
        }
        
        .generated-vc {
          margin: 20px 0;
        }
        
        .user-vcs {
          margin-top: 30px;
        }
      `}</style>
    </div>
  );
};

export default AgentLinking; 