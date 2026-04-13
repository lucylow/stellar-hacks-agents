import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { nanoid } from "nanoid";
import type {
  AgentActivityState,
  AgentTimelineEvent,
  AgentToolCallWire,
  TaskPanelStage,
  TaskProgressSnapshot,
} from "@shared/appConnectionModel";
import {
  reduceAgentActivity,
  timelineTypeForAgentEvent,
  type AgentStateEvent,
} from "@shared/agentStateMachine";

type AgentWorkflowContextValue = {
  activity: AgentActivityState;
  dispatchAgent: (event: AgentStateEvent) => void;
  timeline: AgentTimelineEvent[];
  currentTask: TaskProgressSnapshot | null;
  beginTurn: (userQuery: string) => void;
  recordToolCalls: (tools: AgentToolCallWire[]) => void;
  finishTurn: (opts: { ok: boolean; summary?: string; error?: string }) => void;
  resetWorkflow: () => void;
};

const Ctx = createContext<AgentWorkflowContextValue | null>(null);

function mapStageFromTools(tools: AgentToolCallWire[]): TaskPanelStage {
  const t = tools[0]?.type;
  if (t === "search") return "searching";
  if (t === "blockchain_lookup") return "fetching_account";
  return "queued";
}

export function AgentWorkflowProvider({ children }: { children: ReactNode }) {
  const [activity, rawDispatch] = useReducer(reduceAgentActivity, "idle");
  const [timeline, setTimeline] = useState<AgentTimelineEvent[]>([]);
  const [currentTask, setCurrentTask] = useState<TaskProgressSnapshot | null>(null);

  const pushTimeline = useCallback((event: AgentStateEvent, label: string, detail?: string) => {
    const t = timelineTypeForAgentEvent(event);
    if (!t) return;
    setTimeline((prev) =>
      [
        {
          id: nanoid(),
          type: t,
          label,
          detail,
          at: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 40)
    );
  }, []);

  const dispatchAgent = useCallback(
    (event: AgentStateEvent) => {
      rawDispatch(event);
      if (event.type === "request_start") {
        pushTimeline(event, "Agent started processing your message");
      } else if (event.type === "tool_start") {
        pushTimeline(event, "Tool invoked", "Running agent tool");
      } else if (event.type === "tool_done") {
        pushTimeline(event, "Tool finished");
      } else if (event.type === "render_result") {
        pushTimeline(event, "Rendering response");
      } else if (event.type === "error") {
        pushTimeline(event, "Something went wrong");
      } else if (event.type === "done") {
        pushTimeline(event, "Turn complete");
      }
    },
    [pushTimeline]
  );

  const beginTurn = useCallback(
    (userQuery: string) => {
      dispatchAgent({ type: "reset" });
      dispatchAgent({ type: "request_start" });
      dispatchAgent({ type: "thinking" });
      const id = nanoid();
      setCurrentTask({
        id,
        title: userQuery.slice(0, 120) + (userQuery.length > 120 ? "…" : ""),
        stage: "queued",
        currentAction: "Queued — waiting for the model",
        startedAt: new Date().toISOString(),
        progress01: 0.05,
      });
    },
    [dispatchAgent]
  );

  const recordToolCalls = useCallback(
    (tools: AgentToolCallWire[]) => {
      if (!tools.length) return;
      dispatchAgent({ type: "tool_start" });
      if (tools.some((t) => t.type === "search")) {
        dispatchAgent({ type: "search_wait" });
      }
      const stage = mapStageFromTools(tools);
      const label =
        tools[0]?.type === "search"
          ? "Agent is searching Stellar docs"
          : tools[0]?.type === "blockchain_lookup"
            ? "Agent is checking Stellar context"
            : "Agent invoked a tool";
      pushTimeline({ type: "tool_start" }, label, tools.map((x) => x.name).join(", "));
      setCurrentTask((prev) =>
        prev
          ? {
              ...prev,
              stage,
              currentAction: label,
              progress01: Math.min(0.85, prev.progress01 + 0.35),
            }
          : prev
      );
      dispatchAgent({ type: "tool_done" });
      dispatchAgent({ type: "render_result" });
    },
    [dispatchAgent, pushTimeline]
  );

  const finishTurn = useCallback(
    (opts: { ok: boolean; summary?: string; error?: string }) => {
      if (opts.ok) {
        dispatchAgent({ type: "done" });
        setCurrentTask((prev) =>
          prev
            ? {
                ...prev,
                stage: "complete",
                completedAt: new Date().toISOString(),
                progress01: 1,
                resultSummary: opts.summary ?? "Response ready",
                currentAction: "Complete",
              }
            : prev
        );
      } else {
        dispatchAgent({ type: "error" });
        setCurrentTask((prev) =>
          prev
            ? {
                ...prev,
                stage: "failed",
                completedAt: new Date().toISOString(),
                progress01: 1,
                errorMessage: opts.error ?? "Failed",
                currentAction: "Failed",
              }
            : prev
        );
      }
    },
    [dispatchAgent]
  );

  const resetWorkflow = useCallback(() => {
    dispatchAgent({ type: "reset" });
    setCurrentTask(null);
  }, [dispatchAgent]);

  const value = useMemo(
    () => ({
      activity,
      dispatchAgent,
      timeline,
      currentTask,
      beginTurn,
      recordToolCalls,
      finishTurn,
      resetWorkflow,
    }),
    [
      activity,
      dispatchAgent,
      timeline,
      currentTask,
      beginTurn,
      recordToolCalls,
      finishTurn,
      resetWorkflow,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAgentWorkflow(): AgentWorkflowContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAgentWorkflow must be used within AgentWorkflowProvider");
  return v;
}
