import type { SearchResultWire, SearchResponseWire } from "./searchContract";
import type {
  FeedbackEntry,
  ReputationEvent,
  ReputationEventType,
  ReputationScore,
  ReputationSummary,
  ReputationTier,
  ReputationTrend,
  SearchResultTrustMeta,
  SessionTrustMarker,
  TrustSignal,
} from "./reputationModel";
import type { StellarOperationRecord, StellarTxRecord } from "./appConnectionModel";

/**
 * Explicit score bands (0–100). `at_risk` is never chosen from score alone — only when `forceAtRisk`
 * (recent failure burst) so the UI can show both a low numeric score and a clear risk state.
 */
export const TIER_SCORE_VERIFIED_MIN = 78;
export const TIER_SCORE_TRUSTED_MIN = 60;
export const TIER_SCORE_STABLE_MIN = 40;

export const EVENT_WEIGHTS: Readonly<Record<ReputationEventType, number>> = {
  wallet_connected: 4,
  wallet_disconnected: 0,
  search_completed: 2,
  blockchain_lookup_completed: 2,
  task_succeeded: 5,
  task_failed: -6,
  tool_retry: -2,
  settlement_succeeded: 4,
  settlement_failed: -8,
  refund_issued: -4,
  feedback_positive: 3,
  feedback_negative: -4,
  feedback_neutral: 0,
};

const MAX_EVENTS_FOR_SCORE = 80;
const TREND_WINDOW = 5;

