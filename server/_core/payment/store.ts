import { nanoid } from "nanoid";
import type {
  PaymentAsset,
  PaymentMode,
  PaymentQuote,
  PaymentSettlement,
  StellarPaymentNetwork,
} from "@shared/paymentTypes";
import { createHash } from "crypto";

export type StoredChallenge = {
  challengeId: string;
  quote: PaymentQuote;
  payerHint: string | null;
  status: "pending" | "settled" | "expired" | "failed";
  settlementId?: string;
  /** Once settled, same idempotency returns same outcome */
  consumedIdempotencyKey: string;
  usedReplayKey: boolean;
};

export type CreditLedgerRow = {
  wallet: string;
  delta: number;
  reason: string;
  at: string;
};

export type HistoryRow = {
  id: string;
  type: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  transactionHash: string;
  timestamp: Date;
  mode: PaymentMode;
};

export type SessionRecord = {
  id: string;
  funder: string;
  payee: string;
  network: StellarPaymentNetwork;
  cap: number;
  cumulativeCommitted: number;
  asset: PaymentAsset;
  openedAt: string;
  updatedAt: string;
  status: "open" | "reconciling" | "closed";
};

export class InMemoryPaymentStore {
  readonly challenges = new Map<string, StoredChallenge>();
  readonly idempotencyToChallenge = new Map<string, string>();
  readonly settledReplayKeys = new Set<string>();
  readonly credits = new Map<string, number>();
  readonly sessions = new Map<string, SessionRecord>();
  readonly settlements: PaymentSettlement[] = [];
  readonly history: HistoryRow[] = [];
  readonly creditLedger: CreditLedgerRow[] = [];

  rememberIdempotency(key: string, challengeId: string): void {
    this.idempotencyToChallenge.set(key, challengeId);
  }

  getByIdempotency(key: string): StoredChallenge | undefined {
    const cid = this.idempotencyToChallenge.get(key);
    if (!cid) return undefined;
    return this.challenges.get(cid);
  }

  consumeReplayKey(replayKey: string): boolean {
    if (this.settledReplayKeys.has(replayKey)) return false;
    this.settledReplayKeys.add(replayKey);
    return true;
  }

  releaseReplayKey(replayKey: string): void {
    this.settledReplayKeys.delete(replayKey);
  }

  addHistory(row: HistoryRow): void {
    this.history.unshift(row);
    if (this.history.length > 200) this.history.length = 200;
  }

  receiptHash(parts: string[]): string {
    return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 32);
  }

  newIds(): { quoteId: string; challengeId: string; replayKey: string } {
    return {
      quoteId: `q_${nanoid(12)}`,
      challengeId: `ch_${nanoid(14)}`,
      replayKey: `rp_${nanoid(16)}`,
    };
  }
}

let singleton: InMemoryPaymentStore | null = null;

export function getPaymentStore(): InMemoryPaymentStore {
  if (!singleton) singleton = new InMemoryPaymentStore();
  return singleton;
}

/** Vitest-only: isolate cases that mutate the in-memory ledger */
export function resetPaymentStoreForTests(): void {
  singleton = new InMemoryPaymentStore();
}
