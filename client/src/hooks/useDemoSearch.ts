import { useCallback, useState } from "react";
import { trpc } from "@/lib/trpc";

export type NormalizedSearchHit = {
  title: string;
  url: string;
  snippet: string;
  source?: string;
};

export type DemoSearchSnapshot = {
  query: string;
  results: NormalizedSearchHit[];
  executionTimeMs: number | null;
  totalResults: number | null;
  error: string | null;
};

export function useDemoSearch() {
  const mutation = trpc.agent.search.useMutation();
  const [snapshot, setSnapshot] = useState<DemoSearchSnapshot>({
    query: "",
    results: [],
    executionTimeMs: null,
    totalResults: null,
    error: null,
  });

  const search = useCallback(
    async (rawQuery: string) => {
      const query = rawQuery.trim();
      if (!query) return;
      try {
        const res = await mutation.mutateAsync({ query, searchType: "general" });
        setSnapshot({
          query: res.query,
          results: (res.results ?? []).map((r) => ({
            title: r.title,
            url: r.url,
            snippet: r.snippet,
            source: r.source,
          })),
          executionTimeMs: res.executionTime ?? null,
          totalResults: res.totalResults ?? null,
          error: null,
        });
      } catch (e) {
        setSnapshot((prev) => ({
          ...prev,
          error: e instanceof Error ? e.message : "Search failed.",
        }));
      }
    },
    [mutation]
  );

  const reset = useCallback(() => {
    setSnapshot({
      query: "",
      results: [],
      executionTimeMs: null,
      totalResults: null,
      error: null,
    });
  }, []);

  return {
    ...snapshot,
    search,
    reset,
    isLoading: mutation.isPending,
    /** Search responses are mock/demo until a live MCP server is wired. */
    isDemo: true as const,
  };
}
