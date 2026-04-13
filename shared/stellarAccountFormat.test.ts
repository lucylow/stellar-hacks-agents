import { describe, expect, it } from "vitest";
import {
  formatXlmBalance,
  truncatePublicKey,
  mapHorizonError,
  mapAccountData,
} from "./stellarAccountFormat";

describe("formatXlmBalance", () => {
  it("formats native balance strings", () => {
    expect(formatXlmBalance("10.5")).toBe("10.5000000");
    expect(formatXlmBalance(undefined)).toBe("0");
    expect(formatXlmBalance("not-a-number")).toBe("0");
  });
});

describe("truncatePublicKey", () => {
  it("shortens long keys", () => {
    const k = "G".repeat(56);
    expect(truncatePublicKey(k, 4, 4)).toBe("GGGG…GGGG");
  });
  it("returns short keys unchanged", () => {
    expect(truncatePublicKey("abc")).toBe("abc");
  });
});

describe("mapHorizonError", () => {
  it("classifies not found", () => {
    const m = mapHorizonError(new Error("Not Found: 404"));
    expect(m.kind).toBe("not_found");
    expect(m.userMessage.length).toBeGreaterThan(10);
  });
});

describe("mapAccountData", () => {
  it("maps horizon-like shapes", () => {
    const a = mapAccountData({
      publicKey: "GTEST",
      network: "testnet",
      balances: [{ asset_type: "native", balance: "123.456" }],
      sequence: "42",
      subentry_count: 3,
      id: "GTEST",
    });
    expect(a.balance).toBe("123.456");
    expect(a.sequenceNumber).toBe("42");
    expect(a.subentryCount).toBe(3);
    expect(a.network).toBe("testnet");
  });
});
