import type { AgentActivityState, TaskProgressSnapshot } from "@shared/appConnectionModel";

/**
 * Plain-language copy for the visible “agent plan” strip — mirrors task panel + state machine
 * so users aren’t guessing why the UI paused.
 */
export function agentStepNarrative(
  activity: AgentActivityState,
  task: TaskProgressSnapshot | null,
  walletConnected: boolean,
  networkLabel?: string
): string {
  const net = networkLabel ? ` on ${networkLabel}` : "";
  if (task?.stage === "failed" && task.errorMessage) {
    return `Stopped: ${task.errorMessage}`;
  }
  if (task?.stage === "complete" && task.resultSummary) {
    return task.resultSummary;
  }
  if (task?.stage === "wallet_needed" && !walletConnected) {
    return "I’m looking up your account context — connect Freighter for live Stellar data.";
  }
  if (task?.stage === "payment_required") {
    return "This turn needs the demo x402 authorization before search and ledger tools run.";
  }
  if (task?.stage === "payment_approval_pending" || activity === "payment_authorizing") {
    return "Waiting for wallet approval (demo settlement).";
  }
  if (task?.stage === "settling" || activity === "settling") {
    return "Settling the demo payment trace on Stellar…";
  }
  if (task?.stage === "searching" || activity === "waiting_search") {
    return "I’m checking the latest Stellar information from search sources.";
  }
  if (task?.stage === "fetching_account" || activity === "looking_up_blockchain") {
    return `I’m running a Stellar blockchain lookup${net} — structured snippets, not raw Horizon JSON.`;
  }
  if (task?.stage === "synthesizing" || activity === "streaming" || activity === "rendering_result") {
    return "I’m combining results and writing your answer.";
  }
  if (activity === "thinking" || activity === "planning") {
    return "I’m understanding your request and planning the next step.";
  }
  if (activity === "tool_selection" || activity === "calling_tool") {
    return "I’m choosing and running an agent tool (search or Stellar lookup).";
  }
  if (activity === "waiting_wallet") {
    return "I’m waiting on wallet context before continuing.";
  }
  if (task?.currentAction) {
    return task.currentAction;
  }
  if (activity === "idle") {
    return "Ready when you are — ask about Stellar, wallets, or try a demo x402 prompt.";
  }
  return "Working on your request…";
}
