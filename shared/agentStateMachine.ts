import type { AgentActivityState, AgentTimelineEventType } from "./appConnectionModel";

export type AgentStateEvent =
  | { type: "reset" }
  | { type: "request_start" }
  | { type: "thinking" }
  | { type: "planning" }
  | { type: "tool_start" }
  | { type: "tool_done" }
  | { type: "render_result" }
  | { type: "error" }
  | { type: "done" }
  | { type: "wallet_wait" }
  | { type: "wallet_ready" }
  | { type: "search_wait" };

export function reduceAgentActivity(
  state: AgentActivityState,
  event: AgentStateEvent
): AgentActivityState {
  switch (event.type) {
    case "reset":
      return "idle";
    case "request_start":
      if (state === "idle" || state === "error" || state === "rendering_result") return "thinking";
      return state;
    case "thinking":
      return "thinking";
    case "planning":
      return "planning";
    case "tool_start":
      return "calling_tool";
    case "search_wait":
      return "waiting_search";
    case "wallet_wait":
      return "waiting_wallet";
    case "wallet_ready":
      return "calling_tool";
    case "tool_done":
      if (state === "waiting_search" || state === "calling_tool") return "thinking";
      return state;
    case "render_result":
      return "rendering_result";
    case "error":
      return "error";
    case "done":
      return "idle";
    default:
      return state;
  }
}

export function timelineTypeForAgentEvent(
  event: AgentStateEvent
): AgentTimelineEventType | null {
  switch (event.type) {
    case "request_start":
      return "agent_request_started";
    case "tool_start":
      return "tool_called";
    case "tool_done":
      return "tool_returned";
    case "wallet_wait":
      return "wallet_required";
    case "wallet_ready":
      return "wallet_connected";
    case "render_result":
      return "result_rendered";
    case "done":
      return "task_completed";
    case "error":
      return "task_failed";
    default:
      return null;
  }
}
