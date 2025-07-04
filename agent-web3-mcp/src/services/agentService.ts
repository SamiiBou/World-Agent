import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { mcpService } from './mcpService';
import { worldchainService } from './worldchainService';
import { MCPMessage, MCPToolCall, MCPToolResult } from '../types/mcp';
import { config } from '../config/environment';
import { Agent } from './backendService';

class AgentService {
  private isInitialized = false;
  
  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (this.isInitialized) return;
    
    // Check configuration
    if (!config.openai.apiKey) {
      console.warn('OpenAI API key missing. Using simulation mode.');
    }
    
    // Initialize World Chain service
    try {
      await worldchainService.initialize();
      console.log('✅ World Chain service initialized');
    } catch (error) {
      console.error('⚠️ World Chain service initialization failed:', error);
    }
    
    this.isInitialized = true;
  }

  async processMessage(message: string, conversationHistory: MCPMessage[] = [], selectedAgent?: Agent): Promise<{
    response: string;
    toolCalls: MCPToolCall[];
    toolResults: MCPToolResult[];
  }> {
    await this.initialize();

    const toolCalls: MCPToolCall[] = [];
    const toolResults: MCPToolResult[] = [];

    try {
      // In real implementation, this would use the OpenAI API
      // For demonstration, we'll use a simulated response
      const response = await this.generateResponse(message, conversationHistory, selectedAgent);
      
      // Check if the message requires tool usage
      const shouldUseTool = await this.shouldUseTool(message);
      
      if (shouldUseTool) {
        const toolCall = await this.generateToolCall(message);
        if (toolCall) {
          toolCalls.push(toolCall);
          const result = await mcpService.executeTool(toolCall);
          toolResults.push(result);
        }
      }

      return {
        response,
        toolCalls,
        toolResults
      };
    } catch (error) {
      console.error('Agent processing error:', error);
      return {
        response: 'Sorry, I encountered an error while processing your request.',
        toolCalls: [],
        toolResults: []
      };
    }
  }

  private async generateResponse(message: string, history: MCPMessage[], selectedAgent?: Agent): Promise<string> {
    if (!config.openai.apiKey) {
      // Simulation mode - generate contextual responses
      return this.generateSimulatedResponse(message, selectedAgent);
    }

    try {
      const openaiClient = createOpenAI({
        apiKey: config.openai.apiKey,
      });

      const result = await generateText({
        model: openaiClient(config.openai.model),
        system: config.agent.instructions,
        messages: [
          ...history
            .filter(msg => msg.role !== 'tool') // Filter out tool messages
            .map(msg => ({
              role: msg.role as 'user' | 'assistant' | 'system',
              content: msg.content
            })),
          { role: 'user', content: message }
        ],
        maxTokens: 500,
      });

      return result.text;
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.generateSimulatedResponse(message);
    }
  }

  private generateSimulatedResponse(message: string, selectedAgent?: Agent): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      if (selectedAgent) {
        return `Hello! I'm ${selectedAgent.name} ${selectedAgent.avatar}, your AI assistant with World Chain integration.

🌍 My World Chain address: ${selectedAgent.address}
💰 Current balance: ${selectedAgent.balance} ETH
🔗 I can help you with Web3 operations, file management, API calls, and more.

How can I assist you today?`;
      } else {
        const agentAddress = worldchainService.getAgentAddress();
        return `Hello! I'm ${config.agent.name}, your AI assistant with MCP support. 

🌍 I have my own World Chain address: ${agentAddress || 'Initializing...'}
🔗 I can help you with Web3 operations, file management, API calls, and more. 

How can I assist you today?`;
      }
    }
    
    if (lowerMessage.includes('address') || lowerMessage.includes('wallet') || lowerMessage.includes('worldchain')) {
      if (selectedAgent) {
        return `🏦 My World Chain wallet information:
📍 Address: ${selectedAgent.address}
💰 Balance: ${selectedAgent.balance} ETH
🔗 Explorer: https://worldchain-mainnet.explorer.alchemy.com/address/${selectedAgent.address}
🌍 Network: ${config.worldchain.chainName} (Chain ID: ${config.worldchain.chainId})

You can send me ETH on World Chain to this address!`;
      } else {
        const agentAddress = worldchainService.getAgentAddress();
        const explorerUrl = worldchainService.getExplorerUrl();
        return `🏦 My World Chain wallet information:
📍 Address: ${agentAddress || 'Initializing...'}
🔗 Explorer: ${explorerUrl}
🌍 Network: ${config.worldchain.chainName} (Chain ID: ${config.worldchain.chainId})

You can send me ETH on World Chain to this address!`;
      }
    }
    
    if (lowerMessage.includes('balance')) {
      return "I can help you check crypto balances! I can check:\n- My own World Chain balance\n- Any address on World Chain\n- Just ask: 'What's my balance?' or 'Check balance of [address]'";
    }
    
    if (lowerMessage.includes('transfer') || lowerMessage.includes('send')) {
      return "I can help you with crypto transfers on World Chain! Please provide the destination address and amount in ETH.";
    }
    
    if (lowerMessage.includes('file') || lowerMessage.includes('read') || lowerMessage.includes('write')) {
      return "I can help you with file operations! I can read file contents or write to files. Please specify the file path and what you'd like to do.";
    }
    
    if (lowerMessage.includes('api') || lowerMessage.includes('call')) {
      return "I can make API calls for you! Please provide the URL, HTTP method, and any necessary headers or body data.";
    }
    
    if (lowerMessage.includes('tool') || lowerMessage.includes('help')) {
      return "I have access to several MCP tools:\n- 🌍 worldchain_balance: Check World Chain balances\n- 💸 worldchain_transfer: Send ETH on World Chain\n- 📁 file_read: Read file contents\n- 📝 file_write: Write to files\n- 🌐 api_call: Make API calls\n\nWhat would you like to do?";
    }
    
    const agentName = selectedAgent ? selectedAgent.name : config.agent.name;
    return `I understand you're asking about: "${message}". I'm ${agentName}, equipped with MCP tools to help with Web3 operations (including World Chain), file management, and API calls. Could you please be more specific about what you'd like me to do?`;
  }

  private async shouldUseTool(message: string): Promise<boolean> {
    const lowerMessage = message.toLowerCase();
    
    const toolKeywords = [
      'balance', 'wallet', 'transfer', 'send', 'file', 'read', 'write', 
      'api', 'call', 'check', 'get', 'fetch', 'create', 'delete'
    ];
    
    return toolKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private async generateToolCall(message: string): Promise<MCPToolCall | null> {
    const lowerMessage = message.toLowerCase();
    
    // World Chain balance check
    if (lowerMessage.includes('balance') || lowerMessage.includes('wallet')) {
      const addressMatch = message.match(/0x[a-fA-F0-9]{40}/);
      const address = addressMatch ? addressMatch[0] : undefined;
      
      // Check if asking for agent's own balance
      if (lowerMessage.includes('my') || lowerMessage.includes('agent') || !address) {
        return {
          id: `tool_${Date.now()}`,
          name: 'worldchain_balance',
          parameters: {
            address: 'agent'
          }
        };
      }
      
      // Check specific address balance
      if (address) {
        return {
          id: `tool_${Date.now()}`,
          name: 'worldchain_balance',
          parameters: {
            address: address
          }
        };
      }
    }
    
    // World Chain transfer
    if (lowerMessage.includes('transfer') || lowerMessage.includes('send')) {
      const addressMatch = message.match(/0x[a-fA-F0-9]{40}/);
      const amountMatch = message.match(/(\d+\.?\d*)/);
      
      if (addressMatch && amountMatch) {
        return {
          id: `tool_${Date.now()}`,
          name: 'worldchain_transfer',
          parameters: {
            to: addressMatch[0],
            amount: amountMatch[1]
          }
        };
      }
    }
    
    // File operations
    if (lowerMessage.includes('file') && lowerMessage.includes('read')) {
      return {
        id: `tool_${Date.now()}`,
        name: 'file_read',
        parameters: {
          path: 'example.txt'
        }
      };
    }
    
    // API calls
    if (lowerMessage.includes('api') || lowerMessage.includes('call')) {
      return {
        id: `tool_${Date.now()}`,
        name: 'api_call',
        parameters: {
          url: 'https://api.example.com/data',
          method: 'GET'
        }
      };
    }
    
    return null;
  }

  getAvailableTools() {
    return mcpService.getAvailableTools();
  }

  getConnectedServers() {
    return mcpService.getConnectedServers();
  }
}

export const agentService = new AgentService(); 