import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Zap, Clock, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Search() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [query, setQuery] = useState("");
  const [service, setService] = useState<"web-search" | "market-data" | "news-feed">("web-search");
  const [queryId, setQueryId] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  // API mutations and queries
  const executeSearch = trpc.search.execute.useMutation();
  const estimateCost = trpc.search.estimateCost.useQuery(
    { query, service },
    { enabled: query.length > 0 }
  );

  // Fetch results once we have a queryId
  const searchResults = trpc.search.getResult.useQuery(
    { queryId: queryId || "" },
    { enabled: !!queryId }
  );

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setSearching(true);
    try {
      const result = await executeSearch.mutateAsync({
        query,
        service,
      });
      setQueryId(result.queryId);
      setSearching(false);
    } catch (error) {
      console.error("Search error:", error);
      setSearching(false);
    }
  };

  const results = searchResults.data?.results || [];
  const hasResults = results.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar walletConnected={walletConnected} onWalletToggle={setWalletConnected} />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Agentic Search</h1>
          <p className="text-muted-foreground">Search the web with AI-powered agents, pay per query</p>
        </div>

        {/* Search Box */}
        <div className="max-w-2xl mx-auto mb-12">
          <Card className="p-6 bg-card border-border">
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="What would you like to search for?"
                  className="pl-10 py-6 bg-background border-border text-base"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={searching || !query.trim()}
                className="bg-accent text-accent-foreground hover:bg-accent/90 px-8"
              >
                {searching ? "Searching..." : "Search"}
              </Button>
            </div>

            {/* Service Selection */}
            <div className="flex gap-2 mb-4">
              {["web-search", "market-data", "news-feed"].map((svc) => (
                <Button
                  key={svc}
                  variant={service === svc ? "default" : "outline"}
                  size="sm"
                  onClick={() => setService(svc as any)}
                  className={service === svc ? "bg-accent text-accent-foreground" : ""}
                >
                  {svc.replace("-", " ")}
                </Button>
              ))}
            </div>

            {/* Cost Info */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">Cost</p>
                  <p className="font-semibold">${estimateCost.data?.baseCost || 0.001}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">Settlement</p>
                  <p className="font-semibold">&lt;500ms</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-semibold">Ready</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Results */}
        {hasResults && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-6">Results for "{query}"</h2>
            <div className="space-y-4">
              {results.map((result: any, idx: number) => (
                <Card key={idx} className="p-6 bg-card border-border hover:border-accent/50 transition-colors cursor-pointer">
                  <a href={result.url} target="_blank" rel="noopener noreferrer">
                    <p className="text-accent text-sm mb-1">{result.url}</p>
                    <h3 className="text-lg font-semibold mb-2 hover:text-accent">{result.title}</h3>
                    <p className="text-muted-foreground text-sm">{result.snippet}</p>
                  </a>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {searchResults.isLoading && (
          <div className="max-w-2xl mx-auto text-center py-12">
            <SearchIcon className="w-16 h-16 text-accent/30 mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Fetching results...</p>
          </div>
        )}

        {/* Empty State */}
        {!searching && !searchResults.isLoading && !hasResults && query && (
          <div className="max-w-2xl mx-auto text-center py-12">
            <SearchIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No results found. Try a different query.</p>
          </div>
        )}

        {/* Features */}
        {!hasResults && !queryId && !query && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <Card className="p-6 bg-card border-border">
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-bold mb-2">Instant Results</h3>
              <p className="text-sm text-muted-foreground">Get search results in under 500ms with AI-powered agents</p>
            </Card>
            <Card className="p-6 bg-card border-border">
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                <SearchIcon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-bold mb-2">Smart Queries</h3>
              <p className="text-sm text-muted-foreground">Natural language queries understood by intelligent agents</p>
            </Card>
            <Card className="p-6 bg-card border-border">
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-bold mb-2">Transparent Pricing</h3>
              <p className="text-sm text-muted-foreground">Pay only $0.001 per query, no hidden fees</p>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
