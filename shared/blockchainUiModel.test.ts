import { describe, expect, it } from "vitest";
import { deriveBlockchainSurfaceState } from "./blockchainUiModel";

describe("deriveBlockchainSurfaceState", () => {
  const base = {
    freighterDetected: true as boolean | null,
    publicKey: null as string | null,
    isAccountSyncing: false,
    account: null,
    refreshError: null as string | null,
    isFetchingTransactions: false,
    isFetchingOperations: false,
    isFetchingNetwork: false,
    txsError: null as string | null,
    opsError: null as string | null,
    networkError: null as string | null,
    agentBlockchainLookup: undefined as "idle" | "running" | "completed" | "failed" | undefined,
  };

  it("prefers agent blockchain lookup running", () => {
    expect(
      deriveBlockchainSurfaceState({
        ...base,
        walletStatus: "connected",
        publicKey: "GTEST",
        account: { publicKey: "GTEST" } as never,
        agentBlockchainLookup: "running",
      })
    ).toBe("blockchain_lookup_running");
  });

  it("maps detecting wallet", () => {
    expect(
      deriveBlockchainSurfaceState({
        ...base,
        walletStatus: "detecting",
      })
    ).toBe("wallet_detecting");
  });

  it("maps disconnected when Freighter missing", () => {
    expect(
      deriveBlockchainSurfaceState({
        ...base,
        walletStatus: "disconnected",
        freighterDetected: false,
      })
    ).toBe("wallet_disconnected");
  });

  it("maps fetching account when syncing", () => {
    expect(
      deriveBlockchainSurfaceState({
        ...base,
        walletStatus: "connected",
        publicKey: "GTEST",
        isAccountSyncing: true,
      })
    ).toBe("fetching_account");
  });
});
