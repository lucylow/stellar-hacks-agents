/**
 * Shared payment vocabulary for Stellar x402 / MPP-style flows.
 * Server and client use the same shapes for quotes, challenges, and receipts.
 */

export type PaymentMode = "per_request" | "prepaid_credits" | "session_streaming" | "demo_free";

/** Lifecycle for a single payable request */
export type PaymentState =
  | "none"
  | "quote"
  | "pending_auth"
  | "authorized"
  | "settled"
  | "failed"
  | "expired"
  | "refunded";

export type PaymentErrorCode =
  | "wallet_not_connected"
  | "wrong_network"
  | "auth_entry_unavailable"
  | "insufficient_balance"
  | "quote_expired"
  | "replay_detected"
  | "idempotency_conflict"
  | "challenge_not_found"
  | "session_not_found"
  | "session_cap_exceeded"
  | "insufficient_credits"
  | "settlement_failed"
  | "execution_failed";

export type StellarPaymentNetwork = "mainnet" | "testnet";

export type PaymentAsset = {
  code: string;
  issuer?: string;
};

export type PaymentQuote = {
  id: string;
  mode: PaymentMode;
  status: PaymentState;
  amount: number;
  asset: PaymentAsset;
  payer: string | null;
  payee: string;
  serviceId: string;
  requestId: string;
  sessionId?: string;
  network: StellarPaymentNetwork;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  replayKey: string;
  idempotencyKey: string;
  /** Human-readable: what the user is paying for */
  serviceDescription: string;
  /** Wallet must support Soroban auth-entry signing for real x402 on Stellar */
  authEntrySigningRequired: boolean;
  instructions: string;
};

export type PaymentChallenge = {
  challengeId: string;
  quoteId: string;
  quote: PaymentQuote;
  validUntil: string;
};

export type PaymentAuthorization = {
  challengeId: string;
  payer: string;
  /** Simulated or real signed auth entry XDR (base64), when available */
  signedAuthEntryXdr?: string;
  authorizedAt: string;
  replayKey: string;
};

export type PaymentSettlement = {
  id: string;
  requestId: string;
  serviceId: string;
  payer: string;
  payee: string;
  amount: number;
  asset: PaymentAsset;
  mode: PaymentMode;
  status: "pending" | "confirmed" | "failed" | "rolled_back";
  settledAt: string;
  /** Simulated hash or on-chain tx / commitment id */
  transactionOrCommitmentRef: string;
  receiptHash: string;
  sessionId?: string;
};

export type PaymentReceipt = {
  id: string;
  settlementId: string;
  summary: string;
  unlockedDescription: string;
  transactionOrCommitmentRef: string;
  mode: PaymentMode;
  requestCompleted: boolean;
  createdAt: string;
};

export type PaymentSession = {
  id: string;
  funder: string;
  payee: string;
  network: StellarPaymentNetwork;
  /** One-way channel: cumulative authorized off-chain usage */
  cumulativeCommitted: number;
  cap: number;
  asset: PaymentAsset;
  openedAt: string;
  updatedAt: string;
  status: "open" | "reconciling" | "closed";
  lastReconciliationAt?: string;
};

export type PaymentPolicy = {
  serviceId: string;
  defaultMode: PaymentMode;
  perRequestAmount: number;
  asset: PaymentAsset;
  payee: string;
  /** Minimum streaming session deposit (demo units) */
  sessionMinCap: number;
};

export type PaymentEventType =
  | "quote_created"
  | "challenge_issued"
  | "wallet_capability_checked"
  | "auth_entry_verified"
  | "payment_authorized"
  | "settlement_confirmed"
  | "receipt_issued"
  | "refund_issued"
  | "session_opened"
  | "session_reconciled"
  | "session_closed"
  | "credit_top_up"
  | "credit_consumed"
  | "credit_restored"
  | "execution_failed_rollback";

export type PaymentEvent = {
  id: string;
  type: PaymentEventType;
  at: string;
  mode?: PaymentMode;
  challengeId?: string;
  sessionId?: string;
  payer?: string;
  detail: string;
  meta?: Record<string, unknown>;
};

/** Input to the mode router (client may pre-fill wallet capabilities) */
export type PaymentRouteInput = {
  requestType: "search" | "blockchain_lookup" | "chat_tools" | "premium_tool" | "session" | "unknown";
  estimatedCost: number;
  expectedCallCount: number;
  streamingOrBurst: boolean;
  userPreferredMode?: PaymentMode | "auto";
  /** Demo / hackathon: skip real charges */
  demoMode: boolean;
  walletConnected: boolean;
  walletSupportsAuthEntry: boolean;
  /** Remaining prepaid credits (server or client cached) */
  creditBalance: number;
  /** Active streaming session id, if any */
  activeSessionId?: string;
};

export type PaymentRouteResult = {
  mode: PaymentMode;
  reason: string;
  fallbackFrom?: PaymentMode;
};
