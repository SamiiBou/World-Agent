import React, { useState, useEffect } from 'react';
import { backendService, Agent, CreateAgentRequest } from '../services/backendService';
import './AgentManager.css';

interface AgentManagerProps {
  selectedAgent: Agent | null;
  onAgentSelected: (agent: Agent | null) => void;
  onAgentCreated: (agent: Agent) => void;
}

export const AgentManager: React.FC<AgentManagerProps> = ({ 
  selectedAgent, 
  onAgentSelected, 
  onAgentCreated 
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  
  // Agent creation form
  const [createForm, setCreateForm] = useState<CreateAgentRequest>({
    name: '',
    description: '',
    avatar: '🤖'
  });

  // Available avatars
  const availableAvatars = ['🤖', '🔮', '⚡', '🌟', '🚀', '🎯', '💎', '🌈', '🦄', '🔥'];

  useEffect(() => {
    checkBackendConnection();
    loadAgents();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const connected = await backendService.isBackendConnected();
      setBackendConnected(connected);
    } catch (error) {
      setBackendConnected(false);
    }
  };

  const loadAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await backendService.getAgents({ active: true });
      setAgents(response.agents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading agents');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async () => {
    if (!createForm.name.trim()) {
      setError('Agent name is required');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const response = await backendService.createAgent(createForm);
      
      // Reset form
      setCreateForm({
        name: '',
        description: '',
        avatar: '🤖'
      });
      
      // Automatically select the new agent
      onAgentSelected(response.agent);
      
      await loadAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating agent');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAgentSelect = (agent: Agent) => {
    onAgentSelected(agent);
  };

  if (!backendConnected) {
    return (
      <div className="agent-manager">
        <div className="connection-error">
          <h3>⚠️ Backend not connected</h3>
          <p>Please start the backend server:</p>
          <code>cd backend && npm start</code>
          <button onClick={checkBackendConnection} className="retry-button">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="agent-manager">
      <div className="agent-manager-header">
        <h2>🤖 Agent Manager</h2>
        <div className="connection-status">
          <span className="status-indicator connected">●</span>
          Backend connected
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Formulaire de création d'agent */}
      <div className="agent-creation">
        <h3>🔧 Create New Agent</h3>
        
        <div className="form-group">
          <label>Agent Name *</label>
          <input
            type="text"
            value={createForm.name}
            onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
            placeholder="Enter agent name"
            disabled={isCreating}
          />
        </div>
        
        <div className="form-group">
          <label>Avatar</label>
          <div className="avatar-selector">
            {availableAvatars.map((avatar) => (
              <button
                key={avatar}
                type="button"
                className={`avatar-option ${createForm.avatar === avatar ? 'selected' : ''}`}
                onClick={() => setCreateForm({...createForm, avatar})}
                disabled={isCreating}
              >
                {avatar}
              </button>
            ))}
          </div>
        </div>
        
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={createForm.description}
            onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
            placeholder="Agent description (optional)"
            disabled={isCreating}
          />
        </div>
        
        <button
          className="create-button"
          onClick={handleCreateAgent}
          disabled={isCreating || !createForm.name.trim()}
        >
          {isCreating ? '🔄 Creating...' : '🚀 Create Agent'}
        </button>
      </div>

      {/* Liste des agents */}
      <div className="agents-section">
        <h3>📋 Available Agents ({agents.length})</h3>
        
        {loading ? (
          <div className="loading">🔄 Loading agents...</div>
        ) : agents.length === 0 ? (
          <div className="no-agents">
            <p>No agents created yet.</p>
            <p>Create your first agent to get started!</p>
          </div>
        ) : (
          <div className="agents-grid">
            {agents.map(agent => (
              <div
                key={agent.id}
                className={`agent-card ${selectedAgent?.id === agent.id ? 'selected' : ''}`}
                onClick={() => handleAgentSelect(agent)}
              >
                <div className="agent-card-header">
                  <span className="agent-avatar">{agent.avatar}</span>
                  <div className="agent-info">
                    <h4>{agent.name}</h4>
                    <p className="agent-description">{agent.description || 'No description'}</p>
                  </div>
                </div>
                
                <div className="agent-details">
                  <div className="address-info">
                    <span>📍 Address:</span>
                    <code>{agent.address}</code>
                  </div>
                  <div className="balance-info">
                    <span>💰 Balance:</span>
                    <span className="balance-amount">{agent.balance} ETH</span>
                  </div>
                </div>
                
                <div className="agent-stats">
                  <div className="stat">
                    <span>💸 Transactions</span>
                    <span>{agent.stats.totalTransactions}</span>
                  </div>
                  <div className="stat">
                    <span>💬 Interactions</span>
                    <span>{agent.stats.totalInteractions}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informations de l'agent sélectionné */}
      {selectedAgent && (
        <div className="selected-agent-info">
          <h3>🎯 Selected Agent</h3>
          <div className="selected-agent-details">
            <div className="agent-summary">
              <span className="agent-avatar-large">{selectedAgent.avatar}</span>
              <div>
                <h4>{selectedAgent.name}</h4>
                <p>{selectedAgent.description}</p>
                <div className="agent-address">
                  <span>📍 {selectedAgent.address}</span>
                  <button
                    onClick={() => window.open(backendService.getExplorerUrl(selectedAgent.address), '_blank')}
                    className="explorer-button"
                  >
                    🔍 Explorer
                  </button>
                </div>
              </div>
            </div>
            
            <div className="agent-actions">
              <button
                onClick={() => loadAgents()}
                className="action-button refresh"
              >
                🔄 Refresh
              </button>
              <button
                onClick={() => onAgentSelected(null)}
                className="action-button deselect"
              >
                ❌ Deselect
              </button>
            </div>
          </div>

          <div className="agent-stats">
            <div className="stat-item">
              <span className="stat-label">Address:</span>
              <span className="stat-value">{selectedAgent.address}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Balance:</span>
              <span className="stat-value">{selectedAgent.balance} ETH</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Created:</span>
              <span className="stat-value">{new Date(selectedAgent.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 