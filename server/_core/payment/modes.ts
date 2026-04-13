import type { PaymentAsset, PaymentMode, PaymentPolicy, StellarPaymentNetwork } from "@shared/paymentTypes";

export const DEMO_PLACEHOLDER_PAYEE =
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

export function defaultPaymentPolicy(payee: string): PaymentPolicy {
  return {
    serviceId: "agent.tools",
    defaultMode: "per_request",
    perRequestAmount: 0.001,
    asset: { code: "USDC" },
    payee,
    sessionMinCap: 0.05,
  };
}

export function assetDisplay(a: PaymentAsset): string {
  return a.issuer ? `${a.code}:${a.issuer.slice(0, 8)}…` : a.code;
}

export function describeMode(mode: PaymentMode): string {
  switch (mode) {
    case "per_request":
      return "Per-request (x402-style HTTP-native)";
    case "prepaid_credits":
      return "Prepaid credits";
    case "session_streaming":
      return "Session / streaming (MPP-style channel intent)";
    case "demo_free":
      return "Demo — free";
    default:
      return mode;
  }
}

export function stellarInstructions(
  network: StellarPaymentNetwork,
  authEntryRequired: boolean
): string {
  const net = network === "mainnet" ? "Stellar Mainnet" : "Stellar Testnet";
  if (authEntryRequired) {
    return `${net}: approve Soroban authorization entry via Freighter (browser extension). Freighter Mobile does not support x402 auth entries today.`;
  }
  return `${net}: connect a Soroban-capable wallet for full x402 authorization when enabled.`;
}
