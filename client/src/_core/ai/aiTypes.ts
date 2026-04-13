import type { AgentToolCallWire, AgentToolRoute, ChatMessageRole } from "@shared/appConnectionModel";

/** Client-side vocabulary for agent UX (aligns with workflow context events). */
export type AiWorkflowEventType =
  | "user_message_submitted"
  | "agent_plan_created"
  | "agent_response_started"
  | "tool_requested"
  | "tool_completed"
  | "tool_failed"
  | "wallet_needed"
  | "wallet_connected"
  | "payment_required"
  | "payment_authorized"
  | "payment_settled"
  | "result_ready"
  | "task_started"
  | "task_progress_updated"
  | "task_completed"
  | "task_failed";

export type AiAnswerMode = "synthesis" | "direct" | "mixed";

export type AiConfidenceLevel = "high" | "medium" | "low";

export type BlockchainLookupQuality = "verified" | "partial" | "unavailable";

export type ChatQualitySignals = {
  searchConfidence?: AiConfidenceLevel;
  blockchainQuality?: BlockchainLookupQuality;
  answerMode: AiAnswerMode;
  sourceCount: number;
  usedSearch: boolean;
  usedBlockchain: boolean;
  demoSearch: boolean;
};

export type PersistedChatMessage = {
  id: string;
  role: ChatMessageRole | "plan" | "completion";
  content: string;
  timestamp: Date;
  toolCalls?: AgentToolCallWire[];
  demoLabel?: string;
  /** Tool / search result cards */
  synthesisIntro?: string;
  quality?: ChatQualitySignals;
  toolRoute?: AgentToolRoute;
  /** Collapsible tool output */
  collapsible?: boolean;
  collapsed?: boolean;
};

export function emptyQualitySignals(): ChatQualitySignals {
  return {
    answerMode: "direct",
    sourceCount: 0,
    usedSearch: false,
    usedBlockchain: false,
    demoSearch: false,
  };
}
