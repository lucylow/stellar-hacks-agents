import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAgentWorkflow } from "@/_core/context/AgentWorkflowContext";
import { useReputation } from "@/_core/context/ReputationContext";
import { TierBadge, TrendGlyph } from "@/components/reputation/TrustPrimitives";
import {
  Activity,
  Clock,
  ListTree,
  Search,
  Database,
  Wallet,
  CreditCard,
  TrendingUp,
  Link2,
} from "lucide-react";
import { CategoryChip } from "@/components/app/uiPrimitives";
import type {
  AgentActivityState,
  AgentToolRoute,
  TaskPanelStage,
  TaskProgressSnapshot,
} from "@shared/appConnectionModel";

function activityLabel(s: AgentActivityState): string {
  switch (s) {
    case "idle":
      return "Idle";
    case "thinking":
      return "Thinking";
    case "planning":
      return "Planning";
    case "tool_selection":
      return "Choosing tool";
    case "calling_tool":
      return "Calling tool";
    case "waiting_wallet":
      return "Waiting for wallet";
    case "waiting_search":
      return "Waiting on search";
    case "looking_up_blockchain":
      return "Blockchain lookup";
    case "payment_required":
      return "Payment required";
    case "payment_authorizing":
      return "Authorizing payment";
    case "settling":
      return "Settling";
    case "streaming":
      return "Streaming answer";
    case "rendering_result":
      return "Rendering result";
    case "error":
      return "Error";
    default:
      return s;
  }
}

function routeBadge(route: AgentToolRoute | undefined) {
  if (!route) return null;
  const map: Record<AgentToolRoute, { label: string; icon: typeof Search }> = {
    search: { label: "Search", icon: Search },
    blockchain_lookup: { label: "Blockchain", icon: Database },
    wallet_check: { label: "Wallet", icon: Wallet },
    mixed: { label: "Mixed", icon: Search },
    general: { label: "General", icon: Activity },
    payment: { label: "x402", icon: CreditCard },
  };
  const m = map[route];
  const Icon = m.icon;
  return (
    <Badge variant="outline" className="text-[9px] border-purple-500/35 text-purple-200 gap-1">
      <Icon className="w-3 h-3" aria-hidden />
      {m.label}
    </Badge>
  );
}

function taskStageLabel(stage: TaskPanelStage): string {
  const map: Record<TaskPanelStage, string> = {
    queued: "Queued",
    planning: "Planning",
    wallet_needed: "Waiting on wallet",
    connecting_wallet: "Connecting wallet",
    payment_required: "Payment required",
    payment_approval_pending: "Waiting for wallet approval",
    settling: "Settling payment",
    searching: "Searching",
    fetching_account: "Checking account / ledger",
    tool_execution: "Running tools",
    synthesizing: "Synthesizing answer",
    complete: "Completed",
    failed: "Failed",
  };
  return map[stage] ?? stage.replace(/_/g, " ");
}

