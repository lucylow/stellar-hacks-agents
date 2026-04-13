import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { MCP_SERVICE_CATALOG } from "@/data/agenticConsoleSeed";
import type { McpServiceRecord } from "@/lib/demoConsoleTypes";
import { StatusPill } from "./StatusPill";
import { CopyButton } from "./CopyButton";
import { Layers, Search } from "lucide-react";

function payTierPill(s: McpServiceRecord) {
  if (s.payTier === "free") {
    return (
      <StatusPill tone="success" srLabel="Free tier">
        Free
      </StatusPill>
    );
  }
  if (s.requiresHumanApproval) {
    return (
      <StatusPill tone="warning" srLabel="Paid — approval required">
        Paid · approval
      </StatusPill>
    );
  }
  return (
    <StatusPill tone="info" srLabel="Paid">
      Paid
    </StatusPill>
  );
}

function availabilityTone(s: McpServiceRecord["availability"]): "success" | "warning" | "danger" {
  if (s === "up") return "success";
  if (s === "degraded") return "warning";
  return "danger";
}

type ServiceCatalogConsoleProps = {
  selectedId: string;
  onSelect: (id: string) => void;
};

export function ServiceCatalogConsole({ selectedId, onSelect }: ServiceCatalogConsoleProps) {
  const [filter, setFilter] = useState("");
  const [inspect, setInspect] = useState<McpServiceRecord | null>(null);

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return MCP_SERVICE_CATALOG;
    return MCP_SERVICE_CATALOG.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.mcpTool.toLowerCase().includes(q)
    );
  }, [filter]);

  return (
    <>
      <Card className="app-card border border-[var(--border)] bg-[var(--surface-elevated)]/90 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
            <Layers className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden />
            Search MCP catalog
          </h3>
          <StatusPill tone="demo" srLabel="Discovery is static in demo">
            Demo catalog
          </StatusPill>
        </div>
        <p className="text-xs text-[var(--muted-text)] leading-relaxed">
          Paid vs free and approval requirements are explicit. Inspect a tool before you route an agent to it.
        </p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-text)]" />
          <label htmlFor="mcp-catalog-filter" className="sr-only">
            Filter MCP tools
          </label>
          <Input
            id="mcp-catalog-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by name, tool, or description"
            className="pl-8 bg-[var(--surface)] border-[var(--border)]"
          />
        </div>

        <ul className="space-y-2" aria-label="MCP service catalog">
          {rows.map((s) => {
            const active = s.id === selectedId;
            return (
              <li key={s.id}>
                <div
                  className={`rounded-[var(--radius-md)] border p-3 transition-colors ${
                    active
                      ? "border-[var(--border-strong)] bg-[var(--surface)]/90"
                      : "border-[var(--border)] bg-[var(--surface)]/50 hover:border-[var(--accent-primary)]/35"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium text-[var(--text)]">{s.name}</p>
                      <p className="text-xs text-[var(--muted-text)] line-clamp-2">{s.description}</p>
                      <p className="font-mono text-[10px] text-[var(--accent-primary)]">{s.mcpTool}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {payTierPill(s)}
                      <StatusPill tone={availabilityTone(s.availability)} srLabel={`Availability ${s.availability}`}>
                        {s.availability}
                      </StatusPill>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={active ? "default" : "outline"}
                      className={active ? "btn-primary" : "border-[var(--border)]"}
                      onClick={() => onSelect(s.id)}
                    >
                      {active ? "Selected" : "Use for query"}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setInspect(s)}>
                      Inspect
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Sheet open={inspect != null} onOpenChange={(o) => !o && setInspect(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-[var(--surface-elevated)] border-[var(--border)]">
          {inspect ? (
            <>
              <SheetHeader>
                <SheetTitle>{inspect.name}</SheetTitle>
                <SheetDescription>{inspect.description}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-6 text-sm">
                <div>
                  <p className="text-xs text-[var(--muted-text)]">MCP tool</p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="font-mono text-xs break-all text-[var(--accent-primary)]">{inspect.mcpTool}</code>
                    <CopyButton text={inspect.mcpTool} label="Copy MCP tool name" />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted-text)]">Endpoint hint</p>
                  <p className="font-mono text-xs break-all">{inspect.endpointHint}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-[var(--muted-text)]">Price / query</p>
                    <p className="font-mono text-sm">
                      {inspect.pricePerQueryUsdc} {inspect.currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted-text)]">Rate limit</p>
                    <p className="text-xs">{inspect.rateLimit}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted-text)]">Reputation</p>
                  <p className="text-xs text-[var(--text)]">{inspect.reputationNote}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {inspect.policyTags.map((t) => (
                    <StatusPill key={t} tone="neutral">
                      {t}
                    </StatusPill>
                  ))}
                </div>
                <Button type="button" className="btn-primary w-full" onClick={() => onSelect(inspect.id)}>
                  Route queries to this tool
                </Button>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
