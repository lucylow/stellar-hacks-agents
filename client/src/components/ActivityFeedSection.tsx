import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, CheckCircle2, Info, AlertTriangle, AlertCircle } from "lucide-react";
import { useStellarAgent } from "@/contexts/StellarAgentContext";
import type { ActivityLevel } from "@/contexts/StellarAgentContext";

function iconFor(level: ActivityLevel) {
  switch (level) {
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-[var(--success)] shrink-0" aria-hidden />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-[var(--warning)] shrink-0" aria-hidden />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-[var(--destructive)] shrink-0" aria-hidden />;
    default:
      return <Info className="h-4 w-4 text-[var(--accent-primary)] shrink-0" aria-hidden />;
  }
}

export function ActivityFeedSection() {
  const { activities, clearActivities } = useStellarAgent();

  return (
    <Card className="surface-card border-[var(--border)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
          <Activity className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden />
          Activity
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearActivities}
          disabled={activities.length === 0}
          className="text-xs text-[var(--muted-text)]"
        >
          Clear
        </Button>
      </div>

      {activities.length === 0 ? (
        <p className="text-xs text-[var(--muted-text)]">
          Wallet, chat, search, and task events will show up here for the demo.
        </p>
      ) : (
        <ScrollArea className="h-48 pr-3">
          <ol className="space-y-2" aria-label="Activity log" reversed>
            {activities.map((a) => (
              <li
                key={a.id}
                className="flex gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-elevated)]/60 px-2 py-1.5 text-xs"
              >
                {iconFor(a.level)}
                <div className="min-w-0 flex-1">
                  <p className="text-[var(--text)]">{a.message}</p>
                  <time className="text-[10px] text-[var(--muted-text)]" dateTime={new Date(a.at).toISOString()}>
                    {new Date(a.at).toLocaleTimeString()}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        </ScrollArea>
      )}
    </Card>
  );
}
