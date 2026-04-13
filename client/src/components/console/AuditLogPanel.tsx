import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useStellarAgent } from "@/contexts/StellarAgentContext";
import { useAgentWorkflow } from "@/_core/context/AgentWorkflowContext";
import type { AgentTimelineEvent, AgentTimelineEventType } from "@shared/appConnectionModel";
import type { ActivityEntry } from "@/contexts/StellarAgentContext";
import type { AuditSeverity } from "@/lib/demoConsoleTypes";
import { ChevronDown, ClipboardList, CheckCircle2, Clock, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type UnifiedRow = {
  id: string;
  atMs: number;
  severity: AuditSeverity;
  title: string;
  detail?: string;
  source: "timeline" | "activity";
  type?: AgentTimelineEventType;
};

function timelineSeverity(t: AgentTimelineEventType): AuditSeverity {
  switch (t) {
    case "payment_settled":
    case "task_completed":
    case "tool_returned":
    case "result_rendered":
    case "wallet_connected":
      return "success";
    case "payment_settling":
    case "payment_required":
    case "agent_request_started":
    case "plan_ready":
      return "pending";
    case "wallet_required":
      return "warning";
    case "task_failed":
      return "error";
    default:
      return "info";
  }
}

function activitySeverity(a: ActivityEntry["level"]): AuditSeverity {
  if (a === "success") return "success";
  if (a === "warning") return "warning";
  if (a === "error") return "error";
  return "info";
}

function RowIcon({ severity }: { severity: AuditSeverity }) {
  switch (severity) {
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-[var(--success)] shrink-0" aria-hidden />;
    case "pending":
      return <Clock className="h-4 w-4 text-[var(--info)] shrink-0" aria-hidden />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-[var(--warning)] shrink-0" aria-hidden />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-[var(--error)] shrink-0" aria-hidden />;
    default:
      return <Info className="h-4 w-4 text-[var(--accent-primary)] shrink-0" aria-hidden />;
  }
}

function mapTimeline(e: AgentTimelineEvent): UnifiedRow {
  return {
    id: `tl-${e.id}`,
    atMs: Date.parse(e.at),
    severity: timelineSeverity(e.type),
    title: e.label,
    detail: e.detail,
    source: "timeline",
    type: e.type,
  };
}

function mapActivity(a: ActivityEntry): UnifiedRow {
  return {
    id: `ac-${a.id}`,
    atMs: a.at,
    severity: activitySeverity(a.level),
    title: a.message,
    source: "activity",
  };
}

const FILTERS: { id: "all" | AuditSeverity; label: string }[] = [
  { id: "all", label: "All" },
  { id: "success", label: "Success" },
  { id: "pending", label: "Pending" },
  { id: "warning", label: "Warning" },
  { id: "error", label: "Error" },
  { id: "info", label: "Info" },
];

export function AuditLogPanel() {
  const { activities, clearActivities } = useStellarAgent();
  const { timeline } = useAgentWorkflow();
  const [filter, setFilter] = useState<"all" | AuditSeverity>("all");

  const rows = useMemo(() => {
    const merged: UnifiedRow[] = [...timeline.map(mapTimeline), ...activities.map(mapActivity)];
    merged.sort((a, b) => b.atMs - a.atMs);
    if (filter === "all") return merged;
    return merged.filter((r) => r.severity === filter);
  }, [timeline, activities, filter]);

  return (
    <Card className="app-card border border-[var(--border)] bg-[var(--surface-elevated)]/90 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
          <ClipboardList className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden />
          Audit log
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearActivities}
          disabled={activities.length === 0}
          className="text-xs text-[var(--muted-text)]"
        >
          Clear client events
        </Button>
      </div>
      <p className="text-xs text-[var(--muted-text)]">
        Lifecycle: request → quote → approval → settlement → search → response. Timeline merges agent workflow with wallet/session events.
      </p>

      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="Filter audit log by status"
      >
        {FILTERS.map((f) => (
          <Button
            key={f.id}
            type="button"
            size="sm"
            variant={filter === f.id ? "default" : "outline"}
            className={cn(
              "h-8 text-[10px] uppercase tracking-wide",
              filter === f.id ? "btn-primary" : "border-[var(--border)] text-[var(--muted-text)]"
            )}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-[var(--muted-text)] py-4">
          {filter === "all"
            ? "No events yet — connect a wallet, run the search console, or chat with the agent."
            : `No ${filter} events for this filter.`}
        </p>
      ) : (
        <ScrollArea className="h-64 pr-3" aria-label="Audit log entries">
          <ol className="space-y-2">
            {rows.map((r) => (
              <li key={r.id}>
                {r.detail ? (
                  <Collapsible>
                    <div className="rounded-md border border-[var(--border)] bg-[var(--surface)]/65">
                      <div className="flex gap-2 px-2 py-2">
                        <RowIcon severity={r.severity} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-[var(--text)]">
                            <span className="sr-only">Status: {r.severity}. </span>
                            {r.title}
                          </p>
                          <time
                            className="text-[10px] text-[var(--muted-text)] tabular-nums"
                            dateTime={new Date(r.atMs).toISOString()}
                          >
                            {new Date(r.atMs).toLocaleString()}
                          </time>
                          <CollapsibleTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="mt-1 h-7 px-2 text-[10px] text-[var(--accent-primary)]"
                            >
                              <ChevronDown className="mr-1 h-3 w-3" aria-hidden />
                              Details
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </div>
                      <CollapsibleContent>
                        <div className="border-t border-[var(--border)] px-3 py-2 text-[10px] text-[var(--muted-text)] font-mono leading-relaxed break-words">
                          {r.detail}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ) : (
                  <div className="rounded-md border border-[var(--border)] bg-[var(--surface)]/65">
                    <div className="flex gap-2 px-2 py-2">
                      <RowIcon severity={r.severity} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-[var(--text)]">
                          <span className="sr-only">Status: {r.severity}. </span>
                          {r.title}
                        </p>
                        <time
                          className="text-[10px] text-[var(--muted-text)] tabular-nums"
                          dateTime={new Date(r.atMs).toISOString()}
                        >
                          {new Date(r.atMs).toLocaleString()}
                        </time>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </ScrollArea>
      )}
    </Card>
  );
}
