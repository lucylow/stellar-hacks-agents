import { describe, expect, it } from "vitest";
import {
  aggregateReputation,
  chatTrustChipLabel,
  computeTrend,
  domainCredibilityFromUrl,
  onChainSuccessRateFromTx,
  rankSearchResults,
  scoreToTier,
  TIER_SCORE_STABLE_MIN,
  TIER_SCORE_TRUSTED_MIN,
  TIER_SCORE_VERIFIED_MIN,
} from "./reputationCompute";
import type { ReputationEvent } from "./reputationModel";
import type { SearchResponseWire } from "./searchContract";

function ev(partial: Omit<ReputationEvent, "id" | "at"> & { id?: string; at?: string }): ReputationEvent {
  return {
    id: partial.id ?? "x",
    at: partial.at ?? new Date().toISOString(),
    ...partial,
  } as ReputationEvent;
}

describe("scoreToTier", () => {
  it("maps verified and trusted bands", () => {
    expect(scoreToTier(TIER_SCORE_VERIFIED_MIN, false)).toBe("verified");
    expect(scoreToTier(TIER_SCORE_VERIFIED_MIN - 1, false)).toBe("trusted");
    expect(scoreToTier(TIER_SCORE_TRUSTED_MIN, false)).toBe("trusted");
    expect(scoreToTier(TIER_SCORE_STABLE_MIN, false)).toBe("stable");
    expect(scoreToTier(10, false)).toBe("new");
  });

  it("forces at_risk", () => {
    expect(scoreToTier(95, true)).toBe("at_risk");
  });
});

describe("computeTrend", () => {
  it("returns steady with few events", () => {
    expect(computeTrend([ev({ type: "task_succeeded", source: "agent_task", publicKey: null })])).toBe("steady");
  });
});

describe("aggregateReputation", () => {
  it("increases with successes", () => {
    const empty = aggregateReputation({ events: [], feedback: [], onChainSuccessRate: null });
    const good = aggregateReputation({
      events: [
        ev({ type: "task_succeeded", source: "agent_task", publicKey: null }),
        ev({ type: "task_succeeded", source: "agent_task", publicKey: null }),
        ev({ type: "search_completed", source: "search", publicKey: null, demoMode: true }),
      ],
      feedback: [],
      onChainSuccessRate: null,
    });
    expect(good.score.value).toBeGreaterThan(empty.score.value);
    expect(good.demoModeLabel).toBe("demo");
  });

  it("flags at_risk on failure burst", () => {
    const bad = aggregateReputation({
      events: [
        ev({ type: "task_failed", source: "agent_task", publicKey: null }),
        ev({ type: "task_failed", source: "agent_task", publicKey: null }),
        ev({ type: "task_failed", source: "agent_task", publicKey: null }),
      ],
      feedback: [],
      onChainSuccessRate: null,
    });
    expect(bad.score.tier).toBe("at_risk");
  });
});

describe("onChainSuccessRateFromTx", () => {
  it("returns null for empty", () => {
    expect(onChainSuccessRateFromTx([])).toBeNull();
  });
  it("counts successes", () => {
    expect(
      onChainSuccessRateFromTx([
        { id: "1", hash: "a", ledger: 1, created_at: "", source_account: "x", type: "p", successful: true },
        { id: "2", hash: "b", ledger: 2, created_at: "", source_account: "x", type: "p", successful: false },
      ])
    ).toBe(0.5);
  });
});

describe("rankSearchResults", () => {
  const response: SearchResponseWire = {
    query: "q",
    results: [
      { title: "Low", url: "https://random-blog.example/a", snippet: "x" },
      { title: "High", url: "https://developers.stellar.org/docs", snippet: "y" },
    ],
    totalResults: 2,
    executionTime: 12,
    searchMode: "mock",
  };

  it("orders stellar.org ahead of unknown host", () => {
    const ranked = rankSearchResults(response);
    expect(ranked[0].url).toContain("stellar.org");
  });
});

describe("domainCredibilityFromUrl", () => {
  it("detects stellar docs", () => {
    expect(domainCredibilityFromUrl("https://developers.stellar.org/docs")).toBe("high");
  });
});

describe("chatTrustChipLabel", () => {
  it("shows new session when empty", () => {
    const s = aggregateReputation({ events: [], feedback: [], onChainSuccessRate: null });
    expect(chatTrustChipLabel(s, 0)).toContain("New session");
  });
});