function elapsed(fromIso: string, toIso?: string): string {
  const a = new Date(fromIso).getTime();
  const b = (toIso ? new Date(toIso) : new Date()).getTime();
  const s = Math.max(0, Math.round((b - a) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

const LIFECYCLE = [
  "Task received",
  "Plan created",
  "Tool routing",
  "Wallet / x402 gate",
  "Tool executed",
  "Synthesis",
  "Task completed",
] as const;

function lifecycleIndex(task: TaskProgressSnapshot, activity: AgentActivityState): number {
  if (!task) return 0;
  if (task.stage === "complete") return 6;
  if (task.stage === "failed") return Math.max(0, Math.min(5, Math.floor(task.progress01 * 6)));
  if (activity === "streaming" || activity === "rendering_result") return 5;
  if (
    task.stage === "searching" ||
    task.stage === "fetching_account" ||
    task.stage === "tool_execution" ||
    task.stage === "synthesizing"
  )
    return 4;
  if (
    task.stage === "wallet_needed" ||
    task.stage === "payment_required" ||
    task.stage === "payment_approval_pending" ||
    task.stage === "settling"
  )
    return 3;
  if (task.predictedRoute || task.resolvedRoute) return 2;
  if (task.planLines && task.planLines.length > 0) return 1;
  if (task.stage === "planning" || task.stage === "queued") return 1;
  return 0;
}

export function AgentTaskPanel({ embedded }: { embedded?: boolean }) {
  const { activity, timeline, currentTask } = useAgentWorkflow();
  const { summary, hydrated } = useReputation();
  const lix = currentTask ? lifecycleIndex(currentTask, activity) : -1;
  const recentSteps = timeline.slice(0, 6);
  const route = currentTask?.resolvedRoute ?? currentTask?.predictedRoute;
  const isBlockchainTurn =
    route === "blockchain_lookup" || route === "mixed" || activity === "looking_up_blockchain";
  const blockchainStageLines = [
    "Wait for wallet if the prompt needs your public key or live balances.",
    "Select blockchain_lookup — server runs searchStellarInfo (structured snippets, often demo).",
    "Optional: cross-check the account dashboard for raw Horizon transactions and operations.",
    "Summarize what the tool returned and what still needs on-chain verification.",
  ];

  const statusBadge =
    currentTask?.stage === "complete"
      ? { label: "Done", className: "border-emerald-500/45 text-emerald-300" }
      : currentTask?.stage === "failed"
        ? { label: "Failed", className: "border-red-500/45 text-red-300" }
        : currentTask
          ? { label: "Running", className: "border-purple-500/45 text-purple-200" }
          : { label: "Idle", className: "border-slate-600 text-slate-400" };

  return (
    <Card
      className={`app-card border border-[var(--border)] bg-[var(--surface-elevated)]/95 h-full flex flex-col min-h-0 ${embedded ? "min-h-[min(70vh,720px)]" : ""}`}
    >
      <div className="border-b border-[var(--border)] bg-[var(--surface)]/90 px-4 py-3 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[var(--accent-secondary)] font-semibold flex items-center gap-2 text-base tracking-tight m-0">
            <Activity className="w-4 h-4" aria-hidden />
            Task monitor
          </h3>
          <Badge variant="outline" className={`text-[10px] ${statusBadge.className}`}>
            {statusBadge.label}
          </Badge>
          <Badge variant="outline" className="text-[10px] border-amber-500/35 text-amber-200">
            Synced with chat
          </Badge>
          {routeBadge(currentTask?.resolvedRoute ?? currentTask?.predictedRoute)}
          {isBlockchainTurn ? <CategoryChip category="blockchain" label="Ledger step" /> : null}
        </div>
        <p className="text-xs text-[var(--muted-text)]">
          {embedded
            ? "Live trace for the current chat turn."
            : "Stages update when you send chat messages. Mirrors the main chat tab."}
        </p>
        <div
          className="flex flex-wrap items-center gap-2 pt-1"
          aria-label="Task quality and reputation impact"
        >
          {hydrated ? (
            <>
              <TierBadge tier={summary.score.tier} />
              <TrendGlyph trend={summary.score.trend} />
              <Badge variant="outline" className="text-[9px] border-cyan-500/30 text-cyan-200">
                <TrendingUp className="w-3 h-3 mr-0.5 inline" aria-hidden />
                {summary.successCount} success{summary.successCount === 1 ? "" : "es"}
              </Badge>
              <span className="text-[10px] text-slate-500">
                Fail {summary.failureCount} · Retry {summary.retryCount}
              </span>
            </>
          ) : (
            <span className="text-[10px] text-slate-500">Trust metrics loading…</span>
          )}
        </div>
      </div>

      <div className="p-4 border-b border-purple-500/15 space-y-3 shrink-0">
        {currentTask ? (
          <>
            <div className="flex justify-between gap-2 text-sm">
              <span className="text-slate-400">Current stage</span>
              <Badge variant="outline" className="text-[10px] border-purple-500/40 text-purple-200">
                {taskStageLabel(currentTask.stage)}
              </Badge>
            </div>
            <p className="text-sm text-cyan-100/90 leading-snug">{currentTask.title}</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Progress</span>
                <span>{Math.round(currentTask.progress01 * 100)}%</span>
              </div>
              <Progress value={currentTask.progress01 * 100} className="h-2 bg-slate-800" />
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden />
              {currentTask.currentAction}
            </p>
            <p className="text-[11px] text-slate-500">
              Elapsed {elapsed(currentTask.startedAt, currentTask.completedAt)} · Agent state:{" "}
              <span className="text-purple-300">{activityLabel(activity)}</span>
            </p>
            {currentTask.needsWallet && (
              <p className="text-[11px] text-amber-200/90 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 shrink-0" aria-hidden />
                Wallet context recommended for this prompt — answers may be generic without Freighter.
              </p>
            )}
            {currentTask.usedPaymentFlow && (
              <p className="text-[11px] text-purple-200/90 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 shrink-0" aria-hidden />
                Payment middleware may run (per-request, credits, or session) before tools — follow the chat quote.
              </p>
            )}
            {isBlockchainTurn && (
              <div className="rounded-md border border-purple-500/20 bg-slate-950/50 p-2 space-y-1.5">
                <p className="text-[10px] uppercase tracking-wide text-purple-300/90 flex items-center gap-1">
                  <Link2 className="w-3 h-3" aria-hidden />
                  Blockchain stages
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-400 leading-relaxed">
                  {blockchainStageLines.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ol>
                <p className="text-[10px] text-slate-600">
                  Detailed Horizon rows appear in the account dashboard; the agent uses structured lookup output.
                </p>
              </div>
            )}
            {currentTask.resultSummary && (
              <p className="text-xs text-emerald-400/90 border border-emerald-500/20 rounded-md px-2 py-1.5 bg-emerald-950/20">
                {currentTask.resultSummary}
              </p>
            )}
            {currentTask.errorMessage && (
              <p className="text-xs text-red-300/90 border border-red-500/25 rounded-md px-2 py-1.5 bg-red-950/20">
                {currentTask.errorMessage}
              </p>
            )}

            {recentSteps.length > 0 && (
              <div className="pt-2 border-t border-purple-500/15">
                <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1.5">Recent steps</p>
                <ol className="space-y-1 text-xs text-slate-400 list-decimal pl-4">
                  {recentSteps.map((ev) => (
                    <li key={ev.id}>{ev.label}</li>
                  ))}
                </ol>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6 text-[var(--muted-text)] text-sm space-y-2" role="status">
            <p>No active task</p>
            <p className="text-xs text-slate-600">Send a message in the agent chat to start a run.</p>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-b border-purple-500/10 shrink-0">
        <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-2">Lifecycle</p>
        <ol className="space-y-1.5" aria-label="Task lifecycle timeline">
          {LIFECYCLE.map((label, i) => {
            const done = lix >= i;
            const active = lix === i;
            return (
              <li
                key={label}
                className={`flex items-center gap-2 text-xs rounded-md px-2 py-1 border ${
                  active
                    ? "border-purple-500/40 bg-purple-950/30 text-purple-100"
                    : done
                      ? "border-emerald-500/20 text-emerald-200/90"
                      : "border-slate-800/80 text-slate-500"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${done ? "bg-emerald-400" : "bg-slate-600"}`}
                  aria-hidden
                />
                <span>{label}</span>
                {active && <span className="text-[10px] text-purple-300 ml-auto">current</span>}
              </li>
            );
          })}
        </ol>
      </div>

      <ScrollArea className="flex-1 min-h-0 p-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <ListTree className="w-4 h-4" aria-hidden />
          Event timeline
        </div>
        {timeline.length === 0 ? (
          <p className="text-sm text-slate-600 py-4 text-center">Timeline is empty until the next agent turn.</p>
        ) : (
          <ol className="space-y-2 border-l border-purple-500/25 ml-2 pl-4">
            {timeline.map((ev) => (
              <li key={ev.id} className="relative text-sm">
                <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                <p className="text-slate-200">{ev.label}</p>
                {ev.detail && <p className="text-xs text-slate-500 mt-0.5">{ev.detail}</p>}
                <time className="text-[10px] text-slate-600 mt-1 block" dateTime={ev.at}>
                  {new Date(ev.at).toLocaleTimeString()}
                </time>
              </li>
            ))}
          </ol>
        )}
      </ScrollArea>
    </Card>
  );
}
