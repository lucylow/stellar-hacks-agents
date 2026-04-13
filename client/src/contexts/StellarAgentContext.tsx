import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { useStellarWallet } from "@/_core/context/StellarWalletContext";
import type { StellarWalletValue } from "@/_core/hooks/useStellarWallet";

export type ActivityLevel = "info" | "success" | "warning" | "error";

export interface ActivityEntry {
  id: string;
  at: number;
  message: string;
  level: ActivityLevel;
}

export type StellarAgentContextValue = StellarWalletValue & {
  activities: ActivityEntry[];
  pushActivity: (message: string, level?: ActivityLevel) => void;
  clearActivities: () => void;
};

const StellarAgentContext = createContext<StellarAgentContextValue | null>(null);

export function StellarAgentProvider({ children }: { children: React.ReactNode }) {
  const wallet = useStellarWallet();
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const prevStatus = useRef(wallet.status);

  const pushActivity = useCallback((message: string, level: ActivityLevel = "info") => {
    setActivities((prev) =>
      [{ id: nanoid(), at: Date.now(), message, level }, ...prev].slice(0, 80)
    );
  }, []);

  const clearActivities = useCallback(() => setActivities([]), []);

  const value = useMemo(
    (): StellarAgentContextValue => ({
      ...wallet,
      activities,
      pushActivity,
      clearActivities,
    }),
    [wallet, activities, pushActivity, clearActivities]
  );

  useEffect(() => {
    if (prevStatus.current === wallet.status) return;
    if (wallet.status === "connected") {
      pushActivity("Wallet connected.", "success");
    } else if (wallet.status === "disconnected") {
      pushActivity("Wallet disconnected.", "warning");
    } else if (wallet.status === "error" && wallet.error) {
      pushActivity(wallet.error, "error");
    }
    prevStatus.current = wallet.status;
  }, [wallet.status, wallet.error, pushActivity]);

  return <StellarAgentContext.Provider value={value}>{children}</StellarAgentContext.Provider>;
}

export function useStellarAgent(): StellarAgentContextValue {
  const ctx = useContext(StellarAgentContext);
  if (!ctx) {
    throw new Error("useStellarAgent must be used within StellarAgentProvider");
  }
  return ctx;
}

export function useStellarAgentOptional(): StellarAgentContextValue | null {
  return useContext(StellarAgentContext);
}
