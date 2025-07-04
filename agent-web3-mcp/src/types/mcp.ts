// Types pour Model Context Protocol (MCP)
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  tools: MCPTool[];
  connected: boolean;
}

export interface MCPRequest {
  method: string;
  params: Record<string, any>;
  id: string;
}

export interface MCPResponse {
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

export interface MCPMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: MCPToolCall[];
  toolCallId?: string;
}

export interface MCPToolCall {
  id: string;
  name: string;
  parameters: Record<string, any>;
}

export interface MCPToolResult {
  id: string;
  result: any;
  error?: string;
}

export interface AgentState {
  messages: MCPMessage[];
  isProcessing: boolean;
  availableTools: MCPTool[];
  connectedServers: MCPServer[];
} 