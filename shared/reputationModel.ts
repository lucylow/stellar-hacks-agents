/**
 * First-class reputation domain model — shared by client UI and pure compute helpers.
 * Persistence today: client localStorage (see ReputationContext). Server may mirror later.
 */

export type ReputationTier = "new" | "stable" | "trusted" | "verified" | "at_risk";

/** Wallet-area session trust (behavioral, not identity verification). */
export type SessionTrustMarker = "new" | "established" | "trusted" | "verified" | "risky";

export type ReputationTrend = "improving" | "steady" | "declining";

export type ReputationSource =
  | "wallet"
  | "agent_task"
  | "search"
  | "blockchain_lookup"
  | "user_feedback"
  | "settlement"
  | "session";

export type ReputationEventType =
  | "wallet_connected"
  | "wallet_disconnected"
  | "search_completed"
  | "blockchain_lookup_completed"
  | "task_succeeded"
  | "task_failed"
  | "tool_retry"
  | "settlement_succeeded"
  | "settlement_failed"
  | "refund_issued"
  | "feedback_positive"
  | "feedback_negative"
  | "feedback_neutral";

export type ReputationEvent = {
  id: string;
  type: ReputationEventType;
  at: string;
  source: ReputationSource;
  /** Optional wallet this event is associated with (null = anonymous session). */
  publicKey: string | null;
  /** Demo vs live where relevant */
  demoMode?: boolean;
  weight?: number;
  notes?: string;
  meta?: Record<string, string | number | boolean>;
};

export type TrustSignalKind =
  | "wallet_ready"
  | "horizon_ok"
  | "search_ok"
  | "chain_evidence"
  | "task_streak"
  | "user_rating"
  | "risk_flag";

export type TrustSignal = {
  kind: TrustSignalKind;
  label: string;
  /** 0–1 strength */
  strength: number;
  detail?: string;
};

export type FeedbackEntry = {
  id: string;
  at: string;
  /** 1–5 or 0 if not used */
  stars: number;
  useful: boolean | null;
  accurate: boolean | null;
  note?: string;
  relatedMessageId?: string;
};

export type ServiceTrustProfile = {
  serviceId: string;
  label: string;
  baseTrust01: number;
  successfulUses: number;
  failedUses: number;
  lastUsedAt: string | null;
};

export type ReputationScore = {
  /** 0–100 */
  value: number;
  tier: ReputationTier;
  /** 0–1 how much history supports the score */
  confidence: number;
  trend: ReputationTrend;
};

export type ReputationSummary = {
  score: ReputationScore;
  successCount: number;
  failureCount: number;
  refundCount: number;
  retryCount: number;
  latencyAvgMs: number | null;
  /** Share of successful on-chain style ops in dashboard window (0–1), null if unknown */
  settlementSuccessRate: number | null;
  lastUpdated: string;
  signals: TrustSignal[];
  recentEvents: ReputationEvent[];
  feedbackScore01: number | null;
  demoModeLabel: "live" | "demo_mixed" | "demo";
};

export type SearchResultTrustMeta = {
  sourceTrust01: number;
  freshness01: number;
  domainCredibility: "high" | "medium" | "low";
  resultConfidence: "high" | "medium" | "low";
  usedInSuccessfulTask: boolean;
  isMock: boolean;
};
