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
  | "calling_tool"
  | "waiting_wallet"
  | "waiting_search"
  | "rendering_result"
  | "error";

export type TaskPanelStage =
  | "queued"
  | "wallet_needed"
  | "connecting_wallet"
  | "searching"
  | "fetching_account"
  | "complete"
  | "failed";

export type SearchResultsMode = "mock" | "live";

export type ChatMessageRole = "user" | "assistant" | "tool" | "system";

export type AgentTimelineEventType =
  | "agent_request_started"
  | "tool_called"
  | "tool_returned"
  | "wallet_required"
  | "wallet_connected"
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
};
