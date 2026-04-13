import { useEffect, useState } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";

export interface StellarAccount {
  publicKey: string;
  balance: string;
  nativeBalance: string;
  sequenceNumber: string;
  subentryCount: number;
}

export interface WalletConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  account: StellarAccount | null;
  error: string | null;
}

const HORIZON_URL = "https://horizon.stellar.org";
const server = new StellarSdk.Horizon.Server(HORIZON_URL);

export function useStellarWallet() {
  const [state, setState] = useState<WalletConnectionState>({
    isConnected: false,
    isConnecting: false,
    account: null,
    error: null,
  });

  const connectWallet = async () => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Check if Freighter wallet is available
      if (!window.freighterApi) {
        throw new Error("Freighter wallet not found. Please install the Freighter extension.");
      }

      // Request public key from Freighter
      const publicKey = await window.freighterApi.getPublicKey();

      // Fetch account data from Horizon
      const accountData = await server.accounts().accountId(publicKey).call();

      const nativeBalance =
        accountData.balances.find((b) => b.asset_type === "native")?.balance || "0";

      const account: StellarAccount = {
        publicKey,
        balance: nativeBalance,
        nativeBalance,
        sequenceNumber: accountData.sequence,
        subentryCount: accountData.subentry_count,
      };

      setState({
        isConnected: true,
        isConnecting: false,
        account,
        error: null,
      });

      // Store in localStorage for persistence
      localStorage.setItem("stellar_wallet_connected", "true");
      localStorage.setItem("stellar_public_key", publicKey);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect wallet";
      setState({
        isConnected: false,
        isConnecting: false,
        account: null,
        error: errorMessage,
      });
    }
  };

  const disconnectWallet = () => {
    setState({
      isConnected: false,
      isConnecting: false,
      account: null,
      error: null,
    });
    localStorage.removeItem("stellar_wallet_connected");
    localStorage.removeItem("stellar_public_key");
  };

  const refreshBalance = async () => {
    if (!state.account) return;

    try {
      const accountData = await server.accounts().accountId(state.account.publicKey).call();
      const nativeBalance =
        accountData.balances.find((b) => b.asset_type === "native")?.balance || "0";

      setState((prev) => ({
        ...prev,
        account: prev.account
          ? {
              ...prev.account,
              balance: nativeBalance,
              nativeBalance,
              sequenceNumber: accountData.sequence,
            }
          : null,
      }));
    } catch (err) {
      console.error("Failed to refresh balance:", err);
    }
  };

  // Auto-reconnect on mount if previously connected
  useEffect(() => {
    const wasConnected = localStorage.getItem("stellar_wallet_connected");
    if (wasConnected) {
      connectWallet();
    }
  }, []);

  return {
    ...state,
    connectWallet,
    disconnectWallet,
    refreshBalance,
  };
}

// Extend window interface for Freighter
declare global {
  interface Window {
    freighterApi: {
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
