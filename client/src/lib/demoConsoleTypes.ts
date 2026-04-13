/**
 * Frontend-only model for the agentic search + x402 demo console.
 * Aligns with shared vocabulary where possible; mock/live swap stays at UI boundaries.
 */

export type DemoRuntimeMode = "mock" | "testnet";

export type ApprovalMode = "explicit" | "auto_under_cap";

export type PaymentPhase =
  | "idle"
  | "quoted"
  | "awaiting_approval"
  | "denied"
  | "settling"
  | "settled"
  | "error";

export type ResultPhase = "empty" | "loading" | "ready" | "error";

export type AuditSeverity = "success" | "pending" | "warning" | "error" | "info";

export type PayTier = "free" | "paid" | "paid_approval";

export type PolicyState = {
  spendCapUsdc: number;
  approvalMode: ApprovalMode;
  allowlistOnly: boolean;
  automationPaused: boolean;
  humanOverride: boolean;
};

export type McpServiceRecord = {
  id: string;
  name: string;
  description: string;
  mcpTool: string;
  endpointHint: string;
  pricePerQueryUsdc: number;
  currency: string;
  rateLimit: string;
  availability: "up" | "degraded" | "down";
  reputationNote: string;
  payTier: PayTier;
  requiresHumanApproval: boolean;
  policyTags: string[];
};

export type PaymentQuote = {
  amountUsdc: number;
  currency: string;
  serviceId: string;
  networkLabel: string;
  payToAddress: string;
  requestId: string;
  expiresAtIso: string;
};

export type SearchRequestSnapshot = {
  query: string;
  serviceId: string;
  mode: DemoRuntimeMode;
};
