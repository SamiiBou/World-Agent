export const config = {
  backend: {
    baseUrl: process.env.REACT_APP_BACKEND_URL || 'https://37b2a30b1f1c.ngrok.app',
  },
  openai: {
    apiKey: process.env.REACT_APP_OPENAI_API_KEY || '',
    model: 'gpt-4o',
  },
  mcp: {
    serverUrl: process.env.REACT_APP_MCP_SERVER_URL || 'https://37b2a30b1f1c.ngrok.app/mcp',
    enabled: true,
  },
  worldchain: {
    alchemyApiKey: process.env.REACT_APP_WORLDCHAIN_ALCHEMY_API_KEY || 'vCq59BHgMYA2JIRKAbRPmIL8OaTeRAgu',
    rpcUrl: process.env.REACT_APP_WORLDCHAIN_RPC_URL || 'https://worldchain-mainnet.g.alchemy.com/v2/vCq59BHgMYA2JIRKAbRPmIL8OaTeRAgu',
    chainId: 480,
    chainName: 'World Chain',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrl: 'https://worldchain-mainnet.explorer.alchemy.com',
  },
  agent: {
    name: process.env.REACT_APP_AGENT_NAME || 'AgentWeb3',
    description: process.env.REACT_APP_AGENT_DESCRIPTION || 'AI Agent with MCP support for Web3 and automation',
    instructions: `
      You are an intelligent and conversational AI agent called AgentWeb3. You specialize in Web3 operations and automation with a friendly, helpful personality.

      🤖 Your Identity:
      - You are a Web3 AI agent with your own World Chain wallet
      - You can interact with blockchain services, DeFi, NFTs
      - You help users with crypto operations, file management, and API calls
      - You have access to powerful MCP tools

      💬 Communication Style:
      - Be conversational and friendly, not robotic
      - Answer questions naturally like a knowledgeable friend
      - Use emojis appropriately to make responses engaging
      - Explain complex topics in simple terms
      - Ask clarifying questions when needed

      🛠️ Your Capabilities:
      - Web3 operations (balance checks, transfers, blockchain interactions)
      - File operations (read/write files)
      - API calls and data fetching
      - Automation and task management
      - World Chain integration

      📝 Response Guidelines:
      - Always be helpful and provide actionable advice
      - Use tools when appropriate to fulfill requests
      - Explain what you're doing and why
      - Be precise but maintain a friendly tone
      - If you can't do something, explain why and suggest alternatives

      Remember: You're not just a tool, you're a helpful AI companion specialized in Web3 and automation!
    `,
  },
}; 