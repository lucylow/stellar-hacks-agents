import type { AgentActivityState, AgentTimelineEventType } from "./appConnectionModel";

export type AgentStateEvent =
  | { type: "reset" }
  | { type: "request_start" }
  | { type: "thinking" }
  | { type: "planning" }
  | { type: "tool_select" }
  | { type: "tool_start" }
  | { type: "tool_done" }
  | { type: "blockchain_wait" }
  | { type: "stream_start" }
  | { type: "stream_end" }
  | { type: "render_result" }
  | { type: "error" }
  | { type: "done" }
  | { type: "wallet_wait" }
  | { type: "wallet_ready" }
  | { type: "search_wait" }
  | { type: "payment_required" }
  | { type: "payment_authorizing" }
  | { type: "payment_settled" }
  | { type: "settling" };

export function reduceAgentActivity(
  state: AgentActivityState,
  event: AgentStateEvent
): AgentActivityState {
  switch (event.type) {
    case "reset":
      return "idle";
    case "request_start":
      if (
        state === "idle" ||
        state === "error" ||
        state === "rendering_result" ||
        state === "streaming" ||
        state === "payment_required" ||
        state === "payment_authorizing" ||
        state === "settling"
      )
        return "thinking";
      return state;
    case "thinking":
      return "thinking";
    case "planning":
      return "planning";
    case "tool_select":
      return "tool_selection";
    case "tool_start":
      return "calling_tool";
    case "search_wait":
      return "waiting_search";
    case "blockchain_wait":
      return "looking_up_blockchain";
    case "payment_required":
      return "payment_required";
    case "payment_authorizing":
      return "payment_authorizing";
    case "settling":
      return "settling";
    case "payment_settled":
      if (state === "payment_authorizing" || state === "settling") return "thinking";
      return state;
    case "stream_start":
      if (state === "error") return state;
      return "streaming";
    case "stream_end":
      return "rendering_result";
    case "wallet_wait":
      return "waiting_wallet";
    case "wallet_ready":
      return "calling_tool";
    case "tool_done":
      if (
        state === "waiting_search" ||
        state === "calling_tool" ||
        state === "looking_up_blockchain"
      )
        return "thinking";
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
    case "planning":
      return "plan_ready";
    case "tool_select":
      return "tool_selected";
    case "search_wait":
      return "tool_called";
    case "blockchain_wait":
      return "tool_called";
    case "tool_start":
      return "tool_called";
    case "tool_done":
      return "tool_returned";
    case "wallet_wait":
      return "wallet_required";
    case "wallet_ready":
      return "wallet_connected";
    case "payment_required":
      return "payment_required";
    case "payment_authorizing":
      return "payment_authorized";
    case "settling":
      return "payment_settling";
    case "payment_settled":
      return "payment_settled";
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
