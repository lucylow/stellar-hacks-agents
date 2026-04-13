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
  AgentPaymentReceipt,
  AgentTimelineEvent,
  AgentTimelineEventType,
  AgentToolCallWire,
  AgentToolRoute,
  TaskPanelStage,
  TaskProgressSnapshot,
} from "@shared/appConnectionModel";
import {
  reduceAgentActivity,
  timelineTypeForAgentEvent,
  type AgentStateEvent,
} from "@shared/agentStateMachine";

export type BeginTurnMeta = {
  predictedRoute: AgentToolRoute;
  planLines: string[];
  needsWallet: boolean;
  walletConnected: boolean;
  requiresPayment?: boolean;
};

type AgentWorkflowContextValue = {
  activity: AgentActivityState;
  dispatchAgent: (event: AgentStateEvent) => void;
  timeline: AgentTimelineEvent[];
  currentTask: TaskProgressSnapshot | null;
  paymentReceipts: AgentPaymentReceipt[];
  beginTurn: (userQuery: string, meta?: BeginTurnMeta) => void;
  recordToolCalls: (tools: AgentToolCallWire[]) => void;
  finishTurn: (opts: { ok: boolean; summary?: string; error?: string }) => void;
  resetWorkflow: () => void;
  appendPaymentReceipt: (r: AgentPaymentReceipt) => void;
  patchCurrentTask: (patch: Partial<TaskProgressSnapshot>) => void;
  emitTimeline: (type: AgentTimelineEventType, label: string, detail?: string) => void;
};

const Ctx = createContext<AgentWorkflowContextValue | null>(null);

function mapStageFromTools(tools: AgentToolCallWire[]): TaskPanelStage {
  const t = tools[0]?.type;
  if (t === "search") return "searching";
  if (t === "blockchain_lookup" || t === "balance_check") return "fetching_account";
  return "tool_execution";
}

function resolveRouteFromTools(tools: AgentToolCallWire[]): AgentToolRoute | undefined {
  const types = new Set(tools.map((x) => x.type));
  const hasSearch = types.has("search");
  const hasBc = types.has("blockchain_lookup") || types.has("balance_check");
  if (hasSearch && hasBc) return "mixed";
  if (hasSearch) return "search";
  if (hasBc) return "blockchain_lookup";
  return undefined;
}

