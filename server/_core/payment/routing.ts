import type { PaymentMode, PaymentRouteInput, PaymentRouteResult } from "@shared/paymentTypes";

/**
 * Data-driven mode selection: per-request, prepaid, session, or demo-free.
 */
export function selectPaymentMode(input: PaymentRouteInput): PaymentRouteResult {
  if (input.demoMode) {
    return { mode: "demo_free", reason: "Demo mode — no settlement required." };
  }

  if (!input.walletConnected) {
    return {
      mode: "per_request",
      reason: "Wallet not connected; per-request quote will apply once a payer address is available.",
      fallbackFrom: "prepaid_credits",
    };
  }

  if (input.userPreferredMode && input.userPreferredMode !== "auto") {
    const m = input.userPreferredMode;
    if (m === "session_streaming" && !input.walletSupportsAuthEntry) {
      return {
        mode: "per_request",
        reason: "Session streaming needs auth-entry signing; wallet cannot sign — falling back to per-request.",
        fallbackFrom: "session_streaming",
      };
    }
    if (m === "prepaid_credits" && input.creditBalance <= 0) {
      return {
        mode: "per_request",
        reason: "Prepaid credits empty — use per-request or top up.",
        fallbackFrom: "prepaid_credits",
      };
    }
    return { mode: m, reason: `User preference: ${m}.` };
  }

  if (input.activeSessionId && input.walletSupportsAuthEntry) {
    return {
      mode: "session_streaming",
      reason: "Active payment session — amortize high-frequency calls off-chain.",
    };
  }

  if (input.streamingOrBurst && input.expectedCallCount > 3 && input.walletSupportsAuthEntry) {
    return {
      mode: "session_streaming",
      reason: "Streaming / burst workload with many calls — session settlement is appropriate.",
    };
  }

  if (input.expectedCallCount > 1 && input.creditBalance >= input.estimatedCost) {
    return {
      mode: "prepaid_credits",
      reason: "Sufficient prepaid balance for multiple discrete calls.",
    };
  }

  if (!input.walletSupportsAuthEntry) {
    return {
      mode: "per_request",
      reason: "Auth-entry signing unavailable (e.g. Freighter Mobile) — limited to quoted per-request flow when supported.",
    };
  }

  return {
    mode: "per_request",
    reason: "Default: one quote, one authorization, one settlement per action (x402-style).",
  };
}

export function isPaidMode(mode: PaymentMode): boolean {
  return mode !== "demo_free";
}
