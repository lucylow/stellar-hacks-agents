export type StellarNetworkMode = "mainnet" | "testnet";

export const HORIZON_URLS: Record<StellarNetworkMode, string> = {
  mainnet: "https://horizon.stellar.org",
  testnet: "https://horizon-testnet.stellar.org",
};

export const STELLAR_NETWORK_PASSPHRASE: Record<StellarNetworkMode, string> = {
  mainnet: "Public Global Stellar Network ; September 2015",
  testnet: "Test SDF Network ; September 2015",
};

export function getHorizonUrl(network: StellarNetworkMode): string {
  return HORIZON_URLS[network];
}
