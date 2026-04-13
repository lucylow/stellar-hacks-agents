// Mock data for StellarHacks Agents product

export const mockWalletState = {
  connected: true,
  address: "GMOCK7IXQVPQXSNQXVQXVQXVQXVQXVQXVQXVQXVQXVQXVQXVQ1234",
  balance: 5.0,
  currency: "USDC",
  network: "stellar:testnet",
  lastUpdated: new Date().toISOString(),
};

export const mockServiceCatalog = [
  {
    id: "web-search",
    name: "Web Search",
    description: "Real-time web search via x402",
    pricePerQuery: 0.001,
    currency: "USDC",
    rateLimit: "100 queries/hour",
    status: "active",
    icon: "🔍",
  },
  {
    id: "news-feed",
    name: "News Feed",
    description: "Latest news aggregation",
    pricePerQuery: 0.002,
    currency: "USDC",
    rateLimit: "50 queries/hour",
    status: "active",
    icon: "📰",
  },
  {
    id: "market-data",
    name: "Market Data",
    description: "Real-time market prices",
    pricePerQuery: 0.005,
    currency: "USDC",
    rateLimit: "200 queries/hour",
    status: "active",
    icon: "📈",
  },
];

export const mockPaymentChallenge = {
  id: "challenge_123abc",
  query: "What are the latest developments in Stellar?",
  service: "web-search",
  estimatedCost: 0.001,
  currency: "USDC",
  dailyLimit: 0.05,
  dailyUsed: 0.012,
  perQueryLimit: 0.002,
  status: "pending",
  timestamp: new Date().toISOString(),
  expiresIn: 300, // seconds
};

export const mockContractState = {
  contractId: "CBDMK2CXQVQXVQXVQXVQXVQXVQXVQXVQXVQXVQXVQXVQXVQXVQ",
  network: "stellar:testnet",
  owner: "GMOCK7IXQVPQXSNQXVQXVQXVQXVQXVQXVQXVQXVQXVQXVQXVQ1234",
  dailyLimit: 0.05,
  perQueryLimit: 0.002,
  approvalMode: "human-review",
  isPaused: false,
  totalSpent: 0.123,
  requestsProcessed: 123,
  lastUpdated: new Date().toISOString(),
};

export const mockTransactionFeed = [
  {
    id: "tx_001",
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    type: "query_approved",
    query: "Stellar blockchain latest news",
    amount: 0.001,
    currency: "USDC",
    status: "confirmed",
    txHash: "0x1234567890abcdef",
  },
  {
    id: "tx_002",
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    type: "query_rejected",
    query: "Unauthorized service request",
    amount: 0.0,
    currency: "USDC",
    status: "rejected",
    reason: "Service not in allowlist",
    txHash: null,
  },
  {
    id: "tx_003",
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    type: "wallet_connected",
    query: null,
    amount: 0.0,
    currency: "USDC",
    status: "confirmed",
    txHash: null,
  },
  {
    id: "tx_004",
    timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
    type: "query_approved",
    query: "Bitcoin market analysis",
    amount: 0.001,
    currency: "USDC",
    status: "confirmed",
    txHash: "0xabcdef1234567890",
  },
];

export const mockPricingModels = [
  {
    id: "pay-per-query",
    name: "Pay Per Query",
    description: "Charge per individual request",
    pricePerQuery: 0.001,
    currency: "USDC",
    features: ["Real-time settlement", "No subscription", "Flexible pricing"],
    recommended: true,
  },
  {
    id: "subscription",
    name: "Subscription",
    description: "Monthly subscription with query limits",
    monthlyPrice: 9.99,
    currency: "USD",
    queriesIncluded: 10000,
    features: ["Predictable costs", "Priority support", "Custom limits"],
    recommended: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom pricing and SLA",
    monthlyPrice: "Custom",
    currency: "USD",
    queriesIncluded: "Unlimited",
    features: ["Dedicated support", "Custom contracts", "White-label options"],
    recommended: false,
  },
];

