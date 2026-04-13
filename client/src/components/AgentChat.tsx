import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Send, Search, Database, Loader2, Bot, Wrench, ListOrdered } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAgentWorkflow } from "@/_core/context/AgentWorkflowContext";
import { useStellarWallet } from "@/_core/context/StellarWalletContext";
import type {
  AgentPaymentReceipt,
  AgentToolCallWire,
  AgentToolRoute,
} from "@shared/appConnectionModel";
import { isSearchResponseWire } from "@shared/searchContract";
import { nanoid } from "nanoid";
import {
  buildBlockchainReasoningSteps,
  buildPlanNarrative,
  classifyAgentPrompt,
} from "@/_core/ai/classifyAgentIntent";
import { buildStellarContextForLlm } from "@/_core/ai/stellarContextForLlm";
import { deriveBlockchainSurfaceState, blockchainSurfaceTitle } from "@shared/blockchainUiModel";
import { CategoryChip } from "@/components/app/uiPrimitives";
import { agentStepNarrative } from "@/_core/ai/agentStepNarrative";
import { SearchAgentResultCard, BlockchainAgentResultCard } from "@/components/ai/AgentResultCards";
import { PaymentChallengeCard, PaymentSuccessCard } from "@/components/ai/PaymentChallengeCards";
import { useReputation } from "@/_core/context/ReputationContext";
import { chatTrustChipLabel } from "@shared/reputationCompute";
import { TierBadge, TrendGlyph, ReputationLoadingInline } from "@/components/reputation/TrustPrimitives";
import { MessageFeedbackRow } from "@/components/reputation/MessageFeedbackRow";
import type { PaymentMode } from "@shared/paymentTypes";
import { PaymentModeToggle } from "@/components/payment/PaymentModeToggle";

type ChatRole = "user" | "assistant" | "tool" | "system" | "plan" | "payment_challenge" | "payment_success";

type PaymentPayload = {
  queryId: string;
  challengeId: string;
  amount: number;
  currency: string;
  expiresAt?: Date;
  status: "pending" | "authorizing" | "settled" | "failed";
  txHash?: string;
  error?: string;
  unlockedHint?: string;
  replayKey: string;
  idempotencyKey: string;
  mode: PaymentMode;
  payee?: string;
  serviceDescription?: string;
  routeReason?: string;
  authEntrySigningRequired?: boolean;
};

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
  toolCalls?: AgentToolCallWire[];
  demoLabel?: string;
  planLines?: string[];
  reasoningSteps?: string[];
  toolRoute?: AgentToolRoute;
  payment?: PaymentPayload;
  paymentReceipt?: AgentPaymentReceipt;
};

function mapChatError(err: unknown): { title: string; body: string; dev?: string } {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("OPENAI") || msg.includes("API_KEY") || msg.includes("LLM")) {
    return {
      title: "Agent service unavailable",
      body: "The agent could not reach the LLM. Check BUILT_IN_FORGE_API_KEY on the server.",
      dev: msg,
    };
  }
  return {
    title: "Could not send message",
    body: "The request did not complete. Check your connection and try again.",
    dev: msg,
  };
}

type HistoryTurn = { role: "user" | "assistant"; content: string };

function countSourcesFromTools(tools: AgentToolCallWire[] | undefined): number {
  let n = 0;
  for (const t of tools ?? []) {
    if (t.result && isSearchResponseWire(t.result)) n += t.result.results.length;
  }
  return n;
}