export function scoreToTier(score: number, forceAtRisk: boolean): ReputationTier {
  if (forceAtRisk) return "at_risk";
  const s = clamp(score, 0, 100);
  if (s >= TIER_SCORE_VERIFIED_MIN) return "verified";
  if (s >= TIER_SCORE_TRUSTED_MIN) return "trusted";
  if (s >= TIER_SCORE_STABLE_MIN) return "stable";
  return "new";
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function eventWeight(ev: ReputationEvent): number {
  if (typeof ev.weight === "number") return ev.weight;
  return EVENT_WEIGHTS[ev.type] ?? 0;
}

export function computeTrend(events: ReputationEvent[]): ReputationTrend {
  const scored = [...events]
    .filter((e) => EVENT_WEIGHTS[e.type] !== 0 || typeof e.weight === "number")
    .slice(0, MAX_EVENTS_FOR_SCORE)
    .map((e) => eventWeight(e));
  if (scored.length < 4) return "steady";
  const recent = scored.slice(0, TREND_WINDOW);
  const older = scored.slice(TREND_WINDOW, TREND_WINDOW * 2);
  if (!older.length) return "steady";
  const r = recent.reduce((a, b) => a + b, 0) / recent.length;
  const o = older.reduce((a, b) => a + b, 0) / older.length;
  if (r > o + 0.8) return "improving";
  if (r < o - 0.8) return "declining";
  return "steady";
}

export type AggregateReputationInput = {
  events: ReputationEvent[];
  feedback: FeedbackEntry[];
  /** Horizon-derived, optional */
  onChainSuccessRate: number | null;
  nowIso?: string;
};

export function aggregateReputation(input: AggregateReputationInput): ReputationSummary {
  const now = input.nowIso ?? new Date().toISOString();
  const slice = input.events.slice(0, MAX_EVENTS_FOR_SCORE);

  let successCount = 0;
  let failureCount = 0;
  let refundCount = 0;
  let retryCount = 0;
  let latencySum = 0;
  let latencyN = 0;

  for (const e of slice) {
    if (e.type === "task_succeeded" || e.type === "settlement_succeeded") successCount += 1;
    if (e.type === "task_failed" || e.type === "settlement_failed") failureCount += 1;
    if (e.type === "refund_issued") refundCount += 1;
    if (e.type === "tool_retry") retryCount += 1;
    const lat = e.meta?.latencyMs;
    if (typeof lat === "number" && Number.isFinite(lat)) {
      latencySum += lat;
      latencyN += 1;
    }
  }

  const rawSum = slice.reduce((acc, e) => acc + eventWeight(e), 0);
  /** Baseline ~32 so empty history reads as "new" tier, not mid-stable. */
  const bounded = clamp(32 + rawSum * 1.12, 0, 100);
  const historyDepth = Math.min(1, slice.length / 24);
  const feedback01 = summarizeFeedback(input.feedback);
  const feedbackBoost = feedback01 == null ? 0 : (feedback01 - 0.5) * 18;
  let value = clamp(bounded + feedbackBoost, 0, 100);

  const recentFails = slice.slice(0, 8).filter((e) => e.type === "task_failed" || e.type === "settlement_failed").length;
  const forceAtRisk = recentFails >= 3 || (failureCount > 0 && failureCount >= successCount + 4 && successCount < 3);

  if (input.onChainSuccessRate != null && Number.isFinite(input.onChainSuccessRate)) {
    const chainAdj = (input.onChainSuccessRate - 0.85) * 40;
    value = clamp(value + chainAdj, 0, 100);
  }

  const trend = computeTrend(slice);
  const confidence = clamp(0.12 + historyDepth * 0.55 + (input.onChainSuccessRate != null ? 0.15 : 0), 0, 1);

  const tier = scoreToTier(value, forceAtRisk);
  const score: ReputationScore = { value: Math.round(value), tier, confidence, trend };

  const signals = buildTrustSignals({
    score,
    successCount,
    failureCount,
    slice,
    onChain: input.onChainSuccessRate,
  });

  const demoModeLabel = deriveDemoLabel(slice);

  return {
    score,
    successCount,
    failureCount,
    refundCount,
    retryCount,
    latencyAvgMs: latencyN ? Math.round(latencySum / latencyN) : null,
    settlementSuccessRate: input.onChainSuccessRate,
    lastUpdated: now,
    signals,
    recentEvents: slice.slice(0, 12),
    feedbackScore01: feedback01,
    demoModeLabel,
  };
}

function deriveDemoLabel(events: ReputationEvent[]): ReputationSummary["demoModeLabel"] {
  const hasDemo = events.some((e) => e.demoMode === true);
  const hasLive = events.some((e) => e.demoMode === false);
  if (hasDemo && hasLive) return "demo_mixed";
  if (hasDemo) return "demo";
  return "live";
}

function summarizeFeedback(entries: FeedbackEntry[]): number | null {
  if (!entries.length) return null;
  const recent = entries.slice(0, 20);
  let sum = 0;
  let n = 0;
  for (const f of recent) {
    if (f.stars > 0) {
      sum += (f.stars - 1) / 4;
      n += 1;
    } else if (f.useful === true) {
      sum += 1;
      n += 1;
    } else if (f.useful === false) {
      sum += 0;
      n += 1;
    }
  }
  if (!n) return null;
  return clamp(sum / n, 0, 1);
}

function buildTrustSignals(args: {
  score: ReputationScore;
  successCount: number;
  failureCount: number;
  slice: ReputationEvent[];
  onChain: number | null;
}): TrustSignal[] {
  const out: TrustSignal[] = [];
  const walletHits = args.slice.filter((e) => e.type === "wallet_connected").length;
  if (walletHits > 0) {
    out.push({
      kind: "wallet_ready",
      label: "Wallet sessions observed",
      strength: clamp(0.35 + Math.min(0.4, walletHits * 0.08), 0, 1),
      detail: `${walletHits} connect signal(s) in recent history`,
    });
  }
  const searchHits = args.slice.filter((e) => e.type === "search_completed").length;
  if (searchHits > 0) {
    out.push({
      kind: "search_ok",
      label: "Search completions",
      strength: clamp(0.25 + Math.min(0.45, searchHits * 0.05), 0, 1),
      detail: `${searchHits} search runs`,
    });
  }
  const chainHits = args.slice.filter((e) => e.type === "blockchain_lookup_completed").length;
  if (chainHits > 0) {
    out.push({
      kind: "chain_evidence",
      label: "On-chain lookups",
      strength: clamp(0.3 + Math.min(0.4, chainHits * 0.06), 0, 1),
      detail: `${chainHits} blockchain tool completions`,
    });
  }
  if (args.successCount >= 3) {
    out.push({
      kind: "task_streak",
      label: "Task success history",
      strength: clamp(0.4 + Math.min(0.35, (args.successCount - 3) * 0.04), 0, 1),
      detail: `${args.successCount} successes vs ${args.failureCount} failures`,
    });
  }
  if (args.onChain != null) {
    out.push({
      kind: "horizon_ok",
      label: "Ledger activity reliability",
      strength: clamp(args.onChain, 0, 1),
      detail: `${Math.round(args.onChain * 100)}% successful txs in loaded window`,
    });
  }
  if (args.score.tier === "at_risk" || args.failureCount > args.successCount + 2) {
    out.push({
      kind: "risk_flag",
      label: "Elevated failure signal",
      strength: 0.9,
      detail: "Recent failures outweigh successes — verify prompts and network",
    });
  }
  return out;
}

export function onChainSuccessRateFromTx(transactions: StellarTxRecord[]): number | null {
  if (!transactions.length) return null;
  const ok = transactions.filter((t) => t.successful).length;
  return ok / transactions.length;
}

export function accountActivityTrendFromOps(ops: StellarOperationRecord[]): "busy" | "quiet" | "unknown" {
  if (ops.length < 2) return "unknown";
  const newest = new Date(ops[0].created_at).getTime();
  const oldest = new Date(ops[ops.length - 1].created_at).getTime();
  const spanDays = (newest - oldest) / (86400 * 1000);
  if (spanDays < 2 && ops.length >= 4) return "busy";
  if (spanDays > 14) return "quiet";
  return "unknown";
}

/** Map URL host to coarse domain credibility (deterministic heuristic). */
export function domainCredibilityFromUrl(url: string): "high" | "medium" | "low" {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return "low";
  }
  const trusted = ["stellar.org", "developers.stellar.org", "horizon", "sdf.org"];
  if (trusted.some((t) => host.includes(t))) return "high";
  if (host.endsWith(".gov") || host.endsWith(".edu")) return "high";
  if (host.includes("github.com") || host.includes("readthedocs")) return "medium";
  return "medium";
}

