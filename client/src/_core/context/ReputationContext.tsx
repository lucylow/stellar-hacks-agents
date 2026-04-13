import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { nanoid } from "nanoid";
import type { FeedbackEntry, ReputationEvent, ReputationEventType, ReputationSource } from "@shared/reputationModel";
import { aggregateReputation, reputationNarrativeForLLM, sessionTrustMarker } from "@shared/reputationCompute";
import { useStellarWallet } from "@/_core/context/StellarWalletContext";

const STORAGE_KEY = "stellar_reputation_bundle_v1";
const MAX_EVENTS = 200;
const MAX_FEEDBACK = 40;

type AccountBundle = {
  events: ReputationEvent[];
  feedback: FeedbackEntry[];
  firstSeenAt: string | null;
};

type PersistedRoot = {
  byAccount: Record<string, AccountBundle>;
};

function emptyBundle(): AccountBundle {
  return { events: [], feedback: [], firstSeenAt: null };
}

function loadRoot(): PersistedRoot {
  if (typeof window === "undefined") return { byAccount: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { byAccount: {} };
    const parsed = JSON.parse(raw) as PersistedRoot;
    if (!parsed.byAccount || typeof parsed.byAccount !== "object") return { byAccount: {} };
    return parsed;
  } catch {
    return { byAccount: {} };
  }
}

function saveRoot(root: PersistedRoot) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
  } catch {
    /* ignore quota */
  }
}

function accountKey(publicKey: string | null): string {
  return publicKey && publicKey.length > 0 ? publicKey : "__guest__";
}

export type EmitReputationInput = {
  type: ReputationEventType;
  source: ReputationSource;
  demoMode?: boolean;
  weight?: number;
  notes?: string;
  meta?: Record<string, string | number | boolean>;
};

type ReputationContextValue = {
  summary: ReturnType<typeof aggregateReputation>;
  narrativeForLlm: string;
  sessionTrust: ReturnType<typeof sessionTrustMarker>;
  firstSeenAtIso: string | null;
  hydrated: boolean;
  horizonSuccessRate: number | null;
  setHorizonSuccessRate: (rate: number | null) => void;
  emit: (e: EmitReputationInput) => void;
  recordFeedback: (partial: Omit<FeedbackEntry, "id" | "at"> & { id?: string }) => void;
  resetDemoDataForCurrentAccount: () => void;
  priorSuccessfulSearchUrls: Set<string>;
  markSearchUrlsUsedSuccessfully: (urls: string[]) => void;
};

const Ctx = createContext<ReputationContextValue | null>(null);

