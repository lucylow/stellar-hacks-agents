import { useCallback, useEffect, useRef, useState } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";
import type { StellarNetworkMode } from "@shared/stellarHorizon";
import { getHorizonUrl } from "@shared/stellarHorizon";
import {
  formatXlmBalance,
  mapAccountData,
  mapHorizonError,
  type StellarAccountSummary,
} from "@shared/stellarAccountFormat";
import type { WalletStatus } from "@shared/appConnectionModel";

const STORAGE_CONNECTED = "stellar_wallet_connected";
const STORAGE_NETWORK = "stellar_network_mode";

function loadNetwork(): StellarNetworkMode {
  if (typeof window === "undefined") return "testnet";
  const v = window.localStorage.getItem(STORAGE_NETWORK);
  return v === "mainnet" ? "mainnet" : "testnet";
}

function freighterErrMessage(e: unknown): string {
  if (e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  return String(e);
}

/** User-initiated connect — may open Freighter approval UI */
async function freighterRequestAddress(): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Wallet connection requires a browser environment.");
  }
  const { requestAccess } = await import("@stellar/freighter-api");
  const res = await requestAccess();
  if (res.error) {
    throw new Error(freighterErrMessage(res.error) || "Freighter denied access.");
  }
  if (!res.address) {
    throw new Error("Freighter did not return a Stellar address.");
  }
  return res.address;
}

/** Silent read when extension already authorized this site */
async function freighterReadAddressIfAuthorized(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const { isConnected, getAddress } = await import("@stellar/freighter-api");
  const conn = await isConnected();
  if (conn.error || !conn.isConnected) return null;
  const addr = await getAddress();
  if (addr.error || !addr.address) return null;
  return addr.address;
}

async function detectFreighterInstalled(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { isConnected } = await import("@stellar/freighter-api");
    const res = await isConnected();
    return !res.error;
  } catch {
    return Boolean(window.freighterApi?.getPublicKey);
  }
}

function horizonFor(network: StellarNetworkMode) {
  return new StellarSdk.Horizon.Server(getHorizonUrl(network), {
    allowHttp: network === "testnet",
  });
}

export async function fetchStellarAccountSummary(
  publicKey: string,
  network: StellarNetworkMode
): Promise<StellarAccountSummary> {
  const server = horizonFor(network);
  const account = await server.accounts().accountId(publicKey).call();
  return mapAccountData({
    publicKey,
    network,
    balances: account.balances as Array<{ asset_type?: string; balance?: string }>,
    sequence: account.sequence,
    subentry_count: account.subentry_count,
    id: account.id,
  });
}

export type StellarWalletValue = {
  status: WalletStatus;
  /** Same as `status` — stable name for UI that expects a “lifecycle” */
  lifecycle: WalletStatus;
  isConnecting: boolean;
  isDetecting: boolean;
  isConnected: boolean;
  publicKey: string | null;
  balance: string;
  accountSequence: string | null;
  subentryCount: number | null;
  account: StellarAccountSummary | null;
  network: StellarNetworkMode;
  networkLabel: string;
  horizonUrl: string;
  providerName: string | null;
  error: string | null;
  refreshError: string | null;
  lastRefreshedAt: string | null;
  freighterDetected: boolean | null;
  /** Alias of `freighterDetected` for headers and CTAs */
  freighterAvailable: boolean | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshAccount: () => Promise<void>;
  setNetwork: (n: StellarNetworkMode) => void;
};

/**
 * Internal wallet state hook — use `useStellarWallet` from `StellarWalletContext` in UI.
 */
