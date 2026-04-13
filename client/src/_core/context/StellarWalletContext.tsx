import { createContext, useContext, type ReactNode } from "react";
import { useStellarWalletState, type StellarWalletValue } from "@/_core/hooks/useStellarWallet";

const StellarWalletContext = createContext<StellarWalletValue | null>(null);

export function StellarWalletProvider({ children }: { children: ReactNode }) {
  const value = useStellarWalletState();
  return (
    <StellarWalletContext.Provider value={value}>{children}</StellarWalletContext.Provider>
  );
}

export function useStellarWallet(): StellarWalletValue {
  const ctx = useContext(StellarWalletContext);
  if (!ctx) {
    throw new Error("useStellarWallet must be used within StellarWalletProvider");
  }
  return ctx;
}
