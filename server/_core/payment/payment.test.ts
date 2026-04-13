import { describe, it, expect, beforeEach } from "vitest";
import { selectPaymentMode } from "./routing";
import { evaluateWalletReadiness } from "./middleware";
import { buildPaymentQuote } from "./quotes";
import { settleChallenge } from "./settlement";
import { getPaymentStore, resetPaymentStoreForTests } from "./store";
import { topUpCredits } from "./credits";
import { openPaymentSession, commitSessionUsage, closePaymentSession } from "./session";

beforeEach(() => {
  resetPaymentStoreForTests();
});

describe("selectPaymentMode", () => {
  it("returns demo_free when demoMode", () => {
    const r = selectPaymentMode({
      requestType: "search",
      estimatedCost: 0.001,
      expectedCallCount: 1,
      streamingOrBurst: false,
      demoMode: true,
      walletConnected: true,
      walletSupportsAuthEntry: true,
      creditBalance: 0,
    });
    expect(r.mode).toBe("demo_free");
  });

  it("prefers prepaid when balance covers cost and multiple calls", () => {
    const r = selectPaymentMode({
      requestType: "search",
      estimatedCost: 0.01,
      expectedCallCount: 4,
      streamingOrBurst: false,
      demoMode: false,
      walletConnected: true,
      walletSupportsAuthEntry: true,
      creditBalance: 1,
    });
    expect(r.mode).toBe("prepaid_credits");
  });

  it("falls back from session preference when auth entry unsupported", () => {
    const r = selectPaymentMode({
      requestType: "chat_tools",
      estimatedCost: 0.001,
      expectedCallCount: 1,
      streamingOrBurst: false,
      userPreferredMode: "session_streaming",
      demoMode: false,
      walletConnected: true,
      walletSupportsAuthEntry: false,
      creditBalance: 0,
    });
    expect(r.mode).toBe("per_request");
    expect(r.fallbackFrom).toBe("session_streaming");
  });
});

describe("evaluateWalletReadiness", () => {
  it("blocks when auth entry required but unavailable", () => {
    const r = evaluateWalletReadiness({
      walletConnected: true,
      networkMatchesApp: true,
      authEntrySigningAvailable: false,
      requireAuthEntry: true,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("auth_entry_unavailable");
  });

  it("allows prepaid path when auth entry not required", () => {
    const r = evaluateWalletReadiness({
      walletConnected: true,
      networkMatchesApp: true,
      authEntrySigningAvailable: false,
      requireAuthEntry: false,
    });
    expect(r.ok).toBe(true);
  });
});

describe("quotes + settlement", () => {
  it("creates quote and settles with replay + idempotency", () => {
    const store = getPaymentStore();
    const { challenge } = buildPaymentQuote(store, {
      serviceId: "test.svc",
      requestId: "req1",
      idempotencyKey: "idem-a",
      payer: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      network: "testnet",
      mode: "per_request",
      payee: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      serviceDescription: "unit test",
      authEntrySigningRequired: true,
    });
    const out = settleChallenge({
      challengeId: challenge.challengeId,
      payer: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      replayKey: challenge.quote.replayKey,
      idempotencyKey: challenge.quote.idempotencyKey,
    });
    expect(out.transactionHash.length).toBeGreaterThan(4);
    const again = settleChallenge({
      challengeId: challenge.challengeId,
      payer: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      replayKey: challenge.quote.replayKey,
      idempotencyKey: challenge.quote.idempotencyKey,
    });
    expect(again.transactionHash).toBe(out.transactionHash);
  });

  it("deducts prepaid credits on settle", () => {
    const store = getPaymentStore();
    topUpCredits("G123", 10);
    const { challenge } = buildPaymentQuote(store, {
      serviceId: "test.svc",
      requestId: "req2",
      idempotencyKey: "idem-b",
      payer: "G123",
      network: "testnet",
      mode: "prepaid_credits",
      amount: 2,
      payee: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      serviceDescription: "credit debit",
      authEntrySigningRequired: false,
    });
    settleChallenge({
      challengeId: challenge.challengeId,
      payer: "G123",
      replayKey: challenge.quote.replayKey,
      idempotencyKey: challenge.quote.idempotencyKey,
    });
    expect(store.credits.get("G123")).toBe(8);
  });
});

describe("session channel", () => {
  it("commits cumulative usage under cap", () => {
    const s = openPaymentSession({
      funder: "GFUND",
      payee: "GPAY",
      network: "testnet",
      depositAmount: 0.1,
      asset: { code: "USDC" },
    });
    const u1 = commitSessionUsage(s.id, 0.03);
    expect(u1.cumulativeCommitted).toBe(0.03);
    const u2 = commitSessionUsage(s.id, 0.04);
    expect(u2.cumulativeCommitted).toBe(0.07);
    const closed = closePaymentSession(s.id);
    expect(closed.status).toBe("closed");
  });
});