export function ReputationProvider({ children }: { children: ReactNode }) {
  const { isConnected, publicKey, refreshError, account } = useStellarWallet();
  const [root, setRoot] = useState<PersistedRoot>({ byAccount: {} });
  const [hydrated, setHydrated] = useState(false);
  const [horizonSuccessRate, setHorizonSuccessRate] = useState<number | null>(null);
  const [priorSearchUrls, setPriorSearchUrls] = useState<string[]>([]);
  const lastConnectRef = useRef<string | null>(null);

  useEffect(() => {
    setRoot(loadRoot());
    setHydrated(true);
  }, []);

  const key = accountKey(publicKey);

  const bundle = root.byAccount[key] ?? emptyBundle();

  const persistBundle = useCallback((next: AccountBundle) => {
    setRoot((prev) => {
      const merged = { ...prev, byAccount: { ...prev.byAccount, [key]: next } };
      saveRoot(merged);
      return merged;
    });
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isConnected || !publicKey) return;
    if (lastConnectRef.current === publicKey) return;
    lastConnectRef.current = publicKey;
    setRoot((prev) => {
      const cur = prev.byAccount[key] ?? emptyBundle();
      const now = Date.now();
      const head = cur.events[0];
      if (
        head?.type === "wallet_connected" &&
        head.publicKey === publicKey &&
        now - new Date(head.at).getTime() < 8000
      ) {
        return prev;
      }
      const firstSeen = cur.firstSeenAt ?? new Date().toISOString();
      const next: AccountBundle = {
        ...cur,
        firstSeenAt: firstSeen,
        events: [
          {
            id: nanoid(),
            type: "wallet_connected",
            at: new Date().toISOString(),
            source: "wallet",
            publicKey,
            demoMode: false,
          } satisfies ReputationEvent,
          ...cur.events,
        ].slice(0, MAX_EVENTS),
      };
      const merged = { ...prev, byAccount: { ...prev.byAccount, [key]: next } };
      saveRoot(merged);
      return merged;
    });
  }, [hydrated, isConnected, publicKey, key]);

  useEffect(() => {
    if (!isConnected) {
      lastConnectRef.current = null;
    }
  }, [isConnected]);

  const summary = useMemo(() => {
    const b = root.byAccount[key] ?? emptyBundle();
    return aggregateReputation({
      events: b.events,
      feedback: b.feedback,
      onChainSuccessRate: horizonSuccessRate,
    });
  }, [root, key, horizonSuccessRate]);

  const narrativeForLlm = useMemo(() => reputationNarrativeForLLM(summary), [summary]);

  const sessionTrust = useMemo(
    () =>
      sessionTrustMarker({
        isConnected,
        refreshError,
        accountLoaded: Boolean(account),
        summary,
        firstSeenAtIso: bundle.firstSeenAt,
      }),
    [isConnected, refreshError, account, summary, bundle.firstSeenAt]
  );

  const emit = useCallback(
    (e: EmitReputationInput) => {
      const ev: ReputationEvent = {
        id: nanoid(),
        at: new Date().toISOString(),
        type: e.type,
        source: e.source,
        publicKey: publicKey ?? null,
        demoMode: e.demoMode,
        weight: e.weight,
        notes: e.notes,
        meta: e.meta,
      };
      setRoot((prev) => {
        const cur = prev.byAccount[key] ?? emptyBundle();
        const next: AccountBundle = {
          ...cur,
          events: [ev, ...cur.events].slice(0, MAX_EVENTS),
        };
        const merged = { ...prev, byAccount: { ...prev.byAccount, [key]: next } };
        saveRoot(merged);
        return merged;
      });
    },
    [key, publicKey]
  );

  const recordFeedback = useCallback(
    (partial: Omit<FeedbackEntry, "id" | "at"> & { id?: string }) => {
      const entry: FeedbackEntry = {
        id: partial.id ?? nanoid(),
        at: new Date().toISOString(),
        stars: partial.stars,
        useful: partial.useful,
        accurate: partial.accurate,
        note: partial.note,
        relatedMessageId: partial.relatedMessageId,
      };
      const type: ReputationEventType =
        partial.useful === false || (partial.stars > 0 && partial.stars <= 2)
          ? "feedback_negative"
          : partial.useful === true || (partial.stars >= 4)
            ? "feedback_positive"
            : "feedback_neutral";
      setRoot((prev) => {
        const cur = prev.byAccount[key] ?? emptyBundle();
        const next: AccountBundle = {
          ...cur,
          feedback: [entry, ...cur.feedback].slice(0, MAX_FEEDBACK),
          events: [
            {
              id: nanoid(),
              type,
              at: entry.at,
              source: "user_feedback",
              publicKey: publicKey ?? null,
              notes: partial.note,
            } satisfies ReputationEvent,
            ...cur.events,
          ].slice(0, MAX_EVENTS),
        };
        const merged = { ...prev, byAccount: { ...prev.byAccount, [key]: next } };
        saveRoot(merged);
        return merged;
      });
    },
    [key, publicKey]
  );

  const resetDemoDataForCurrentAccount = useCallback(() => {
    persistBundle(emptyBundle());
    setPriorSearchUrls([]);
    setHorizonSuccessRate(null);
  }, [persistBundle]);

  const markSearchUrlsUsedSuccessfully = useCallback((urls: string[]) => {
    setPriorSearchUrls((prev) => Array.from(new Set([...urls, ...prev])).slice(0, 120));
  }, []);

  const priorSuccessfulSearchUrls = useMemo(() => new Set(priorSearchUrls), [priorSearchUrls]);

  const value = useMemo(
    (): ReputationContextValue => ({
      summary,
      narrativeForLlm,
      sessionTrust,
      firstSeenAtIso: bundle.firstSeenAt,
      hydrated,
      horizonSuccessRate,
      setHorizonSuccessRate,
      emit,
      recordFeedback,
      resetDemoDataForCurrentAccount,
      priorSuccessfulSearchUrls,
      markSearchUrlsUsedSuccessfully,
    }),
    [
      summary,
      narrativeForLlm,
      sessionTrust,
      bundle.firstSeenAt,
      hydrated,
      horizonSuccessRate,
      emit,
      recordFeedback,
      resetDemoDataForCurrentAccount,
      markSearchUrlsUsedSuccessfully,
      priorSuccessfulSearchUrls,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useReputation(): ReputationContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useReputation must be used within ReputationProvider");
  return v;
}

export function useReputationOptional(): ReputationContextValue | null {
  return useContext(Ctx);
}