export function AgentChat({ walletPublicKey }: { walletPublicKey?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const paymentTurnRef = useRef<{ userText: string; history: HistoryTurn[] } | null>(null);
  const predictedRouteRef = useRef<AgentToolRoute | null>(null);

  const chatMutation = trpc.agent.chat.useMutation();
  const createChallenge = trpc.payments.createChallenge.useMutation();
  const approveChallenge = trpc.payments.approveChallenge.useMutation();
  const caps = trpc.agent.capabilities.useQuery();

  const {
    beginTurn,
    recordToolCalls,
    finishTurn,
    dispatchAgent,
    patchCurrentTask,
    appendPaymentReceipt,
    activity,
    currentTask,
  } = useAgentWorkflow();

  const stellarWallet = useStellarWallet();
  const { isConnected, networkLabel, freighterDetected, network, authEntrySigningAvailable } = stellarWallet;
  const reputation = useReputation();

  const [paymentDemoFree, setPaymentDemoFree] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("stellar_payment_demo_free") === "1";
  });
  const [paymentModePref, setPaymentModePref] = useState<
    "auto" | "per_request" | "prepaid_credits" | "session_streaming" | "demo_free"
  >(() => {
    if (typeof window === "undefined") return "auto";
    const v = window.localStorage.getItem("stellar_payment_mode_pref");
    if (v === "per_request" || v === "prepaid_credits" || v === "session_streaming" || v === "demo_free") return v;
    return "auto";
  });

  const scrollSignal = useMemo(
    () => messages.length + (isLoading ? 1 : 0),
    [messages.length, isLoading]
  );
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [scrollSignal]);

  const liveStepLine = agentStepNarrative(activity, currentTask, isConnected, networkLabel);

  const runAssistantReply = useCallback(
    async (userText: string, conversationHistory: HistoryTurn[]) => {
      const started = Date.now();
      const stellarContext = buildStellarContextForLlm({
        freighterDetected: stellarWallet.freighterDetected,
        isConnected: stellarWallet.isConnected,
        publicKey: stellarWallet.publicKey,
        refreshError: stellarWallet.refreshError,
        account: stellarWallet.account,
        lastRefreshedAt: stellarWallet.lastRefreshedAt,
        networkLabel: stellarWallet.networkLabel,
        balance: stellarWallet.balance,
        sequence: stellarWallet.sequence,
        subentries: stellarWallet.subentries,
        isWalletReady: stellarWallet.isWalletReady,
      });

      const response = await chatMutation.mutateAsync({
        message: userText,
        conversationHistory,
        walletPublicKey,
        reputationContext: reputation.narrativeForLlm,
        stellarContext,
      });

      const toolCalls = (response.toolCalls ?? []) as AgentToolCallWire[];
      if (toolCalls.length) recordToolCalls(toolCalls);

      const searchMode = response.searchMode ?? "mock";
      const demoMode = searchMode === "mock";
      for (const tc of toolCalls) {
        if (tc.status !== "completed") continue;
        if (tc.type === "search") {
          reputation.emit({ type: "search_completed", source: "search", demoMode });
          if (tc.result && isSearchResponseWire(tc.result)) {
            reputation.markSearchUrlsUsedSuccessfully(tc.result.results.map((r) => r.url));
          }
        }
        if (tc.type === "blockchain_lookup" || tc.type === "balance_check") {
          reputation.emit({ type: "blockchain_lookup_completed", source: "blockchain_lookup", demoMode });
        }
      }
      const llmOk = response.llmConfigured !== false;

      const toolCards: ChatMessage[] = [];
      for (const tc of toolCalls) {
        if (tc.status === "completed" && tc.result && isSearchResponseWire(tc.result)) {
          const isSearch = tc.type === "search";
          toolCards.push({
            id: `t_${tc.id}`,
            role: "tool",
            content: isSearch ? "Agent search results" : "Agent blockchain / Stellar lookup results",
            timestamp: new Date(),
            toolCalls: [tc],
            demoLabel: isSearch
              ? searchMode === "mock"
                ? "Mock search"
                : "Live search"
              : searchMode === "mock"
                ? "Demo blockchain"
                : "Live blockchain",
          });
        } else if (tc.status === "failed") {
          toolCards.push({
            id: `t_${tc.id}`,
            role: "system",
            content: tc.error ?? "Tool failed",
            timestamp: new Date(),
          });
        }
      }

      const assistantMessage: ChatMessage = {
        id: `a_${Date.now()}`,
        role: "assistant",
        content:
          typeof response.message === "string" ? response.message : JSON.stringify(response.message),
        timestamp: new Date(),
        toolCalls: toolCalls.length ? toolCalls : undefined,
        demoLabel: !llmOk ? "LLM offline" : searchMode === "mock" ? "Search mock" : undefined,
      };

      setMessages((prev) => [...prev, ...toolCards, assistantMessage]);
      const anyToolFailed = toolCalls.some((t) => t.status === "failed");
      if (anyToolFailed) {
        reputation.emit({ type: "task_failed", source: "agent_task", demoMode });
      } else {
        reputation.emit({
          type: "task_succeeded",
          source: "agent_task",
          demoMode,
          meta: { latencyMs: Date.now() - started },
        });
      }
      finishTurn({ ok: true, summary: "Assistant reply ready" });

      if (response.developerDetail) {
        console.warn("[AgentChat] server detail:", response.developerDetail);
      }
    },
    [chatMutation, recordToolCalls, finishTurn, walletPublicKey, reputation, stellarWallet]
  );

  const handleAuthorizePayment = useCallback(
    async (messageId: string, payment: PaymentPayload) => {
      const ctx = paymentTurnRef.current;
      if (!ctx) return;

      setMessages((prev) =>
        prev.map((x) =>
          x.id === messageId && x.payment
            ? { ...x, payment: { ...x.payment, status: "authorizing" as const } }
            : x
        )
      );
      dispatchAgent({ type: "payment_authorizing" });
      patchCurrentTask({
        stage: "payment_approval_pending",
        currentAction: "Awaiting Freighter authorization (demo)",
        progress01: 0.35,
      });

      try {
        dispatchAgent({ type: "settling" });
        patchCurrentTask({
          stage: "settling",
          currentAction: "Settling payment on Stellar (simulated)",
          progress01: 0.48,
        });

        const approved = await approveChallenge.mutateAsync({
          challengeId: payment.challengeId,
          walletAddress: walletPublicKey ?? "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
          replayKey: payment.replayKey,
          idempotencyKey: payment.idempotencyKey,
        });

        const unlocked =
          typeof approved.receiptSummary === "string" && approved.receiptSummary.length > 0
            ? approved.receiptSummary
            : "Agent tools unlocked for this turn — continuing with LLM + tools.";

        const receipt: AgentPaymentReceipt = {
          id: nanoid(),
          challengeId: payment.challengeId,
          queryId: payment.queryId,
          amount: approved.amount ?? payment.amount,
          currency: approved.currency ?? payment.currency,
          transactionHash: approved.transactionHash,
          status: "simulated",
          promptSnippet: ctx.userText.slice(0, 80) + (ctx.userText.length > 80 ? "…" : ""),
          networkLabel,
          settledAt:
            approved.timestamp instanceof Date
              ? approved.timestamp.toISOString()
              : new Date().toISOString(),
          unlockedSummary: unlocked,
        };
        appendPaymentReceipt(receipt);
        dispatchAgent({ type: "payment_settled" });
        reputation.emit({ type: "settlement_succeeded", source: "settlement", demoMode: true });

        const unlockedHint =
          "The request is now unlocked and I can continue with search / Stellar lookup tools.";

        setMessages((prev) =>
          prev.map((x) =>
            x.id === messageId && x.payment
              ? {
                  ...x,
                  payment: {
                    ...x.payment,
                    status: "settled" as const,
                    txHash: approved.transactionHash,
                    unlockedHint,
                  },
                }
              : x
          )
        );

        setMessages((prev) => [
          ...prev,
          {
            id: `ps_${Date.now()}`,
            role: "payment_success",
            content: "Payment settled",
            timestamp: new Date(),
            paymentReceipt: receipt,
          },
        ]);

        patchCurrentTask({
          stage: "tool_execution",
          currentAction: "Calling agent with unlocked tools",
          progress01: 0.55,
        });

        setIsLoading(true);
        await runAssistantReply(ctx.userText, ctx.history);
      } catch (err) {
        console.error("[AgentChat] payment", err);
        const msg = err instanceof Error ? err.message : String(err);
        setMessages((prev) =>
          prev.map((x) =>
            x.id === messageId && x.payment
              ? { ...x, payment: { ...x.payment, status: "failed" as const, error: msg } }
              : x
          )
        );
        dispatchAgent({ type: "error" });
        reputation.emit({ type: "settlement_failed", source: "settlement", demoMode: true, notes: msg });
        finishTurn({ ok: false, error: msg });
      } finally {
        setIsLoading(false);
        paymentTurnRef.current = null;
        requestAnimationFrame(() => composerRef.current?.focus());
      }
    },
    [
      approveChallenge,
      appendPaymentReceipt,
      dispatchAgent,
      finishTurn,
      networkLabel,
      patchCurrentTask,
      runAssistantReply,
      walletPublicKey,
      reputation,
    ]
  );

  /** Routes payment vs freeform chat; plan + task state mirror AgentWorkflowContext for the task panel. */
  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const historySnapshot: HistoryTurn[] = messages
      .filter((m): m is ChatMessage & { role: "user" | "assistant" } => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }));

    const userMessage: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    const walletConnected = Boolean(walletPublicKey);
    const classification = classifyAgentPrompt(text, walletConnected);
    const planLines = buildPlanNarrative(
      classification.route,
      walletConnected,
      classification.needsWallet,
      networkLabel
    );
    const reasoningSteps = buildBlockchainReasoningSteps(
      classification.route,
      walletConnected,
      classification.needsWallet,
      networkLabel
    );
    const requiresPayment = classification.route === "payment";
    predictedRouteRef.current = classification.route;

    const planMessage: ChatMessage = {
      id: `plan_${Date.now()}`,
      role: "plan",
      content: "Plan",
      timestamp: new Date(),
      planLines,
      reasoningSteps,
      toolRoute: classification.route,
    };

    setMessages((prev) => [...prev, userMessage, planMessage]);
    setInput("");
    setIsLoading(true);

    beginTurn(text, {
      predictedRoute: classification.route,
      planLines,
      needsWallet: classification.needsWallet,
      walletConnected,
      requiresPayment,
    });

    if (requiresPayment) {
      paymentTurnRef.current = { userText: text, history: historySnapshot };
      try {
        const queryId = nanoid();
        const ch = await createChallenge.mutateAsync({
          queryId,
          amount: 0.001,
          currency: "USDC",
          walletAddress: walletPublicKey,
          network,
          demoMode: paymentDemoFree,
          walletSupportsAuthEntry: authEntrySigningAvailable,
          userPreferredMode: paymentModePref === "auto" ? undefined : paymentModePref,
        });

        if (ch.status === "demo_free") {
          setMessages((prev) => [
            ...prev,
            {
              id: `pay_skip_${Date.now()}`,
              role: "system",
              content: `Payment bypass: ${ch.routeReason ?? "demo mode"}. Running agent tools without a settlement step.`,
              timestamp: new Date(),
              demoLabel: "Payment demo",
            },
          ]);
          patchCurrentTask({
            stage: "tool_execution",
            currentAction: "Demo mode — executing agent with tools",
            progress01: 0.45,
          });
          dispatchAgent({ type: "payment_settled" });
          setIsLoading(true);
          await runAssistantReply(text, historySnapshot);
          paymentTurnRef.current = null;
          finishTurn({ ok: true, summary: "Assistant reply (demo payment bypass)" });
          return;
        }

        const expires =
          ch.expiresAt instanceof Date ? ch.expiresAt : ch.expiresAt ? new Date(ch.expiresAt) : undefined;
        setMessages((prev) => [
          ...prev,
          {
            id: `pay_${Date.now()}`,
            role: "payment_challenge",
            content: "Payment required before tools run",
            timestamp: new Date(),
            demoLabel: "x402 demo",
            payment: {
              queryId: ch.queryId ?? queryId,
              challengeId: ch.challengeId,
              amount: ch.amount,
              currency: ch.currency,
              expiresAt: expires,
              status: "pending",
              replayKey: ch.replayKey,
              idempotencyKey: ch.idempotencyKey,
              mode: ch.mode,
              payee: ch.payee,
              serviceDescription: ch.serviceDescription,
              routeReason: ch.routeReason,
              authEntrySigningRequired: ch.authEntrySigningRequired,
            },
          },
        ]);
        patchCurrentTask({
          stage: "payment_required",
          currentAction: `${ch.serviceDescription ?? "Paid action"} — ${ch.routeReason ?? "authorize to continue"}`,
          progress01: 0.22,
        });
        dispatchAgent({ type: "payment_required" });
      } catch (error) {
        console.error("[AgentChat] challenge", error);
        const mapped = mapChatError(error);
        setMessages((prev) => [
          ...prev,
          {
            id: `e_${Date.now()}`,
            role: "system",
            content: `${mapped.title}: ${mapped.body}`,
            timestamp: new Date(),
          },
        ]);
        finishTurn({ ok: false, error: mapped.body });
        paymentTurnRef.current = null;
      } finally {
        setIsLoading(false);
        requestAnimationFrame(() => composerRef.current?.focus());
      }
      return;
    }

    try {
      await runAssistantReply(text, historySnapshot);
    } catch (error) {
      console.error("[AgentChat]", error);
      const mapped = mapChatError(error);
      setMessages((prev) => [
        ...prev,
        {
          id: `e_${Date.now()}`,
          role: "system",
          content: `${mapped.title}: ${mapped.body}`,
          timestamp: new Date(),
        },
      ]);
      if (mapped.dev) console.error(mapped.dev);
      reputation.emit({
        type: "task_failed",
        source: "agent_task",
        demoMode: (caps.data?.searchMode ?? "mock") === "mock",
      });
      finishTurn({ ok: false, error: mapped.body });
    } finally {
      setIsLoading(false);
      requestAnimationFrame(() => composerRef.current?.focus());
    }
  }, [
    input,
    isLoading,
    messages,
    walletPublicKey,
    beginTurn,
    createChallenge,
    dispatchAgent,
    finishTurn,
    patchCurrentTask,
    runAssistantReply,
    reputation,
    caps.data?.searchMode,
    network,
    paymentDemoFree,
    paymentModePref,
    authEntrySigningAvailable,
  ]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const llmConfigured = caps.data?.llmConfigured ?? true;
  const searchMock = caps.data?.searchMode === "mock";

  const chatBlockchainSurface = deriveBlockchainSurfaceState({
    walletStatus: stellarWallet.status,
    freighterDetected: stellarWallet.freighterDetected,
    publicKey: stellarWallet.publicKey,
    isAccountSyncing: stellarWallet.isAccountSyncing,
    account: stellarWallet.account,
    refreshError: stellarWallet.refreshError,
    isFetchingTransactions: stellarWallet.isFetchingTransactions,
    isFetchingOperations: stellarWallet.isFetchingOperations,
    isFetchingNetwork: stellarWallet.isFetchingNetwork,
    txsError: stellarWallet.transactionsError,
    opsError: stellarWallet.operationsError,
    networkError: stellarWallet.networkInfoError,
    agentBlockchainLookup:
      isLoading &&
      (predictedRouteRef.current === "blockchain_lookup" || predictedRouteRef.current === "mixed")
        ? "running"
        : "idle",
    needsWalletForLiveHorizon:
      Boolean(currentTask?.needsWallet && !walletPublicKey && predictedRouteRef.current === "blockchain_lookup"),
  });
  const surfaceTitle = blockchainSurfaceTitle(chatBlockchainSurface, network);

  const paymentAuthBlocked =
    freighterDetected === false
      ? "Install the Freighter extension. Mobile Freighter does not support x402 auth entries today."
      : !isConnected
        ? "Connect Freighter for a payer address on this network."
        : !authEntrySigningAvailable
          ? "This Freighter build does not expose signAuthEntry — use desktop Freighter for Soroban auth entries."
          : undefined;

  return (
    <Card className="app-card border border-[var(--border)] bg-[var(--surface-elevated)]/95 h-full flex flex-col min-h-0">
      <div className="border-b border-[var(--border)] bg-[var(--surface)]/90 px-4 py-3 space-y-2 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[var(--accent-secondary)] font-semibold flex items-center gap-2 text-base tracking-tight">
            <Bot className="w-4 h-4" aria-hidden />
            Stellar AI agent
          </h3>
          <Badge
            variant="outline"
            className={`text-[10px] uppercase ${llmConfigured ? "border-emerald-500/40 text-emerald-300" : "border-amber-500/40 text-amber-200"}`}
          >
            {llmConfigured ? "LLM live" : "Demo AI"}
          </Badge>
          {searchMock && (
            <Badge variant="outline" className="text-[10px] border-amber-500/35 text-amber-200">
              Mock search
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] border-slate-500/40 text-slate-300">
            Payment middleware
          </Badge>
          <PaymentModeToggle
            demoFree={paymentDemoFree}
            preferredMode={paymentModePref}
            onDemoFreeChange={(v) => {
              setPaymentDemoFree(v);
              if (typeof window !== "undefined") {
                window.localStorage.setItem("stellar_payment_demo_free", v ? "1" : "0");
              }
            }}
            onPreferredModeChange={(m) => {
              setPaymentModePref(m);
              if (typeof window !== "undefined") {
                window.localStorage.setItem("stellar_payment_mode_pref", m);
              }
            }}
          />
          {!reputation.hydrated ? (
            <ReputationLoadingInline />
          ) : (
            <>
              <TierBadge tier={reputation.summary.score.tier} />
              <span className="text-[10px] text-slate-500 tabular-nums" title="Behavioral reputation score">
                {reputation.summary.score.value}/100
              </span>
              <TrendGlyph trend={reputation.summary.score.trend} className="shrink-0" />
            </>
          )}
        </div>
        <p className="text-xs text-[var(--muted-text)] leading-relaxed">
          Visible plan → quoted payment (per-request, credits, or session per server policy) → tools → synthesis. Shift+Enter
          newline, Enter sends.
        </p>
        <div
          className="rounded-[var(--radius-md)] border border-purple-500/20 bg-[var(--surface)]/80 px-3 py-2 text-xs text-slate-300 leading-snug space-y-1.5"
          role="status"
          aria-live="polite"
          aria-label="Current agent step"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-purple-300/90">Now</span>
            <Badge variant="outline" className="text-[9px] border-cyan-500/35 text-cyan-200/90">
              {networkLabel}
            </Badge>
            <span className="text-[10px] text-slate-500">{surfaceTitle}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isLoading
              ? predictedRouteRef.current === "blockchain_lookup" || predictedRouteRef.current === "mixed"
                ? "Blockchain lookup in progress — waiting for the model and Stellar tool… "
                : predictedRouteRef.current === "search"
                  ? "Searching curated sources (mock until MCP is connected)… "
                  : "Working on your request… "
              : null}
            {liveStepLine}
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 p-4">
        <div className="space-y-4 pr-2" role="log" aria-label="Agent conversation" aria-relevant="additions">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 py-10 space-y-2" role="status">
              <p className="text-sm text-slate-400">Ask about Stellar, or try “x402 paid search for Soroban docs”.</p>
              <p className="text-xs text-slate-500">
                {!walletPublicKey && "Connect Freighter so the agent can use your public key and realistic payment context."}
              </p>
            </div>
          )}

          {messages.map((message) => (
            <article
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              aria-label={`${message.role} message`}
            >
              <div
                className={`max-w-[min(100%,32rem)] rounded-lg border px-3 py-2.5 shadow-sm ${
                  message.role === "user"
                    ? "bg-cyan-600/15 border-cyan-500/35 text-cyan-50"
                    : message.role === "assistant"
                      ? "bg-purple-600/12 border-purple-500/35 text-purple-50"
                      : message.role === "tool"
                        ? "bg-slate-900/80 border-cyan-500/25 text-slate-100"
                        : message.role === "plan"
                          ? "bg-slate-900/70 border-purple-500/30 text-slate-100"
                          : message.role === "payment_challenge" || message.role === "payment_success"
                            ? "bg-slate-950/90 border-amber-500/25 text-slate-50"
                            : "bg-amber-950/30 border-amber-500/25 text-amber-100"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {message.demoLabel && (
                    <Badge variant="outline" className="text-[9px] border-slate-500/40 text-slate-300">
                      {message.demoLabel}
                    </Badge>
                  )}
                  {message.toolRoute && (
                    <>
                      {message.toolRoute === "search" ? (
                        <CategoryChip category="search" />
                      ) : message.toolRoute === "blockchain_lookup" || message.toolRoute === "wallet_check" ? (
                        <CategoryChip category="blockchain" />
                      ) : message.toolRoute === "payment" ? (
                        <CategoryChip category="wallet" />
                      ) : null}
                      <Badge variant="outline" className="text-[9px] border-purple-500/35 text-purple-200">
                        Route: {message.toolRoute.replace(/_/g, " ")}
                      </Badge>
                    </>
                  )}
                </div>

                {message.role === "plan" && message.planLines && (
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-wide text-purple-300/90 flex items-center gap-1.5">
                      <ListOrdered className="w-3.5 h-3.5" aria-hidden />
                      Agent plan
                    </p>
                    <ol className="list-decimal pl-4 space-y-1 text-xs text-slate-300 leading-relaxed">
                      {message.planLines.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ol>
                    {message.reasoningSteps && message.reasoningSteps.length > 0 && (
                      <div className="rounded-md border border-cyan-500/20 bg-slate-950/50 p-2.5 space-y-1.5">
                        <p className="text-[10px] uppercase tracking-wide text-cyan-300/90">
                          {message.toolRoute === "search"
                            ? "Search reasoning"
                            : message.toolRoute === "blockchain_lookup" || message.toolRoute === "mixed"
                              ? "Blockchain reasoning"
                              : "Agent reasoning"}
                        </p>
                        <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-400 leading-relaxed">
                          {message.reasoningSteps.map((line, i) => (
                            <li key={i}>{line}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}

                {message.role === "payment_challenge" && message.payment && (
                  <PaymentChallengeCard
                    amount={message.payment.amount}
                    currency={message.payment.currency}
                    challengeId={message.payment.challengeId}
                    queryId={message.payment.queryId}
                    expiresAt={message.payment.expiresAt}
                    networkLabel={networkLabel}
                    walletConnected={isConnected}
                    paymentMode={message.payment.mode}
                    payee={message.payment.payee}
                    serviceDescription={message.payment.serviceDescription}
                    routeReason={message.payment.routeReason}
                    authEntrySigningRequired={message.payment.authEntrySigningRequired ?? true}
                    authEntrySigningAvailable={authEntrySigningAvailable}
                    blockReason={
                      message.payment.authEntrySigningRequired
                        ? paymentAuthBlocked
                        : !isConnected
                          ? "Connect Freighter so this settlement is attributed to your address."
                          : undefined
                    }
                    status={message.payment.status}
                    error={message.payment.error}
                    onAuthorize={() => void handleAuthorizePayment(message.id, message.payment!)}
                  />
                )}

                {message.role === "payment_success" && message.paymentReceipt && (
                  <PaymentSuccessCard
                    transactionHash={message.paymentReceipt.transactionHash}
                    amount={message.paymentReceipt.amount}
                    currency={message.paymentReceipt.currency}
                    unlockedSummary={message.paymentReceipt.unlockedSummary}
                    networkLabel={message.paymentReceipt.networkLabel}
                  />
                )}

                {message.role === "tool" &&
                message.toolCalls?.[0]?.result &&
                isSearchResponseWire(message.toolCalls[0].result) ? (
                  message.toolCalls[0].type === "search" ? (
                    <SearchAgentResultCard
                      data={message.toolCalls[0].result}
                      synthesisIntro={`I searched for: “${message.toolCalls[0].result.query}”.`}
                      usedByAgent
                      priorSuccessUrlSet={reputation.priorSuccessfulSearchUrls}
                    />
                  ) : (
                    <BlockchainAgentResultCard
                      data={message.toolCalls[0].result}
                      tool={message.toolCalls[0]}
                      synthesisIntro="Stellar / Horizon-oriented lookup using the agent tool."
                      usedByAgent
                      priorSuccessUrlSet={reputation.priorSuccessfulSearchUrls}
                    />
                  )
                ) : message.role !== "plan" &&
                  message.role !== "payment_challenge" &&
                  message.role !== "payment_success" ? (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                ) : null}

                {message.role === "assistant" && message.toolCalls && message.toolCalls.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-purple-500/25 pt-2">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 flex items-center gap-1">
                      <Wrench className="w-3 h-3" aria-hidden />
                      Tool trace
                    </p>
                    {message.toolCalls.map((tool) => (
                      <div
                        key={tool.id}
                        className="flex items-start gap-2 text-xs rounded-md bg-slate-950/50 px-2 py-1.5 border border-purple-500/15"
                      >
                        {tool.type === "search" && (
                          <Search className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" aria-hidden />
                        )}
                        {tool.type === "blockchain_lookup" && (
                          <Database className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" aria-hidden />
                        )}
                        <div className="min-w-0">
                          <p className="text-slate-200 font-medium break-words">{tool.name}</p>
                          <p className="text-slate-500">
                            {tool.type === "search" && tool.status === "completed" && (
                              <span className="block text-[10px] text-slate-600 mt-0.5">
                                Procedure: agent uses search → executeSearch / MCP bridge (may be mock).
                              </span>
                            )}
                            {tool.type === "blockchain_lookup" && tool.status === "completed" && (
                              <span className="block text-[10px] text-slate-600 mt-0.5">
                                Procedure: agent.blockchainLookup → searchStellarInfo (structured Stellar snippets;
                                demo until live MCP).
                              </span>
                            )}
                            {tool.status === "pending" && "Tool running…"}
                            {tool.status === "completed" && "Agent received tool output."}
                            {tool.status === "failed" && (tool.error ?? "Tool failed")}
                          </p>
                        </div>
                        {tool.status === "pending" && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0 ml-auto" aria-hidden />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {message.role === "assistant" && (
                  <div
                    className="mt-2 flex flex-wrap items-center gap-2 border-t border-purple-500/20 pt-2"
                    role="status"
                    aria-label="Trust context for this reply"
                  >
                    {!reputation.hydrated ? (
                      <ReputationLoadingInline />
                    ) : (
                      <>
                        <Badge variant="outline" className="text-[9px] border-cyan-500/30 text-cyan-200">
                          {chatTrustChipLabel(reputation.summary, countSourcesFromTools(message.toolCalls))}
                        </Badge>
                        {reputation.summary.successCount > 0 && (
                          <Badge variant="outline" className="text-[9px] border-slate-600 text-slate-400">
                            Based on {reputation.summary.successCount} successful run
                            {reputation.summary.successCount === 1 ? "" : "s"}
                          </Badge>
                        )}
                        <span className="text-[10px] text-slate-500">
                          Confidence {Math.round(reputation.summary.score.confidence * 100)}%
                        </span>
                      </>
                    )}
                  </div>
                )}

                {message.role === "assistant" && <MessageFeedbackRow messageId={message.id} />}

                {message.role !== "plan" &&
                  message.role !== "payment_challenge" &&
                  message.role !== "payment_success" && (
                    <time className="text-[10px] text-slate-500 mt-2 block" dateTime={message.timestamp.toISOString()}>
                      {message.timestamp.toLocaleTimeString()}
                    </time>
                  )}
              </div>
            </article>
          ))}

          {isLoading && (
            <div className="flex justify-start" role="status" aria-live="polite" aria-label="Agent is responding">
              <div className="bg-purple-600/12 border border-purple-500/35 px-4 py-3 rounded-lg flex flex-col gap-1 text-sm text-purple-200 max-w-[min(100%,32rem)]">
                <span className="inline-flex items-center gap-2 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400 shrink-0" aria-hidden />
                  Working…
                </span>
                <span className="text-xs text-slate-400 leading-relaxed">{liveStepLine}</span>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-purple-500/20 p-3 bg-slate-900/40 shrink-0">
        {!llmConfigured && (
          <Alert className="mb-2 border-amber-500/35 bg-amber-950/20">
            <AlertTitle className="text-amber-200 text-sm">Demo AI</AlertTitle>
            <AlertDescription className="text-xs text-amber-100/85">
              Set BUILT_IN_FORGE_API_KEY for full LLM replies. Search may stay mock until MCP is wired.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex gap-2 items-end">
          <Textarea
            ref={composerRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask the agent anything…"
            disabled={isLoading}
            rows={2}
            className="min-h-[44px] bg-slate-900 border-cyan-500/25 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-500/40 resize-none"
            aria-label="Message to Stellar AI agent"
          />
          <Button
            type="button"
            onClick={() => void send()}
            disabled={isLoading || !input.trim()}
            className="shrink-0 h-11 w-11 p-0 bg-gradient-to-br from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
