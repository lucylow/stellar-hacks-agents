import type { McpServiceRecord } from "@/lib/demoConsoleTypes";

/** Canonical mock payee for x402-style challenges in the demo UI. */
export const DEMO_X402_PAY_TO = "GDMCK2CXQVQXVQXVQXVQXVQXVQXVQXVQXVQXVQXVQXVQXVQXVQXVQ";

export const MCP_SERVICE_CATALOG: McpServiceRecord[] = [
  {
    id: "web-search",
    name: "Web Search",
    description: "Structured web retrieval exposed to agents via MCP. Estimate before execution; settlement is explicit in live mode.",
    mcpTool: "search.web",
    endpointHint: "mcp://stellar-hacks/search",
    pricePerQueryUsdc: 0.001,
    currency: "USDC",
    rateLimit: "100 queries / hour",
    availability: "up",
    reputationNote: "High — default catalog tool",
    payTier: "paid_approval",
    requiresHumanApproval: true,
    policyTags: ["x402", "search", "paid"],
  },
  {
    id: "news-feed",
    name: "News Feed",
    description: "Headline aggregation for agents. Priced per request with the same approval path as search.",
    mcpTool: "search.news",
    endpointHint: "mcp://stellar-hacks/news",
    pricePerQueryUsdc: 0.002,
    currency: "USDC",
    rateLimit: "50 queries / hour",
    availability: "up",
    reputationNote: "Medium — narrower corpus",
    payTier: "paid_approval",
    requiresHumanApproval: true,
    policyTags: ["x402", "news", "paid"],
  },
  {
    id: "horizon-lookup",
    name: "Horizon metadata",
    description: "Read-only Stellar account and ledger context for grounding answers (no spend in this demo path).",
    mcpTool: "stellar.horizon.meta",
    endpointHint: "internal://horizon",
    pricePerQueryUsdc: 0,
    currency: "USDC",
    rateLimit: "Soft cap — wallet gated",
    availability: "degraded",
    reputationNote: "Trusted — read-only",
    payTier: "free",
    requiresHumanApproval: false,
    policyTags: ["stellar", "read_only", "free"],
  },
];

export const DEFAULT_SERVICE_ID = "web-search";
