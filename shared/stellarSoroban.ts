import type { StellarNetworkMode } from "./stellarHorizon";

/** Default Soroban RPC endpoints (testnet-first). Override with `SOROBAN_RPC_URL`. */
export const DEFAULT_SOROBAN_RPC_URL: Record<StellarNetworkMode, string> = {
  testnet: "https://soroban-testnet.stellar.org",
  mainnet: "https://soroban-mainnet.stellar.org",
};

export function getSorobanRpcUrl(
  network: StellarNetworkMode,
  override?: string | null
): string {
  const t = override?.trim();
  if (t) return t;
  return DEFAULT_SOROBAN_RPC_URL[network];
}
