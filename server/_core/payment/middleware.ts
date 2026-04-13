import type { PaymentErrorCode, PaymentRouteInput, StellarPaymentNetwork } from "@shared/paymentTypes";
import { selectPaymentMode } from "./routing";
import { createQuote, type CreateQuoteParams } from "./quotes";
import { DEMO_PLACEHOLDER_PAYEE } from "./modes";
import { getCreditBalance } from "./credits";
import { pushPaymentEvent } from "./events";
import { ENV } from "../env";

export type WalletReadinessInput = {
  walletConnected: boolean;
  networkMatchesApp: boolean;
  authEntrySigningAvailable: boolean;
  /** Parsed XLM numeric balance when known */
  xlmBalance?: number;
  minXlmForFees?: number;
};

export type WalletReadinessResult =
  | { ok: true }
  | { ok: false; code: PaymentErrorCode; message: string };

/**
 * Server-side gate from client-reported wallet capabilities (browser checks Freighter).
 */
export function evaluateWalletReadiness(
  input: WalletReadinessInput & { requireAuthEntry?: boolean }
): WalletReadinessResult {
  const requireAuth = input.requireAuthEntry ?? true;
  if (!input.walletConnected) {
    return { ok: false, code: "wallet_not_connected", message: "Connect Freighter to continue with payment." };
  }
  if (!input.networkMatchesApp) {
    return { ok: false, code: "wrong_network", message: "Switch Freighter to the same network as the app." };
  }
  if (requireAuth && !input.authEntrySigningAvailable) {
    return {
      ok: false,
      code: "auth_entry_unavailable",
      message:
        "This wallet cannot sign Soroban auth entries (x402 on Stellar). Use Freighter browser extension on desktop.",
    };
  }
  const min = input.minXlmForFees ?? 0.00001;
  if (input.xlmBalance != null && input.xlmBalance < min) {
    return {
      ok: false,
      code: "insufficient_balance",
      message: "XLM balance looks too low for fees and authorization experiments.",
    };
  }
  return { ok: true };
}

export function logWalletCapabilityCheck(payer: string | undefined, ok: boolean, detail: string): void {
  pushPaymentEvent("wallet_capability_checked", detail, {
    payer,
    meta: { ok },
  });
}

export type QuoteForAgentToolParams = {
  routeInput: PaymentRouteInput;
  serviceId: string;
  requestId: string;
  idempotencyKey: string;
  payer: string | null;
  network: StellarPaymentNetwork;
  serviceDescription: string;
  payee?: string;
  authRequiredOverride?: boolean;
};

/**
 * Picks mode then issues a quote (or demo_free with zero quote when applicable).
 */
export function quoteForAgentRequest(params: QuoteForAgentToolParams) {
  const { mode, reason } = selectPaymentMode(params.routeInput);
  const payee =
    params.payee ?? (ENV.paymentPayeePublicKey.length > 0 ? ENV.paymentPayeePublicKey : DEMO_PLACEHOLDER_PAYEE);
  const authEntrySigningRequired =
    params.authRequiredOverride ??
    (mode === "session_streaming" && Boolean(params.routeInput.activeSessionId)
      ? false
      : params.routeInput.walletSupportsAuthEntry);

  if (mode === "demo_free") {
    return {
      mode,
      routeReason: reason,
      challenge: null as ReturnType<typeof createQuote>["challenge"] | null,
      reused: false,
    };
  }

  const authForQuote =
    mode === "per_request"
      ? true
      : mode === "prepaid_credits"
        ? false
        : mode === "session_streaming" && Boolean(params.routeInput.activeSessionId)
          ? false
          : authEntrySigningRequired;

  const createParams: CreateQuoteParams = {
    serviceId: params.serviceId,
    requestId: params.requestId,
    idempotencyKey: params.idempotencyKey,
    payer: params.payer,
    network: params.network,
    mode,
    payee,
    serviceDescription: params.serviceDescription,
    authEntrySigningRequired: authForQuote,
    sessionId: mode === "session_streaming" ? params.routeInput.activeSessionId : undefined,
  };

  const { challenge, reused } = createQuote(createParams);
  return { mode, routeReason: reason, challenge, reused };
}

export function hydrateRouteInput(partial: Partial<PaymentRouteInput> & { wallet: string }): PaymentRouteInput {
  return {
    requestType: partial.requestType ?? "unknown",
    estimatedCost: partial.estimatedCost ?? 0.001,
    expectedCallCount: partial.expectedCallCount ?? 1,
    streamingOrBurst: partial.streamingOrBurst ?? false,
    userPreferredMode: partial.userPreferredMode,
    demoMode: partial.demoMode ?? false,
    walletConnected: partial.walletConnected ?? true,
    walletSupportsAuthEntry: partial.walletSupportsAuthEntry ?? false,
    creditBalance: partial.creditBalance ?? getCreditBalance(partial.wallet),
    activeSessionId: partial.activeSessionId,
  };
}
