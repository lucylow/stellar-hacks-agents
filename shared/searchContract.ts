/** Mirrors `server/_core/mcpSearch` responses for typed client rendering */

export type SearchResultWire = {
  title: string;
  url: string;
  snippet: string;
  source?: string;
};

export type SearchResponseWire = {
  query: string;
  results: SearchResultWire[];
  totalResults: number;
  executionTime: number;
  searchMode: "mock" | "live";
};

export function isSearchResponseWire(x: unknown): x is SearchResponseWire {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return Array.isArray(o.results) && typeof o.query === "string";
}
