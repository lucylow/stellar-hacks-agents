import { describe, expect, it } from "vitest";
import { reduceAgentActivity } from "./agentStateMachine";

describe("reduceAgentActivity", () => {
  it("starts a turn from idle", () => {
    expect(reduceAgentActivity("idle", { type: "request_start" })).toBe("thinking");
  });

  it("enters tool state", () => {
    expect(reduceAgentActivity("thinking", { type: "tool_start" })).toBe("calling_tool");
  });

  it("returns to thinking after tool", () => {
    expect(reduceAgentActivity("calling_tool", { type: "tool_done" })).toBe("thinking");
  });

  it("reset clears to idle", () => {
    expect(reduceAgentActivity("calling_tool", { type: "reset" })).toBe("idle");
  });
});
