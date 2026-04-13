import type { StellarNetworkMode } from "./stellarHorizon";

export type HorizonErrorKind =
  | "not_found"
  | "rate_limit"
  | "network"
  | "bad_request"
  | "unknown";

export type NormalizedHorizonError = {
  kind: HorizonErrorKind;
  title: string;
  userMessage: string;
  developerDetail: string;
};

/** Safe XLM display from a Horizon balance string */
export function formatXlmBalance(raw: string | undefined | null, decimals = 7): string {
  if (raw == null || raw === "") return "0";
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return "0";
  return n.toFixed(decimals);
}

export function truncatePublicKey(key: string, head = 6, tail = 4): string {
  if (!key || key.length <= head + tail + 1) return key;
  return `${key.slice(0, head)}…${key.slice(-tail)}`;
}

export function mapHorizonError(err: unknown): NormalizedHorizonError {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (lower.includes("not found") || lower.includes("404")) {
    return {
      kind: "not_found",
      title: "Account not found",
      userMessage:
        "This public key has no funded account on the selected network yet, or the network mode does not match your wallet.",
      developerDetail: raw,
    };
  }

  if (lower.includes("429") || lower.includes("rate limit")) {
    return {
      kind: "rate_limit",
      title: "Horizon rate limited",
      userMessage: "Stellar Horizon is busy. Wait a moment and try again.",
      developerDetail: raw,
    };
  }

  if (
    lower.includes("network") ||
    lower.includes("fetch") ||
    lower.includes("econnrefused") ||
    lower.includes("failed to fetch")
  ) {
    return {
      kind: "network",
      title: "Network error",
      userMessage: "Could not reach Stellar Horizon. Check your connection or try another network mode.",
      developerDetail: raw,
    };
  }

  if (lower.includes("400") || lower.includes("bad request")) {
    return {
      kind: "bad_request",
      title: "Invalid request",
      userMessage: "Horizon rejected the request. Verify the public key and network.",
      developerDetail: raw,
    };
  }

  return {
    kind: "unknown",
    title: "Unexpected error",
    userMessage: "Something went wrong while loading Stellar data.",
    developerDetail: raw,
  };
}

/** Minimal Horizon account fields we care about — keeps client/server aligned */
export type StellarAccountSummary = {
  publicKey: string;
  balance: string;
  sequenceNumber: string;
  subentryCount: number;
  id: string;
  network: StellarNetworkMode;
};

export function mapAccountData(params: {
  publicKey: string;
  network: StellarNetworkMode;
  balances: Array<{ asset_type?: string; balance?: string }>;
  sequence: string | number | bigint;
  subentry_count?: number;
  id?: string;
}): StellarAccountSummary {
  const native =
    params.balances.find((b) => b.asset_type === "native")?.balance ?? "0";
  const seq =
    typeof params.sequence === "bigint"
      ? params.sequence.toString()
      : String(params.sequence ?? "0");
  const sub =
    typeof params.subentry_count === "number" && Number.isFinite(params.subentry_count)
      ? params.subentry_count
      : 0;
  const id = params.id ?? params.publicKey;

  return {
    publicKey: params.publicKey,
    balance: native,
    sequenceNumber: seq,
    subentryCount: sub,
    id,
    network: params.network,
  };
}
