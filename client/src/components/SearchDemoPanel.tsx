import { useState, useMemo, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDemoSearch } from "@/hooks/useDemoSearch";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Search } from "lucide-react";
import { useStellarAgent } from "@/contexts/StellarAgentContext";
import { useReputation } from "@/_core/context/ReputationContext";
import { rankSearchResults } from "@shared/reputationCompute";
import type { SearchResponseWire } from "@shared/searchContract";

export function SearchDemoPanel() {
  const { pushActivity } = useStellarAgent();
  const reputation = useReputation();
  const { results, query, executionTimeMs, totalResults, error, isLoading, search, reset, isDemo } =
    useDemoSearch();
  const [localQuery, setLocalQuery] = useState("");
  const lastReputationKey = useRef<string | null>(null);

  const ranked = useMemo(() => {
    if (!results.length) return [];
    const wire: SearchResponseWire = {
      query,
      results,
      totalResults: totalResults ?? results.length,
      executionTime: executionTimeMs ?? 0,
      searchMode: "mock",
    };
    return rankSearchResults(wire, { priorSuccessUrlSet: reputation.priorSuccessfulSearchUrls });
  }, [results, query, totalResults, executionTimeMs, reputation.priorSuccessfulSearchUrls]);

  useEffect(() => {
    if (!query || results.length === 0 || isLoading) return;
    const key = `${query}::${results[0]?.url ?? ""}`;
    if (lastReputationKey.current === key) return;
    lastReputationKey.current = key;
    reputation.emit({ type: "search_completed", source: "search", demoMode: true });
    reputation.markSearchUrlsUsedSuccessfully(results.map((r) => r.url));
  }, [query, results, isLoading, reputation]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = localQuery.trim();
    if (!q) return;
    pushActivity(`Search issued: ${q}`);
    void search(q);
  };

  return (
    <Card className="surface-card border-[var(--border-strong)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--accent-primary)]">
          <Search className="h-4 w-4" aria-hidden />
          Search (demo)
        </h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="warning">Mock results</StatusBadge>
          {isDemo ? <StatusBadge tone="secondary">MCP-ready hook</StatusBadge> : null}
        </div>
      </div>

      <InlineAlert variant="info" title="What you are seeing">
        Results come from the server&apos;s structured mock generator today. The same{" "}
        <code className="rounded bg-[var(--surface-elevated)] px-1 font-mono text-[10px]">
          agent.search
        </code>{" "}
        procedure can be pointed at a real MCP search server later without changing this UI.
      </InlineAlert>

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="demo-search-query" className="sr-only">
          Search query
        </label>
        <Input
          id="demo-search-query"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="Try “Stellar”, “Horizon”, or “Freighter”"
          disabled={isLoading}
          className="flex-1 bg-[var(--surface-elevated)] text-[var(--text)]"
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={isLoading || !localQuery.trim()} className="btn-primary">
            {isLoading ? "Searching…" : "Search"}
          </Button>
          <Button type="button" variant="outline" onClick={reset} className="border-[var(--border)]">
            Clear
          </Button>
        </div>
      </form>

      {isLoading ? (
        <div className="mt-4">
          <LoadingState label="Searching catalog (demo)…" />
        </div>
      ) : null}

      {error ? (
        <div className="mt-4">
          <InlineAlert variant="error" title="Search failed">
            {error}
          </InlineAlert>
        </div>
      ) : null}

      {!isLoading && query && results.length === 0 && !error ? (
        <div className="mt-4">
          <EmptyState
            title="No hits for that query"
            description="The mock set is small—try broader keywords like “Stellar” or “wallet”."
          />
        </div>
      ) : null}

      {results.length > 0 ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted-text)]">
            <span>
              Query: <span className="font-medium text-[var(--text)]">{query}</span>
            </span>
            {totalResults != null ? <span>{totalResults} results (demo)</span> : null}
            {executionTimeMs != null ? <span>{executionTimeMs} ms</span> : null}
          </div>
          <ul className="space-y-2" aria-label="Demo search results">
            {ranked.map((r, i) => (
              <li
                key={`${r.url}-${i}`}
                className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-elevated)]/80 p-3 transition hover:border-[var(--accent-primary)]/40"
              >
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[var(--accent-primary)] underline-offset-2 hover:underline"
                >
                  {r.title}
                </a>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted-text)]">{r.snippet}</p>
                <div className="mt-2 flex flex-wrap gap-2 items-center">
                  {r.source ? (
                    <StatusBadge tone="secondary">Source: {r.source}</StatusBadge>
                  ) : null}
                  <StatusBadge tone="warning">Demo data</StatusBadge>
                  <Badge variant="outline" className="text-[9px] border-[var(--border)] text-[var(--muted-text)]">
                    Trust {Math.round(r.trust.sourceTrust01 * 100)}%
                  </Badge>
                  <Badge variant="outline" className="text-[9px] border-[var(--border)] text-[var(--muted-text)]">
                    {r.trust.domainCredibility} domain
                  </Badge>
                  {r.trust.usedInSuccessfulTask ? (
                    <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-200">
                      Prior task success
                    </Badge>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