export function AgentWorkflowProvider({ children }: { children: ReactNode }) {
  const [activity, rawDispatch] = useReducer(reduceAgentActivity, "idle");
  const [timeline, setTimeline] = useState<AgentTimelineEvent[]>([]);
  const [currentTask, setCurrentTask] = useState<TaskProgressSnapshot | null>(null);
  const [paymentReceipts, setPaymentReceipts] = useState<AgentPaymentReceipt[]>([]);

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

  const appendPaymentReceipt = useCallback((r: AgentPaymentReceipt) => {
    setPaymentReceipts((prev) => [r, ...prev].slice(0, 25));
  }, []);

  const patchCurrentTask = useCallback((patch: Partial<TaskProgressSnapshot>) => {
    setCurrentTask((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const emitTimeline = useCallback((type: AgentTimelineEventType, label: string, detail?: string) => {
    setTimeline((prev) =>
      [
        {
          id: nanoid(),
          type,
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
      } else if (event.type === "planning") {
        pushTimeline(event, "Plan drafted", "Routing tools and checking wallet / payment");
      } else if (event.type === "tool_select") {
        pushTimeline(event, "Tool selected", "Preparing invocation");
      } else if (event.type === "search_wait") {
        pushTimeline(event, "Search in progress");
      } else if (event.type === "blockchain_wait") {
        pushTimeline(event, "Blockchain lookup in progress");
      } else if (event.type === "payment_required") {
        pushTimeline(event, "Payment required (x402 demo)", "Authorize to unlock this turn");
      } else if (event.type === "payment_authorizing") {
        pushTimeline(event, "Awaiting wallet authorization", "Freighter / Soroban auth entry (simulated)");
      } else if (event.type === "settling") {
        pushTimeline(event, "Settling on Stellar", "Demo settlement trace");
      } else if (event.type === "payment_settled") {
        pushTimeline(event, "Payment settled", "Tools unlocked for this request");
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
    (userQuery: string, meta?: BeginTurnMeta) => {
      dispatchAgent({ type: "reset" });
      dispatchAgent({ type: "request_start" });
      dispatchAgent({ type: "thinking" });
      dispatchAgent({ type: "planning" });
      const id = nanoid();
      let stage: TaskPanelStage = "planning";
      let currentAction = "Understanding your request and building a short plan";
      if (meta?.requiresPayment) {
        stage = "planning";
        currentAction = "Planning — a payment step may be required for this turn";
      } else if (meta?.needsWallet && !meta.walletConnected) {
        stage = "wallet_needed";
        currentAction = "Wallet context recommended — connect Freighter for live Stellar data";
      } else {
        stage = "queued";
        currentAction = "Queued — preparing tool routing";
      }
      setCurrentTask({
        id,
        title: userQuery.slice(0, 120) + (userQuery.length > 120 ? "…" : ""),
        stage,
        currentAction,
        startedAt: new Date().toISOString(),
        progress01: 0.08,
        predictedRoute: meta?.predictedRoute,
        planLines: meta?.planLines,
        needsWallet: meta?.needsWallet,
        usedPaymentFlow: meta?.requiresPayment,
      });
    },
    [dispatchAgent]
  );

  const recordToolCalls = useCallback(
    (tools: AgentToolCallWire[]) => {
      if (!tools.length) return;
      dispatchAgent({ type: "tool_select" });
      dispatchAgent({ type: "tool_start" });
      const hasSearch = tools.some((t) => t.type === "search");
      const hasBc = tools.some((t) => t.type === "blockchain_lookup" || t.type === "balance_check");
      if (hasSearch) dispatchAgent({ type: "search_wait" });
      if (hasBc) dispatchAgent({ type: "blockchain_wait" });
      if (hasBc) {
        emitTimeline("tool_called", "Stellar: account / balance context", "Aligns chat tool with Horizon-style facts");
        emitTimeline("tool_called", "Stellar: transactions & operations (if applicable)", "Structured lookup path");
        emitTimeline("tool_called", "Stellar: network sanity", "Testnet vs mainnet wording");
      }
      const stage = mapStageFromTools(tools);
      const resolvedRoute = resolveRouteFromTools(tools);
      const label =
        tools[0]?.type === "search"
          ? "Searching curated sources (demo or live)"
          : tools[0]?.type === "blockchain_lookup"
            ? "Stellar / blockchain lookup"
            : tools[0]?.type === "balance_check"
              ? "Balance / account check"
              : "Agent invoked a tool";
      emitTimeline("tool_called", label, tools.map((x) => x.name).join(", "));
      setCurrentTask((prev) =>
        prev
          ? {
              ...prev,
              stage,
              currentAction: label,
              progress01: Math.min(0.82, prev.progress01 + 0.34),
              resolvedRoute: resolvedRoute ?? prev.resolvedRoute,
            }
          : prev
      );
      dispatchAgent({ type: "tool_done" });
      emitTimeline("tool_returned", "Tool output received", tools.map((x) => `${x.name}:${x.status}`).join(" · "));
      dispatchAgent({ type: "render_result" });
      setCurrentTask((prev) =>
        prev
          ? {
              ...prev,
              stage: "synthesizing",
              currentAction: "Synthesizing assistant reply",
              progress01: Math.min(0.92, prev.progress01 + 0.08),
            }
          : prev
      );
    },
    [dispatchAgent, emitTimeline]
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
                currentAction: "Task completed",
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
      paymentReceipts,
      beginTurn,
      recordToolCalls,
      finishTurn,
      resetWorkflow,
      appendPaymentReceipt,
      patchCurrentTask,
      emitTimeline,
    }),
    [
      activity,
      dispatchAgent,
      timeline,
      currentTask,
      paymentReceipts,
      beginTurn,
      recordToolCalls,
      finishTurn,
      resetWorkflow,
      appendPaymentReceipt,
      patchCurrentTask,
      emitTimeline,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAgentWorkflow(): AgentWorkflowContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAgentWorkflow must be used within AgentWorkflowProvider");
  return v;
}