export function useStellarWalletState(): StellarWalletValue {
  const [status, setStatus] = useState<WalletStatus>("idle");
  const [network, setNetworkState] = useState<StellarNetworkMode>(loadNetwork);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [account, setAccount] = useState<StellarAccountSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [freighterDetected, setFreighterDetected] = useState<boolean | null>(null);

  const cancelledRef = useRef(false);
  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const applyAccount = useCallback((a: StellarAccountSummary) => {
    setAccount(a);
    setPublicKey(a.publicKey);
    setLastRefreshedAt(new Date().toISOString());
    setRefreshError(null);
  }, []);

  const refreshAccount = useCallback(async () => {
    if (!publicKey) return;
    setStatus((s) => (s === "connected" ? "connected" : s));
    try {
      const data = await fetchStellarAccountSummary(publicKey, network);
      if (cancelledRef.current) return;
      applyAccount(data);
    } catch (err) {
      if (cancelledRef.current) return;
      const mapped = mapHorizonError(err);
      console.error("[useStellarWallet] refreshAccount", mapped.developerDetail);
      setRefreshError(mapped.userMessage);
    }
  }, [publicKey, network, applyAccount]);

  const setNetwork = useCallback(
    (n: StellarNetworkMode) => {
      window.localStorage.setItem(STORAGE_NETWORK, n);
      setNetworkState(n);
      if (publicKey) {
        void (async () => {
          try {
            const data = await fetchStellarAccountSummary(publicKey, n);
            if (cancelledRef.current) return;
            applyAccount(data);
          } catch (err) {
            if (cancelledRef.current) return;
            setAccount(null);
            const mapped = mapHorizonError(err);
            setRefreshError(mapped.userMessage);
            console.error("[useStellarWallet] setNetwork refetch", mapped.developerDetail);
          }
        })();
      }
    },
    [publicKey, applyAccount]
  );

  const connectWallet = useCallback(async () => {
    setError(null);
    setRefreshError(null);
    setStatus("connecting");
    try {
      const pk = await freighterRequestAddress();
      if (cancelledRef.current) return;
      setPublicKey(pk);
      window.localStorage.setItem(STORAGE_CONNECTED, "true");
      setStatus("connected");
      try {
        const data = await fetchStellarAccountSummary(pk, network);
        if (cancelledRef.current) return;
        applyAccount(data);
      } catch (horizonErr) {
        if (cancelledRef.current) return;
        setAccount(null);
        const mapped = mapHorizonError(horizonErr);
        setRefreshError(mapped.userMessage);
        console.error("[useStellarWallet] connectWallet horizon", mapped.developerDetail);
      }
    } catch (err) {
      if (cancelledRef.current) return;
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setAccount(null);
      setPublicKey(null);
      setStatus("error");
      window.localStorage.removeItem(STORAGE_CONNECTED);
    }
  }, [network, applyAccount]);

  const disconnectWallet = useCallback(() => {
    window.localStorage.removeItem(STORAGE_CONNECTED);
    setPublicKey(null);
    setAccount(null);
    setError(null);
    setRefreshError(null);
    setLastRefreshedAt(null);
    setStatus("disconnected");
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setStatus("detecting");
      const installed = await detectFreighterInstalled();
      if (!alive) return;
      setFreighterDetected(installed);

      const wasConnected = window.localStorage.getItem(STORAGE_CONNECTED) === "true";
      const net = loadNetwork();

      if (wasConnected && !installed) {
        window.localStorage.removeItem(STORAGE_CONNECTED);
        if (alive) setStatus("disconnected");
        return;
      }

      if (wasConnected && installed) {
        setStatus("connecting");
        try {
          const pk = await freighterReadAddressIfAuthorized();
          if (!alive) return;
          if (!pk) {
            window.localStorage.removeItem(STORAGE_CONNECTED);
            setStatus("disconnected");
            setError("Approve Freighter again to reconnect.");
            return;
          }
          setPublicKey(pk);
          setStatus("connected");
          window.localStorage.setItem(STORAGE_CONNECTED, "true");
          try {
            const data = await fetchStellarAccountSummary(pk, net);
            if (!alive) return;
            setAccount(data);
            setPublicKey(data.publicKey);
            setLastRefreshedAt(new Date().toISOString());
            setRefreshError(null);
            setError(null);
          } catch (horizonErr) {
            if (!alive) return;
            setAccount(null);
            const mapped = mapHorizonError(horizonErr);
            setRefreshError(mapped.userMessage);
            console.error("[useStellarWallet] reconnect horizon", mapped.developerDetail);
          }
        } catch (err) {
          if (!alive) return;
          window.localStorage.removeItem(STORAGE_CONNECTED);
          setAccount(null);
          setPublicKey(null);
          setError(err instanceof Error ? err.message : String(err));
          setStatus("error");
        }
      } else if (alive) {
        setStatus(installed ? "idle" : "disconnected");
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount for detection + optional reconnect
  }, []);

  const isConnected = status === "connected" && Boolean(publicKey);
  const networkLabel = network === "mainnet" ? "Mainnet" : "Testnet";
  const horizonUrl = getHorizonUrl(network);

  return {
    status,
    lifecycle: status,
    isConnecting: status === "connecting",
    isDetecting: status === "detecting",
    isConnected,
    publicKey,
    balance: account ? formatXlmBalance(account.balance) : "—",
    accountSequence: account?.sequenceNumber ?? null,
    subentryCount: account?.subentryCount ?? null,
    account,
    network,
    networkLabel,
    horizonUrl,
    providerName: freighterDetected ? "Freighter" : null,
    error,
    refreshError,
    lastRefreshedAt,
    freighterDetected,
    freighterAvailable: freighterDetected,
    connectWallet,
    disconnectWallet,
    refreshAccount,
    setNetwork,
  };
}

declare global {
  interface Window {
    freighterApi?: {
      getPublicKey: () => Promise<string>;
      signTransaction: (
        transactionXdr: string,
        options?: { network?: string }
      ) => Promise<string>;
      signAuthEntry: (authEntry: string) => Promise<string>;
      isConnected: () => Promise<boolean>;
    };
  }
}
