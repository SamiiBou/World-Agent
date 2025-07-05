import React, { useState, useEffect, useRef } from 'react';
import { agentService } from '../services/agentService';
import { MCPMessage, MCPToolCall, MCPToolResult } from '../types/mcp';
import { AgentManager } from './AgentManager';
import { Agent } from '../services/backendService';
import { backendService } from '../services/backendService';
import './ChatInterface.css';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import ENSService from '../services/ensService';

interface ChatInterfaceProps {
  className?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: MCPToolCall[];
  toolResults?: MCPToolResult[];
  isProcessing?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ className }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableTools, setAvailableTools] = useState<any[]>([]);
  const [connectedServers, setConnectedServers] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showAgentManager, setShowAgentManager] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [identityStatus, setIdentityStatus] = useState<{self: boolean; world: boolean; hasVC: boolean}>({self:false, world:false, hasVC:false});
  const [vcObject, setVcObject] = useState<any | null>(null);
  const [vcModalOpen, setVcModalOpen] = useState(false);
  const [ensName, setEnsName] = useState<string | null>(null);
  const [ensRecords, setEnsRecords] = useState<{ world_username?: string; self_nullifier?: string }>({});
  const navigate = useNavigate();

  useEffect(() => {
    // Load available tools and servers
    loadAgentData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Update welcome message when agent is selected/deselected
    if (selectedAgent) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm ${selectedAgent.name} ${selectedAgent.avatar}, your AI assistant with World Chain integration.

🌍 **My World Chain Address**: ${selectedAgent.address}
💰 **Current Balance**: ${selectedAgent.balance} ETH
🔗 **Capabilities**: ${selectedAgent.config.capabilities.join(', ')}

I can help you with:
🔗 **World Chain Operations**: Check balances, transfers, and interactions
📁 **Files**: Read and write files  
🌐 **APIs**: Make API calls
⚙️ **Automation**: Automate various tasks

How can I help you today?`,
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
    } else {
      setMessages([]);
    }
  }, [selectedAgent]);

  useEffect(() => {
    if (selectedAgent) {
      // fetch VC info
      fetchVCInfo(selectedAgent.address);
      // fetch ENS info
      (async () => {
        try {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const name = await ENSService.getEnsName(selectedAgent.address, provider);
          if (name) {
            setEnsName(name);
            const worldUsername = await ENSService.getText(name, 'world_username', provider);
            const selfNullifier = await ENSService.getText(name, 'self_nullifier', provider);
            setEnsRecords({ world_username: worldUsername || '', self_nullifier: selfNullifier || '' });
          } else {
            setEnsName(null);
            setEnsRecords({});
          }
        } catch (err) {
          console.error('ENS lookup failed', err);
          setEnsName(null);
          setEnsRecords({});
        }
      })();
    } else {
      setIdentityStatus({self:false, world:false, hasVC:false});
      setVcObject(null);
      setEnsName(null);
      setEnsRecords({});
    }
  }, [selectedAgent]);

  const loadAgentData = async () => {
    try {
      const tools = agentService.getAvailableTools();
      const servers = agentService.getConnectedServers();
      setAvailableTools(tools);
      setConnectedServers(servers);
    } catch (error) {
      console.error('Error loading agent data:', error);
    }
  };

  const fetchVCInfo = async (agentAddress: string) => {
    try {
      const data = await backendService.getAgentVC(agentAddress);
      if (data && data.vc) {
        const vc = data.vc;
        const selfProof = vc.humanProof?.selfId || null;
        const worldProof = vc.humanProof?.worldId || null;
        const selfLinked = !!(selfProof && Object.keys(selfProof).length > 0);
        const worldLinked = !!(worldProof && Object.keys(worldProof).length > 0);
        setIdentityStatus({self:selfLinked, world:worldLinked, hasVC:true});
        console.log('📜 VC fetched for agent', vc);
        setVcObject(vc);
      } else {
        setIdentityStatus({self:false, world:false, hasVC:false});
        setVcObject(null);
      }
    } catch (err) {
      console.log('No VC found for agent', err);
      setIdentityStatus({self:false, world:false, hasVC:false});
      setVcObject(null);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAgentSelected = (agent: Agent | null) => {
    setSelectedAgent(agent);
    if (agent) {
      setShowAgentManager(false);
    }
  };

  const handleAgentCreated = (agent: Agent) => {
    // Agent was successfully created and will be automatically selected
    console.log('New agent created:', agent.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing || !selectedAgent) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    // Add temporary "processing" message
    const processingMessage: ChatMessage = {
      id: 'processing-' + Date.now(),
      role: 'assistant',
      content: 'Processing...',
      timestamp: new Date(),
      isProcessing: true
    };

    setMessages(prev => [...prev, processingMessage]);

    try {
      // Convert history for agent service
      const conversationHistory: MCPMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        toolCalls: msg.toolCalls,
        toolCallId: msg.toolCalls?.[0]?.id
      }));

      // Process message with agent, including selected agent info
      const result = await agentService.processMessage(
        input.trim(), 
        conversationHistory, 
        selectedAgent
      );

      // Create response message
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        toolCalls: result.toolCalls,
        toolResults: result.toolResults
      };

      // Replace processing message with response
      setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id).concat(assistantMessage));
      
    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Sorry, an error occurred while processing your message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };

      setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id).concat(errorMessage));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderToolCalls = (toolCalls?: MCPToolCall[], toolResults?: MCPToolResult[]) => {
    if (!toolCalls || toolCalls.length === 0) return null;

    return (
      <div className="tool-calls">
        <h4>🔧 Tools Used:</h4>
        {toolCalls.map((toolCall, index) => {
          const result = toolResults?.find(r => r.id === toolCall.id);
          return (
            <div key={toolCall.id} className="tool-call">
              <div className="tool-call-header">
                <span className="tool-name">{toolCall.name}</span>
                <span className="tool-status">
                  {result?.error ? '❌ Error' : '✅ Success'}
                </span>
              </div>
              <div className="tool-params">
                <strong>Parameters:</strong>
                <pre>{JSON.stringify(toolCall.parameters, null, 2)}</pre>
              </div>
              {result && (
                <div className="tool-result">
                  <strong>Result:</strong>
                  {result.error ? (
                    <div className="error">{result.error}</div>
                  ) : (
                    <pre>{JSON.stringify(result.result, null, 2)}</pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const downloadVC = (vc:any) => {
    const blob = new Blob([JSON.stringify(vc, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${vc.vcId || 'agent-vc'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`chat-interface ${className || ''}`}>
      {/* Agent Manager - shown at top or when no agent selected */}
      {(showAgentManager || !selectedAgent) && (
        <AgentManager
          selectedAgent={selectedAgent}
          onAgentSelected={handleAgentSelected}
          onAgentCreated={handleAgentCreated}
          vcObject={vcObject}
        />
      )}

      {/* Toggle Agent Manager button when agent is selected */}
      {selectedAgent && !showAgentManager && (
        <div className="agent-manager-toggle">
          <button
            onClick={() => setShowAgentManager(true)}
            className="toggle-button"
          >
            🤖 Agent Manager
          </button>
        </div>
      )}

      {/* Chat Section - only shown when agent is selected */}
      {selectedAgent && (
        <div className="chat-section">
          <div className="chat-header">
            <div className="agent-profile">
              <div className="agent-avatar">{selectedAgent.avatar}</div>
              <div className="agent-details">
                <h3>{selectedAgent.name}</h3>
                <p>{selectedAgent.description || 'Web3 Agent with World Chain integration'}</p>
                <div className="agent-info">
                  <div className="info-item">
                    <span className="label">Address:</span>
                    <span className="value">{selectedAgent.address}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Balance:</span>
                    <span className="value">{selectedAgent.balance} ETH</span>
                  </div>
                </div>
                {/* Inline VC preview */}
                {vcObject && (
                  <div className="vc-inline">
                    <span className="vc-label">📜 VC:</span>
                    <button
                      type="button"
                      className="vc-download-btn"
                      onClick={() => setVcModalOpen(true)}
                    >⬇️</button>
                  </div>
                )}
              </div>
            </div>
            <div className="connection-status">
              <div className="servers-count">
                📡 {connectedServers.length} MCP server(s) connected
              </div>
              <div className="tools-count">
                🔧 {availableTools.length} tool(s) available
              </div>
              <div className="identity-status">
                <div className={identityStatus.self ? 'linked' : 'unlinked'}>🆔 Self {identityStatus.self ? '✅' : '❌'}</div>
                <div className={identityStatus.world ? 'linked' : 'unlinked'}>🌍 World {identityStatus.world ? '✅' : '❌'}</div>
                <div className={identityStatus.hasVC ? 'linked' : 'unlinked'}>📜 VC {identityStatus.hasVC ? '✅' : '❌'}</div>
              </div>
            </div>
          </div>

          {/* ENS Section */}
          <div className="ens-section">
            <h4>👛 ENS</h4>
            {ensName ? (
              <table className="ens-table">
                <tbody>
                  <tr>
                    <td>Name</td>
                    <td>{ensName}</td>
                  </tr>
                  <tr>
                    <td>world_username</td>
                    <td>{ensRecords.world_username || '-'}</td>
                  </tr>
                  <tr>
                    <td>self_nullifier</td>
                    <td>{ensRecords.self_nullifier || '-'}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <button
                className="add-ens-btn"
                onClick={() => navigate('/add-ens', { state: { agentId: selectedAgent.address } })}
              >
                ➕ Add ENS
              </button>
            )}
          </div>

          <div className="messages-container">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.role}`}>
                <div className="message-header">
                  <span className="message-role">
                    {message.role === 'user' ? '👤 You' : `${selectedAgent.avatar} ${selectedAgent.name}`}
                  </span>
                  <span className="message-timestamp">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
                <div className="message-content">
                  {message.isProcessing ? (
                    <div className="processing">
                      <div className="spinner"></div>
                      {message.content}
                    </div>
                  ) : (
                    <div className="content">
                      {message.content.split('\n').map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                    </div>
                  )}
                  {renderToolCalls(message.toolCalls, message.toolResults)}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="input-form">
            <div className="input-container">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Talk to ${selectedAgent.name}... (Enter to send, Shift+Enter for new line)`}
                disabled={isProcessing}
                rows={1}
                className="message-input"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isProcessing}
                className="send-button"
              >
                {isProcessing ? '⏳' : '📤'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* No agent selected message */}
      {!selectedAgent && !showAgentManager && (
        <div className="no-agent-message">
          <div className="no-agent-icon">🤖</div>
          <h3>No Agent Selected</h3>
          <p>Please select or create an agent to start chatting.</p>
        </div>
      )}

      {vcModalOpen && vcObject && (
        <div className="vc-modal-overlay" onClick={()=>setVcModalOpen(false)}>
          <div className="vc-modal" onClick={(e)=>e.stopPropagation()}>
            <h3>📜 Verifiable Credential</h3>
            <pre className="vc-json-large">{JSON.stringify(vcObject, null, 2)}</pre>
            <div className="vc-modal-actions">
              <button className="vc-download-btn" onClick={()=>downloadVC(vcObject)}>Download JSON</button>
              <button className="vc-close-btn" onClick={()=>setVcModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 