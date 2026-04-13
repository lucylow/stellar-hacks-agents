import { Badge } from "@/components/ui/badge";
import type { AgentToolCallWire } from "@shared/appConnectionModel";
import type { SearchResponseWire } from "@shared/searchContract";
import type { AiConfidenceLevel } from "@/_core/ai/aiTypes";
import { rankSearchResults, type RankableSearchResult } from "@shared/reputationCompute";
import { Database, Search, Sparkles } from "lucide-react";
import { CategoryChip } from "@/components/app/uiPrimitives";
import { useMemo } from "react";

function relevanceFromIndex(i: number, total: number): AiConfidenceLevel {
  if (i === 0) return "high";
  if (i < Math.min(3, total)) return "medium";
  return "low";
}

function RelevanceDot({ level }: { level: AiConfidenceLevel }) {
  const color =
    level === "high"
      ? "bg-emerald-400"
      : level === "medium"
        ? "bg-amber-400"
        : "bg-slate-500";
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400" title={`Relevance: ${level}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} aria-hidden />
      {level}
    </span>
  );
}

export function SearchAgentResultCard({
  data,
  synthesisIntro,
  usedByAgent,
  priorSuccessUrlSet,
}: {
  data: SearchResponseWire;
  synthesisIntro?: string;
  usedByAgent?: boolean;
  priorSuccessUrlSet?: Set<string>;
}) {
  const isDemo = data.searchMode === "mock";
  const ranked = useMemo(
    () => rankSearchResults(data, { priorSuccessUrlSet }),
    [data, priorSuccessUrlSet]
  );
  const direct = ranked[0];
  const supporting = ranked.slice(1, 4);
  const related = ranked.slice(4, 8);

  return (
    <div className="space-y-3 rounded-lg border border-cyan-500/35 bg-cyan-950/15 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Search className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden />
        <p className="text-sm font-medium text-cyan-100">Search</p>
        <CategoryChip category="search" />
        <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-200">
          {isDemo ? "Mock search data" : "Live search"}
        </Badge>
        <Badge variant="outline" className="text-[9px] border-slate-500/45 text-slate-300">
          Confidence: {isDemo ? "medium" : "high"}
        </Badge>
        {usedByAgent && (
          <Badge variant="outline" className="text-[9px] border-emerald-500/35 text-emerald-200">
            Used by agent
          </Badge>
        )}
      </div>
      <p className="text-xs text-slate-300 leading-relaxed">
        {synthesisIntro ??
          (isDemo
            ? "I searched curated demo sources (replace with live MCP when configured). These are representative matches."
            : "I searched the web for the latest Stellar information. These sources are the strongest matches.")}
      </p>
      <p className="text-[11px] text-slate-500 italic">Query: {data.query}</p>

      {direct && (
        <section aria-label="Direct answer">
          <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1.5">Direct answer</p>
          <ResultItem r={direct} index={0} total={ranked.length || data.results.length} />
        </section>
      )}

      {supporting.length > 0 && (
        <section aria-label="Supporting sources">
          <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1.5">Supporting sources</p>
          <ul className="space-y-2">
            {supporting.map((r, i) => (
              <li key={`${r.url}-${i}`}>
                <ResultItem r={r} index={i + 1} total={ranked.length || data.results.length} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section aria-label="Related sources">
          <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1.5">Related</p>
          <ul className="space-y-2">
            {related.map((r, i) => (
              <li key={`${r.url}-${i + 10}`}>
                <ResultItem r={r} index={i + 4} total={ranked.length || data.results.length} compact />
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-[10px] text-slate-500 border-t border-cyan-500/20 pt-2">
        {data.totalResults} result(s) · {data.executionTime}ms ·{" "}
        {isDemo ? "Demo mode — swap in live search without changing this layout." : "Live search path."}
      </p>
    </div>
  );
}

function ResultItem({
  r,
  index,
  total,
  compact,
}: {
  r: RankableSearchResult;
  index: number;
  total: number;
  compact?: boolean;
}) {
  const rel = relevanceFromIndex(index, total);
  const t = r.trust;
  return (
    <div className="rounded-md border border-slate-700/60 bg-slate-950/60 p-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <a
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-cyan-300 hover:underline font-medium min-w-0"
        >
          {r.title}
        </a>
        <RelevanceDot level={rel} />
      </div>
      {!compact && <p className="text-xs text-slate-400 mt-1 line-clamp-3">{r.snippet}</p>}
      <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
        {r.source ? (
          <Badge variant="outline" className="text-[9px] border-slate-600 text-slate-400">
            {r.source}
          </Badge>
        ) : null}
        <Badge variant="outline" className="text-[9px] border-cyan-500/30 text-cyan-200/90">
          Source trust {Math.round(t.sourceTrust01 * 100)}%
        </Badge>
        <Badge variant="outline" className="text-[9px] border-slate-600 text-slate-400">
          Domain: {t.domainCredibility}
        </Badge>
        <Badge variant="outline" className="text-[9px] border-purple-500/25 text-purple-200/85">
          Freshness {Math.round(t.freshness01 * 100)}%
        </Badge>
        {t.isMock ? (
          <Badge variant="outline" className="text-[9px] border-amber-500/35 text-amber-200">
            Curated demo
          </Badge>
        ) : null}
        {t.usedInSuccessfulTask ? (
          <Badge variant="outline" className="text-[9px] border-emerald-500/35 text-emerald-200">
            Used in prior success
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

function interpretBlockchainCopy(data: SearchResponseWire): string[] {
  const lines: string[] = [];
  const q = data.query.toLowerCase();
  if (data.results.length === 0) {
    lines.push("No structured hits returned for this lookup (demo data may be sparse).");
  } else {
    lines.push("Lookup returned curated snippets you can cross-check on Horizon or Stellar.expert.");
  }
  if (/\b(testnet|mainnet)\b/i.test(q)) {
    lines.push(`The request mentions network context — confirm ${/\bmainnet\b/i.test(q) ? "mainnet" : "testnet"} in Freighter.`);
  }
  if (/\b(balance|xlm)\b/i.test(q)) {
    lines.push("For real balances, connect Freighter and open the dashboard tab.");
  }
  if (/\b(transaction|history|recent)\b/i.test(q)) {
    lines.push("Recent activity is best verified in the dashboard or a block explorer.");
  }
  if (/\b(sequence|seq)\b/i.test(q)) {
    lines.push("Sequence numbers advance with each transaction — compare with your last successful tx.");
  }
  return lines.slice(0, 4);
}

export function BlockchainAgentResultCard({
  data,
  tool,
  synthesisIntro,
  usedByAgent,
  priorSuccessUrlSet,
}: {
  data: SearchResponseWire;
  tool: AgentToolCallWire;
  synthesisIntro?: string;
  usedByAgent?: boolean;
  priorSuccessUrlSet?: Set<string>;
}) {
  const isDemo = data.searchMode === "mock";
  const interpretations = interpretBlockchainCopy(data);
  const rankedEvidence = useMemo(
    () => rankSearchResults(data, { priorSuccessUrlSet }).slice(0, 5),
    [data, priorSuccessUrlSet]
  );
  const avgTrust =
    rankedEvidence.length > 0
      ? rankedEvidence.reduce((a, r) => a + r.trust.sourceTrust01, 0) / rankedEvidence.length
      : null;

  return (
    <div className="space-y-3 rounded-lg border border-purple-500/40 bg-purple-950/20 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Database className="w-4 h-4 text-purple-400 shrink-0" aria-hidden />
        <p className="text-sm font-medium text-purple-100">Blockchain lookup</p>
        <CategoryChip category="blockchain" />
        <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-200">
          {isDemo ? "Demo blockchain result" : "Live blockchain"}
        </Badge>
        <Badge variant="outline" className="text-[9px] border-slate-500/45 text-slate-300">
          Not a wallet balance — cross-check Horizon
        </Badge>
        {usedByAgent && (
          <Badge variant="outline" className="text-[9px] border-emerald-500/35 text-emerald-200">
            Used by agent
          </Badge>
        )}
        {avgTrust != null && (
          <Badge
            variant="outline"
            className="text-[9px] border-cyan-500/30 text-cyan-200/90"
            title="Mean source trust for ranked evidence"
          >
            Evidence trust {Math.round(avgTrust * 100)}%
          </Badge>
        )}
      </div>
      <p className="text-xs text-slate-300 leading-relaxed">
        {synthesisIntro ??
          (isDemo
            ? "Structured Stellar-oriented snippets (demo). Cross-check on a block explorer before acting."
            : "Live-oriented Stellar lookup context. Plain-language readout below; verify critical amounts on Horizon.")}
      </p>
      <p className="text-[11px] text-slate-500 font-mono break-all">Topic: {String(tool.input.query ?? data.query)}</p>
      <p className="text-[10px] text-slate-600">
        Tool path: <span className="font-mono text-slate-500">blockchain_lookup</span> → server{" "}
        <span className="font-mono text-slate-500">searchStellarInfo</span> (same shape as web search cards; not raw
        Horizon JSON).
      </p>

      <section aria-label="Interpretation" className="rounded-md border border-purple-500/25 bg-slate-950/50 p-2.5 space-y-1.5">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-purple-300/90">
          <Sparkles className="w-3 h-3" aria-hidden />
          What this suggests
        </div>
        <ul className="list-disc pl-4 text-xs text-slate-300 space-y-1">
          {interpretations.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </section>

      <section aria-label="Lookup results">
        <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1.5">Evidence snippets (ranked by trust)</p>
        <ul className="space-y-2">
          {rankedEvidence.map((r, i) => (
            <li key={`${r.url}-${i}`} className="rounded-md border border-slate-700/60 bg-slate-950/60 p-2">
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-purple-200 hover:underline font-medium"
              >
                {r.title}
              </a>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{r.snippet}</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <Badge variant="outline" className="text-[9px] border-slate-600 text-slate-400">
                  Trust {Math.round(r.trust.sourceTrust01 * 100)}%
                </Badge>
                <Badge variant="outline" className="text-[9px] border-slate-600 text-slate-400">
                  {r.trust.domainCredibility} domain
                </Badge>
                {r.trust.usedInSuccessfulTask ? (
                  <Badge variant="outline" className="text-[9px] border-emerald-500/35 text-emerald-200">
                    Prior success
                  </Badge>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