export function buildSearchResultTrustMeta(
  r: SearchResultWire,
  index: number,
  total: number,
  response: SearchResponseWire,
  options?: { usedInSuccessfulTask?: boolean }
): SearchResultTrustMeta {
  const isMock = response.searchMode === "mock";
  const cred = domainCredibilityFromUrl(r.url);
  const sourceTrust01 =
    cred === "high" ? 0.88 : cred === "medium" ? (isMock ? 0.55 : 0.72) : 0.4;
  const freshness01 = isMock ? 0.45 : clamp(0.65 + (total - index) / (total * 5), 0, 1);
  const rel =
    index === 0 ? "high" : index < Math.min(3, total) ? "medium" : "low";
  return {
    sourceTrust01,
    freshness01,
    domainCredibility: cred,
    resultConfidence: rel,
    usedInSuccessfulTask: Boolean(options?.usedInSuccessfulTask),
    isMock,
  };
}

export type RankableSearchResult = SearchResultWire & {
  trust: SearchResultTrustMeta;
  relevanceRank: number;
};

export function rankSearchResults(
  response: SearchResponseWire,
  options?: { priorSuccessUrlSet?: Set<string> }
): RankableSearchResult[] {
  const total = response.results.length || 1;
  const prior = options?.priorSuccessUrlSet ?? new Set<string>();
  const enriched = response.results.map((r, index) => {
    const used = prior.has(r.url);
    const trust = buildSearchResultTrustMeta(r, index, total, response, { usedInSuccessfulTask: used });
    return {
      ...r,
      trust,
      relevanceRank: index,
    };
  });
  return enriched.sort((a, b) => {
    const score = (x: RankableSearchResult) =>
      x.relevanceRank * 2 -
      x.trust.sourceTrust01 * 30 -
      x.trust.freshness01 * 12 +
      (x.trust.usedInSuccessfulTask ? 8 : 0) -
      (x.trust.isMock ? 3 : 0) -
      (x.trust.domainCredibility === "high" ? 5 : 0);
    return score(a) - score(b);
  });
}

export function chatTrustChipLabel(summary: ReputationSummary, sourceCount: number): string {
  const { tier, confidence } = summary.score;
  if (summary.successCount === 0 && summary.recentEvents.length < 2) {
    return sourceCount > 0 ? "New session · evidence gathering" : "New session";
  }
  if (confidence < 0.35) return "Low evidence";
  if (tier === "verified" && confidence >= 0.65) return "High confidence";
  if (tier === "trusted" || tier === "verified") return "Strong trust";
  if (tier === "stable") return "Medium trust";
  if (tier === "at_risk") return "Caution · elevated failures";
  return "Building trust";
}

/** Build a simple score trail for sparklines (chronological order, cumulative weighted). */
export function approximateScoreTrail(events: ReputationEvent[]): number[] {
  const chronological = [...events].reverse();
  let acc = 32;
  const out: number[] = [];
  for (const e of chronological) {
    acc += eventWeight(e);
    out.push(clamp(acc, 0, 100));
  }
  return out.slice(-14);
}

export function reputationNarrativeForLLM(summary: ReputationSummary): string {
  const s = summary.score;
  return [
    `Reputation tier: ${s.trend} trend, score ${s.value}/100 (${s.tier}), confidence ${Math.round(s.confidence * 100)}%.`,
    `Tasks: ${summary.successCount} ok / ${summary.failureCount} failed; refunds ${summary.refundCount}.`,
    `Mode label: ${summary.demoModeLabel}.`,
  ].join(" ");
}

export function sessionTrustMarker(args: {
  isConnected: boolean;
  refreshError: string | null;
  accountLoaded: boolean;
  summary: ReputationSummary | null;
  firstSeenAtIso: string | null;
}): SessionTrustMarker {
  if (!args.isConnected) return "new";
  if (args.refreshError) return "risky";
  if (!args.accountLoaded) return "new";
  const tier = args.summary?.score.tier;
  if (tier === "verified") return "verified";
  if (tier === "trusted") return "trusted";
  if (args.firstSeenAtIso) {
    const days = (Date.now() - new Date(args.firstSeenAtIso).getTime()) / 86400000;
    if (days >= 1 && args.summary && args.summary.successCount + args.summary.failureCount >= 3) return "established";
  }
  if (args.summary && args.summary.successCount >= 2) return "established";
  return "new";
}
