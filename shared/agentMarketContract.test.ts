import { describe, expect, it } from "vitest";
import { AgentMarketContractErrorCode, agentMarketErrorNameFromCode } from "./agentMarketContract";

describe("agentMarketContract", () => {
  it("maps error codes to names", () => {
    expect(agentMarketErrorNameFromCode(AgentMarketContractErrorCode.Unauthorized)).toBe("Unauthorized");
    expect(agentMarketErrorNameFromCode(999)).toBe("Unknown");
  });
});