export const mockFAQ = [
  {
    question: "What is x402?",
    answer:
      "x402 is a pay-per-request HTTP protocol that enables micropayments for API calls. On Stellar, it uses USDC stablecoins for instant settlement.",
  },
  {
    question: "How much does each query cost?",
    answer:
      "Web search queries cost 0.001 USDC. Other services may have different pricing. Check the service catalog for details.",
  },
  {
    question: "Can I use this with my AI agent?",
    answer:
      "Yes! This is designed as an MCP server that works with Claude and other AI agents. See the installation guide for setup.",
  },
  {
    question: "What networks are supported?",
    answer:
      "We support Stellar testnet and mainnet. You can switch networks in the wallet connection panel.",
  },
  {
    question: "How are payments settled?",
    answer:
      "Payments are settled directly on Stellar blockchain via x402. Each transaction is recorded on-chain and visible in the transaction feed.",
  },
  {
    question: "What if I run out of USDC?",
    answer:
      "Requests will be rejected if your balance is insufficient. Top up your wallet and try again.",
  },
];

export const mockRoadmap = [
  {
    quarter: "Q2 2026",
    items: [
      "x402 payment integration",
      "Web search MCP server",
      "Wallet connection UI",
      "Basic audit logs",
    ],
    status: "in-progress",
  },
  {
    quarter: "Q3 2026",
    items: [
      "Multi-service catalog",
      "Advanced policy controls",
      "Reputation system",
      "Escrow support",
    ],
    status: "planned",
  },
  {
    quarter: "Q4 2026",
    items: [
      "Agent marketplace",
      "Cross-chain settlement",
      "Advanced analytics",
      "Mobile app",
    ],
    status: "planned",
  },
];

export const mockInstallationSteps = [
  {
    step: 1,
    title: "Install MCP Server",
    description: "Add the x402-web-search-mcp package to your project",
    code: `npm install x402-web-search-mcp`,
  },
  {
    step: 2,
    title: "Configure Wallet",
    description: "Set up your Stellar wallet and fund it with testnet USDC",
    code: `export STELLAR_WALLET_SECRET="your-secret-key"
export STELLAR_NETWORK="testnet"`,
  },
  {
    step: 3,
    title: "Initialize Server",
    description: "Start the MCP server with your configuration",
    code: `import { WebSearchMCP } from 'x402-web-search-mcp';
const server = new WebSearchMCP({
  walletSecret: process.env.STELLAR_WALLET_SECRET,
  network: process.env.STELLAR_NETWORK,
});
await server.start();`,
  },
  {
    step: 4,
    title: "Connect to Claude",
    description: "Add the server to your Claude configuration",
    code: `{
  "mcpServers": {
    "x402-web-search": {
      "command": "node",
      "args": ["./server.js"]
    }
  }
}`,
  },
];

export const mockTechSpecs = {
  network: ["Stellar Testnet", "Stellar Mainnet"],
  paymentProtocol: "x402",
  settlement: "Instant on-chain",
  stablecoin: "USDC",
  mcp: "Model Context Protocol",
  authentication: "Stellar Soroban Auth",
  rateLimit: "100-200 queries/hour (service dependent)",
  latency: "< 500ms average",
  uptime: "99.9% SLA",
};

export const mockAgentWorkflow = [
  {
    step: 1,
    title: "Agent Requests Search",
    description: "AI agent submits a query through the MCP interface",
    icon: "🤖",
  },
  {
    step: 2,
    title: "System Calculates Cost",
    description: "x402 protocol determines payment requirement",
    icon: "💰",
  },
  {
    step: 3,
    title: "Payment Challenge",
    description: "User or policy approves the payment",
    icon: "✅",
  },
  {
    step: 4,
    title: "Stellar Settlement",
    description: "Payment is confirmed on-chain",
    icon: "⛓️",
  },
  {
    step: 5,
    title: "Query Execution",
    description: "Web search is performed and results returned",
    icon: "🔍",
  },
  {
    step: 6,
    title: "Audit Recorded",
    description: "Transaction and result logged permanently",
    icon: "📋",
  },
];

export const mockResources = [
  {
    title: "Stellar Documentation",
    url: "https://developers.stellar.org",
    description: "Official Stellar developer docs",
  },
  {
    title: "x402 Protocol",
    url: "https://www.x402.org",
    description: "x402 specification and resources",
  },
  {
    title: "MCP Specification",
    url: "https://modelcontextprotocol.io",
    description: "Model Context Protocol documentation",
  },
  {
    title: "GitHub Repository",
    url: "https://github.com/stellar/x402-stellar",
    description: "Official x402 Stellar implementation",
  },
];
