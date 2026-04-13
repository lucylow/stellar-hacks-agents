import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAgentWorkflow } from "@/_core/context/AgentWorkflowContext";
import { Activity, Clock, ListTree } from "lucide-react";
import type { AgentActivityState } from "@shared/appConnectionModel";

function activityLabel(s: AgentActivityState): string {
  switch (s) {
    case "idle":
      return "Idle";
    case "thinking":
      return "Thinking";
    case "planning":
      return "Planning";
    case "calling_tool":
      return "Calling tool";
    case "waiting_wallet":
      return "Waiting for wallet";
    case "waiting_search":
      return "Waiting on search";
    case "rendering_result":
      return "Rendering result";
    case "error":
      return "Error";
    default:
      return s;
  }
}

function elapsed(fromIso: string, toIso?: string): string {
  const a = new Date(fromIso).getTime();
  const b = (toIso ? new Date(toIso) : new Date()).getTime();
  const s = Math.max(0, Math.round((b - a) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

export function AgentTaskPanel() {
  const { activity, timeline, currentTask } = useAgentWorkflow();

  return (
    <Card className="border border-purple-500/25 bg-slate-950/90 h-full flex flex-col min-h-0 shadow-md shadow-purple-950/20">
      <div className="border-b border-purple-500/20 bg-slate-900/50 px-4 py-3 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-purple-400 font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4" aria-hidden />
            Agent workflow
          </h3>
          <Badge variant="outline" className="text-[10px] border-amber-500/35 text-amber-200">
            Live trace
          </Badge>
        </div>
        <p className="text-xs text-slate-500">
          Stages update when you send chat messages. This is not a random simulator.
        </p>
      </div>

      <div className="p-4 border-b border-purple-500/15 space-y-3">
        {currentTask ? (
          <>
            <div className="flex justify-between gap-2 text-sm">
              <span className="text-slate-400">Current task</span>
              <Badge variant="outline" className="text-[10px] border-purple-500/40 text-purple-200">
                {currentTask.stage.replace(/_/g, " ")}
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
          </>
        ) : (
          <div className="text-center py-6 text-slate-500 text-sm space-y-2" role="status">
            <p>No active task</p>
            <p className="text-xs text-slate-600">Send a message in Chat to drive the agent pipeline.</p>
          </div>
        )}
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
