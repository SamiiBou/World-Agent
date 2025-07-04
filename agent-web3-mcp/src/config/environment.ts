export const config = {
  openai: {
    apiKey: process.env.REACT_APP_OPENAI_API_KEY || '',
    model: 'gpt-4o-mini',
  },
  mcp: {
    serverUrl: process.env.REACT_APP_MCP_SERVER_URL || 'http://localhost:3001/mcp',
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
      You are an intelligent AI agent called AgentWeb3. You can use MCP tools to:
      - Interact with Web3 services (blockchain, DeFi, NFT)
      - Automate tasks
      - Access external APIs
      - Manage data and files
      
      Use the available tools via MCP to respond to user requests.
      Be precise, helpful and explain your actions.
    `,
  },
}; 