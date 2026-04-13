/**
 * AUDIT — contract boundary (see also contracts/AUDIT.md)
 *
 * Indirect “contract-like” behavior today: mock `payments`, `wallet`, `search`, and static
 * `services` routers; Horizon-backed `stellar.*` reads; agent payment/receipt UI state.
 *
 * Canonical durable state: this Soroban module (`stellar-agent-market`) for registry,
 * pricing version, escrow records, settlement/receipts, and reputation counters.
 *
 * Onchain: service identity, owner, price policy fields, access mode, escrow state machine,
 * settlement rows, reputation aggregates, typed errors and events.
 *
 * Offchain: MCP search, OAuth users, Drizzle DB, LLM orchestration, full-text discovery,
 * and Stellar token custody / SAC transfers (escrow release still coordinates offchain).
 *
 * UI surfaces: dashboard + task/agent flows should show registry, price, escrow, receipts,
 * and reputation chips when `SOROBAN_AGENT_MARKET_CONTRACT_ID` is set.
 */

export const ACCESS_PUBLIC = 0;
export const ACCESS_PAID = 1;
export const ACCESS_RESTRICTED = 2;

export const STATUS_ACTIVE = 0;
export const STATUS_DISABLED = 1;

export const SETTLEMENT_PENDING = 0;
export const SETTLEMENT_COMPLETED = 1;
export const SETTLEMENT_FAILED = 2;

export const FILTER_ANY = 4294967295; // u32::MAX

/** Mirrors `ContractError` repr in `contracts/stellar-agent-market` */
export const AgentMarketContractErrorCode = {
  Unauthorized: 1,
  ServiceNotFound: 2,
  ServiceDisabled: 3,
  InvalidPrice: 4,
  InvalidAmount: 5,
  InsufficientFunds: 6,
  EscrowNotOpen: 7,
  EscrowAlreadyLocked: 8,
  EscrowAlreadyReleased: 9,
  EscrowAlreadyRefunded: 10,
  InvalidStateTransition: 11,
  ReputationTooLow: 12,
  DuplicateRegistration: 13,
  UnknownAsset: 14,
  NotInitialized: 15,
  EscrowNotFound: 16,
  SettlementNotFound: 17,
} as const;

export type AgentMarketContractErrorName = keyof typeof AgentMarketContractErrorCode;

export function agentMarketErrorNameFromCode(code: number): AgentMarketContractErrorName | "Unknown" {
  const entry = Object.entries(AgentMarketContractErrorCode).find(([, v]) => v === code);
  return (entry?.[0] as AgentMarketContractErrorName | undefined) ?? "Unknown";
}

export type AgentMarketServiceRecord = {
  service_id: number;
  owner: string;
  name: string;
  endpoint: string;
  description: string;
  price: string;
  asset: string;
  access_mode: number;
  status: number;
  price_version: number;
  created_at: string;
  updated_at: string;
};

export type AgentMarketReputationRecord = {
  completed_count: string;
  successful_settlements: string;
  refund_count: string;
  failure_count: string;
  reputation_score: string;
};

export type AgentMarketEscrowState =
  | "Open"
  | "Locked"
  | "PendingVerify"
  | "Verified"
  | "Released"
  | "Refunded";

export type AgentMarketEscrowRecord = {
  id: string;
  payer: string;
  payee: string;
  service_id: number;
  amount: string;
  asset: string;
  state: AgentMarketEscrowState;
  request_id: string;
  created_at: string;
  updated_at: string;
  tx_hash: string;
};

export type AgentMarketSettlementRecord = {
  request_id: string;
  service_id: number;
  payer: string;
  payee: string;
  amount: string;
  asset: string;
  status: number;
  ts: string;
  tx_ref: string;
};

export type AgentMarketActionReceipt = {
  service_id: number;
  amount: string;
  asset: string;
  payer: string;
  owner: string;
  settlement_status: number;
  chain_ref: string;
};
