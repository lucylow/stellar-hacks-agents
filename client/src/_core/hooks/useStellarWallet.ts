/**
 * Wallet lifecycle (explicit UI states):
 * - idle: Freighter detected, user has not connected this session (or cleared storage).
 * - detecting: First paint — probing extension APIs (avoid treating as “missing” yet).
 * - connecting: User clicked connect, or silent reconnect after reload is in flight.
 * - connected: Address known; Horizon account may still be loading (see isAccountSyncing).
 * - disconnected: No extension, or user disconnected, or reconnect token cleared.
 * - error: User-facing connect failure (Freighter denied, wrong environment, etc.).
 *
 * Fragile areas: parallel mount/unmount (cancelledRef), network switch + Horizon errors
 * (account may clear while key remains), and “connected but no account” when Horizon fails.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";
import type { StellarNetworkMode } from "@shared/stellarHorizon";
import { getHorizonUrl, STELLAR_NETWORK_PASSPHRASE } from "@shared/stellarHorizon";
import type { StellarTxRecord, StellarOperationRecord } from "@shared/appConnectionModel";
import { deriveBlockchainSurfaceState, type BlockchainSurfaceState } from "@shared/blockchainUiModel";
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

export type StellarNetworkInfoSummary = {
  latestLedger: number;
  baseFee: string;
  baseReserve: string;
  networkPassphrase: string;
  network: StellarNetworkMode;
  horizonUrl: string;
};

export async function fetchStellarRecentTransactions(
  publicKey: string,
  network: StellarNetworkMode,
  limit = 10
): Promise<StellarTxRecord[]> {
  const server = horizonFor(network);
  const transactions = await server.transactions().forAccount(publicKey).limit(limit).order("desc").call();
  return transactions.records.map((tx) => {
    const t = tx as unknown as {
      id: string;
      hash: string;
      created_at: string;
      source_account: string;
      successful: boolean;
      type?: string;
      ledger?: number;
      ledger_attr?: number;
    };
    return {
      id: t.id,
      hash: t.hash,
      ledger: typeof t.ledger === "number" ? t.ledger : t.ledger_attr ?? 0,
      created_at: t.created_at,
      source_account: t.source_account,
      type: t.type ?? "unknown",
      successful: t.successful,
    };
  });
}

export async function fetchStellarOperations(
  publicKey: string,
  network: StellarNetworkMode,
  limit = 8
): Promise<StellarOperationRecord[]> {
  const server = horizonFor(network);
  const operations = await server.operations().forAccount(publicKey).limit(limit).order("desc").call();
  return operations.records.map((op) => {
    const o = op as {
      id: string | number;
      type?: string;
      created_at: string;
      source_account: string;
      transaction_hash: string;
    };
    return {
      id: String(o.id),
      type: o.type ?? "unknown",
      created_at: o.created_at,
      source_account: o.source_account,
      transaction_hash: o.transaction_hash,
    };
  });
}

export async function fetchStellarNetworkInfo(network: StellarNetworkMode): Promise<StellarNetworkInfoSummary> {
  const server = horizonFor(network);
  const ledger = await server.ledgers().limit(1).order("desc").call();
  const latestLedger = ledger.records[0] as {
    sequence: number;
    base_fee?: number;
    base_fee_in_stroops?: number;
    base_reserve?: number;
    base_reserve_in_stroops?: number;
  };
  return {
    latestLedger: latestLedger.sequence,
    baseFee: latestLedger.base_fee_in_stroops?.toString() ?? String(latestLedger.base_fee ?? "100"),
    baseReserve: latestLedger.base_reserve_in_stroops?.toString() ?? "5000000",
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE[network],
    network,
    horizonUrl: getHorizonUrl(network),
  };
}

export type StellarWalletValue = {
  status: WalletStatus;
  /** Same as `status` — stable name for UI that expects a “lifecycle” */
  lifecycle: WalletStatus;
  isConnecting: boolean;
  isDetecting: boolean;
  /** True while loading or refreshing Horizon account summary for the current key + network */
  isAccountSyncing: boolean;
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
  /** Alias for `setNetwork` (testnet / mainnet) */
  setNetworkMode: (n: StellarNetworkMode) => void;
  /** Horizon sequence string when account is loaded */
  sequence: string | null;
  /** Subentry count when account is loaded */
  subentries: number | null;
  /** Short phrase for status strips (wallet exists / connected / loading account / error) */
  readinessLabel: string;
  /** True when connected, Freighter present, and Horizon returned an account (not necessarily zero errors on refresh) */
  isWalletReady: boolean;
  /** Freighter extension exposes Soroban auth-entry signing (required for x402 on Stellar in browser) */
  authEntrySigningAvailable: boolean;
  /** Alias for `account` — Horizon-shaped summary */
  accountInfo: StellarAccountSummary | null;
  /** Same as `network` — UI label from README */
  networkMode: StellarNetworkMode;
  transactions: StellarTxRecord[];
  operations: StellarOperationRecord[];
  networkInfo: StellarNetworkInfoSummary | null;
  isFetchingTransactions: boolean;
  isFetchingOperations: boolean;
  isFetchingNetwork: boolean;
  transactionsError: string | null;
  operationsError: string | null;
  networkInfoError: string | null;
  refreshTransactions: () => Promise<void>;
  refreshOperations: () => Promise<void>;
  refreshNetworkInfo: () => Promise<void>;
  refreshHorizonSidecar: () => Promise<void>;
  /** Partial Horizon data (account ok but txs/ops/network failed) */
  hasPartialHorizonData: boolean;
  blockchainSurface: BlockchainSurfaceState;
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
  const [isAccountSyncing, setIsAccountSyncing] = useState(false);
  const [transactions, setTransactions] = useState<StellarTxRecord[]>([]);
  const [operations, setOperations] = useState<StellarOperationRecord[]>([]);
  const [networkInfo, setNetworkInfo] = useState<StellarNetworkInfoSummary | null>(null);
  const [isFetchingTransactions, setIsFetchingTransactions] = useState(false);
  const [isFetchingOperations, setIsFetchingOperations] = useState(false);
  const [isFetchingNetwork, setIsFetchingNetwork] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [operationsError, setOperationsError] = useState<string | null>(null);
  const [networkInfoError, setNetworkInfoError] = useState<string | null>(null);
  const [authEntrySigningAvailable, setAuthEntrySigningAvailable] = useState(false);

  const cancelledRef = useRef(false);
  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok = typeof window.freighterApi?.signAuthEntry === "function";
    setAuthEntrySigningAvailable(ok);
  }, [freighterDetected, status]);

  const applyAccount = useCallback((a: StellarAccountSummary) => {
    setAccount(a);
    setPublicKey(a.publicKey);
    setLastRefreshedAt(new Date().toISOString());
    setRefreshError(null);
  }, []);

  const clearHorizonSidecar = useCallback(() => {
    setTransactions([]);
    setOperations([]);
    setNetworkInfo(null);
    setTransactionsError(null);
    setOperationsError(null);
    setNetworkInfoError(null);
  }, []);

  /** Use explicit key + network so post-connect / reconnect runs before React state flushes. */
  const refreshHorizonSidecarForKey = useCallback(async (pk: string, net: StellarNetworkMode) => {
    setTransactionsError(null);
    setOperationsError(null);
    setNetworkInfoError(null);
    setIsFetchingTransactions(true);
    setIsFetchingOperations(true);
    setIsFetchingNetwork(true);

    const [txR, opR, netR] = await Promise.allSettled([
      fetchStellarRecentTransactions(pk, net, 10),
      fetchStellarOperations(pk, net, 8),
      fetchStellarNetworkInfo(net),
    ]);

    if (cancelledRef.current) return;

    if (txR.status === "fulfilled") {
      setTransactions(txR.value);
    } else {
      setTransactionsError(mapHorizonError(txR.reason).userMessage);
    }
    if (opR.status === "fulfilled") {
      setOperations(opR.value);
    } else {
      setOperationsError(mapHorizonError(opR.reason).userMessage);
    }
    if (netR.status === "fulfilled") {
      setNetworkInfo(netR.value);
    } else {
      setNetworkInfoError(mapHorizonError(netR.reason).userMessage);
    }

    setIsFetchingTransactions(false);
    setIsFetchingOperations(false);
    setIsFetchingNetwork(false);
  }, []);

  const refreshTransactions = useCallback(async () => {
    if (!publicKey) return;
    setIsFetchingTransactions(true);
    setTransactionsError(null);
    try {
      const txs = await fetchStellarRecentTransactions(publicKey, network, 10);
      if (cancelledRef.current) return;
      setTransactions(txs);
    } catch (err) {
      if (cancelledRef.current) return;
      setTransactionsError(mapHorizonError(err).userMessage);
    } finally {
      if (!cancelledRef.current) setIsFetchingTransactions(false);
    }
  }, [publicKey, network]);

  const refreshOperations = useCallback(async () => {
    if (!publicKey) return;
    setIsFetchingOperations(true);
    setOperationsError(null);
    try {
      const ops = await fetchStellarOperations(publicKey, network, 8);
      if (cancelledRef.current) return;
      setOperations(ops);
    } catch (err) {
      if (cancelledRef.current) return;
      setOperationsError(mapHorizonError(err).userMessage);
    } finally {
      if (!cancelledRef.current) setIsFetchingOperations(false);
    }
  }, [publicKey, network]);

  const refreshNetworkInfo = useCallback(async () => {
    setIsFetchingNetwork(true);
    setNetworkInfoError(null);
    try {
      const info = await fetchStellarNetworkInfo(network);
      if (cancelledRef.current) return;
      setNetworkInfo(info);
    } catch (err) {
      if (cancelledRef.current) return;
      setNetworkInfoError(mapHorizonError(err).userMessage);
    } finally {
      if (!cancelledRef.current) setIsFetchingNetwork(false);
    }
  }, [network]);

  const refreshHorizonSidecar = useCallback(async () => {
    if (!publicKey) return;
    await refreshHorizonSidecarForKey(publicKey, network);
  }, [publicKey, network, refreshHorizonSidecarForKey]);

  const refreshAccount = useCallback(async () => {
    if (!publicKey) return;
    setStatus((s) => (s === "connected" ? "connected" : s));
    setIsAccountSyncing(true);
    try {
      const data = await fetchStellarAccountSummary(publicKey, network);
      if (cancelledRef.current) return;
      applyAccount(data);
    } catch (err) {
      if (cancelledRef.current) return;
      const mapped = mapHorizonError(err);
      console.error("[useStellarWallet] refreshAccount", mapped.developerDetail);
      setRefreshError(mapped.userMessage);
    } finally {
      if (!cancelledRef.current) setIsAccountSyncing(false);
    }
    if (!cancelledRef.current && publicKey) void refreshHorizonSidecarForKey(publicKey, network);
  }, [publicKey, network, applyAccount, refreshHorizonSidecarForKey]);

  const setNetwork = useCallback(
    (n: StellarNetworkMode) => {
      window.localStorage.setItem(STORAGE_NETWORK, n);
      setNetworkState(n);
      if (publicKey) {
        void (async () => {
          setIsAccountSyncing(true);
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
          } finally {
            if (!cancelledRef.current) setIsAccountSyncing(false);
          }
          if (!cancelledRef.current && publicKey) void refreshHorizonSidecarForKey(publicKey, n);
        })();
      }
    },
    [publicKey, applyAccount, refreshHorizonSidecarForKey]
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
      setIsAccountSyncing(true);
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
      } finally {
        if (!cancelledRef.current) setIsAccountSyncing(false);
      }
      if (!cancelledRef.current && pk) void refreshHorizonSidecarForKey(pk, network);
    } catch (err) {
      if (cancelledRef.current) return;
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setAccount(null);
      setPublicKey(null);
      setStatus("error");
      window.localStorage.removeItem(STORAGE_CONNECTED);
    }
  }, [network, applyAccount, refreshHorizonSidecarForKey]);

  const disconnectWallet = useCallback(() => {
    window.localStorage.removeItem(STORAGE_CONNECTED);
    setPublicKey(null);
    setAccount(null);
    setError(null);
    setRefreshError(null);
    setLastRefreshedAt(null);
    clearHorizonSidecar();
    setStatus("disconnected");
  }, [clearHorizonSidecar]);

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
          setIsAccountSyncing(true);
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
          } finally {
            if (alive) setIsAccountSyncing(false);
          }
          if (alive && pk) void refreshHorizonSidecarForKey(pk, net);
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

  let readinessLabel = "Checking wallet…";
  if (status === "detecting") readinessLabel = "Detecting Freighter…";
  else if (freighterDetected === false) readinessLabel = "Freighter not installed";
  else if (status === "connecting") readinessLabel = "Waiting for wallet approval…";
  else if (status === "error") readinessLabel = error ?? "Connection error";
  else if (!isConnected) readinessLabel = freighterDetected ? "Ready to connect" : "Wallet unavailable";
  else if (isAccountSyncing) readinessLabel = "Loading account from Horizon…";
  else if (account) readinessLabel = "Connected — account loaded";
  else if (refreshError) readinessLabel = "Connected — Horizon needs attention";
  else readinessLabel = "Connected";

  const isWalletReady =
    Boolean(freighterDetected) && isConnected && Boolean(account) && !isAccountSyncing && !refreshError;

  const hasPartialHorizonData = Boolean(
    isConnected && account && (transactionsError || operationsError || networkInfoError)
  );

  const blockchainSurface = useMemo(
    () =>
      deriveBlockchainSurfaceState({
        walletStatus: status,
        freighterDetected,
        publicKey,
        isAccountSyncing,
        account,
        refreshError,
        isFetchingTransactions,
        isFetchingOperations,
        isFetchingNetwork,
        txsError: transactionsError,
        opsError: operationsError,
        networkError: networkInfoError,
      }),
    [
      status,
      freighterDetected,
      publicKey,
      isAccountSyncing,
      account,
      refreshError,
      isFetchingTransactions,
      isFetchingOperations,
      isFetchingNetwork,
      transactionsError,
      operationsError,
      networkInfoError,
    ]
  );

  return {
    status,
    lifecycle: status,
    isConnecting: status === "connecting",
    isDetecting: status === "detecting",
    isAccountSyncing,
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
    setNetworkMode: setNetwork,
    sequence: account?.sequenceNumber ?? null,
    subentries: account?.subentryCount ?? null,
    readinessLabel,
    isWalletReady,
    authEntrySigningAvailable,
    accountInfo: account,
    networkMode: network,
    transactions,
    operations,
    networkInfo,
    isFetchingTransactions,
    isFetchingOperations,
    isFetchingNetwork,
    transactionsError,
    operationsError,
    networkInfoError,
    refreshTransactions,
    refreshOperations,
    refreshNetworkInfo,
    refreshHorizonSidecar,
    hasPartialHorizonData,
    blockchainSurface,
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
