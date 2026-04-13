/**
 * Shared vocabulary for wallet, agent workflow, and demo/live labeling.
 * Used by client UI; server responses should align where noted.
 */

export type WalletStatus =
  | "idle"
  | "detecting"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

/** High-level agent activity for global UI / task sync */
export type AgentActivityState =
  | "idle"
  | "thinking"
  | "planning"
  | "tool_selection"
  | "calling_tool"
  | "waiting_wallet"
  | "waiting_search"
  | "looking_up_blockchain"
  | "payment_required"
  | "payment_authorizing"
  | "settling"
  | "streaming"
  | "rendering_result"
  | "error";

export type TaskPanelStage =
  | "queued"
  | "planning"
  | "wallet_needed"
  | "connecting_wallet"
  | "payment_required"
  | "payment_approval_pending"
  | "settling"
  | "searching"
  | "fetching_account"
  | "tool_execution"
  | "synthesizing"
  | "complete"
  | "failed";

export type SearchResultsMode = "mock" | "live";

export type ChatMessageRole = "user" | "assistant" | "tool" | "system";

export type AgentTimelineEventType =
  | "agent_request_started"
  | "plan_ready"
  | "tool_selected"
  | "tool_called"
  | "tool_returned"
  | "wallet_required"
  | "wallet_connected"
  | "payment_required"
  | "payment_authorized"
  | "payment_settling"
  | "payment_settled"
  | "result_rendered"
  | "task_completed"
  | "task_failed";

export type AgentTimelineEvent = {
  id: string;
  type: AgentTimelineEventType;
  label: string;
  detail?: string;
  at: string;
};

/** Wire format aligned with `agentRouter.chat` toolCalls */
export type AgentToolCallWire = {
  id: string;
  type: "search" | "blockchain_lookup" | "balance_check";
  name: string;
  input: Record<string, unknown>;
  status: "pending" | "completed" | "failed";
  result?: unknown;
  error?: string;
};

export type SearchResultCard = {
  title: string;
  url: string;
  snippet: string;
  source?: string;
  relevance?: "high" | "medium" | "low";
};

export type StellarTxRecord = {
  id: string;
  hash: string;
  ledger: number;
  created_at: string;
  source_account: string;
  type: string;
  successful: boolean;
};

export type StellarOperationRecord = {
  id: string;
  type: string;
  created_at: string;
  source_account: string;
  transaction_hash: string;
};

/** Client-visible routing hint for chat ↔ task panel sync */
export type AgentToolRoute =
  | "search"
  | "blockchain_lookup"
  | "wallet_check"
  | "mixed"
  | "general"
  | "payment";

/** Record of a demo / simulated x402-style payment shown in chat + history */
export type AgentPaymentReceipt = {
  id: string;
  challengeId: string;
  queryId: string;
  amount: number;
  currency: string;
  transactionHash: string;
  status: "simulated" | "confirmed";
  promptSnippet: string;
  networkLabel: string;
  settledAt: string;
  unlockedSummary: string;
};

export type TaskProgressSnapshot = {
  id: string;
  title: string;
  stage: TaskPanelStage;
  currentAction: string;
  startedAt: string;
  completedAt?: string;
  progress01: number;
  resultSummary?: string;
  errorMessage?: string;
  /** Heuristic from user text before the model responds */
  predictedRoute?: AgentToolRoute;
  /** Derived from completed tool calls when available */
  resolvedRoute?: AgentToolRoute;
  planLines?: string[];
  needsWallet?: boolean;
  /** When this turn used the x402 payment path (server demo) */
  usedPaymentFlow?: boolean;
};
