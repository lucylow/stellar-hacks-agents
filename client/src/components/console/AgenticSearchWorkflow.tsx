import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useDemoSearch } from "@/hooks/useDemoSearch";
import { useStellarAgent } from "@/contexts/StellarAgentContext";
import { useAgentWorkflow } from "@/_core/context/AgentWorkflowContext";
import { useStellarWallet } from "@/_core/context/StellarWalletContext";
import { DEMO_X402_PAY_TO, MCP_SERVICE_CATALOG } from "@/data/agenticConsoleSeed";
import type { DemoRuntimeMode, PaymentPhase, PaymentQuote, PolicyState } from "@/lib/demoConsoleTypes";
import { PaymentChallengeCard } from "./PaymentChallengeCard";
import { StatusPill } from "./StatusPill";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { STELLAR_SEARCH_USES_MOCK } from "@shared/const";
import { Search, RotateCcw } from "lucide-react";
import { useReputation } from "@/_core/context/ReputationContext";
import { rankSearchResults } from "@shared/reputationCompute";
import type { SearchResponseWire } from "@shared/searchContract";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";

type AgenticSearchWorkflowProps = {
  policy: PolicyState;
  serviceId: string;
};

function findService(id: string) {
  return MCP_SERVICE_CATALOG.find((s) => s.id === id) ?? MCP_SERVICE_CATALOG[0]!;
}

export function AgenticSearchWorkflow({ policy, serviceId }: AgenticSearchWorkflowProps) {
  const { pushActivity } = useStellarAgent();
  const { appendPaymentReceipt, emitTimeline } = useAgentWorkflow();
  const { network } = useStellarWallet();
  const reputation = useReputation();

  const { results, query, executionTimeMs, totalResults, error, isLoading, search, reset, isDemo } = useDemoSearch();

  const [mode, setMode] = useState<DemoRuntimeMode>("mock");
  const [localQuery, setLocalQuery] = useState("");
  const [phase, setPhase] = useState<PaymentPhase>("idle");
  const [quote, setQuote] = useState<PaymentQuote | null>(null);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const lastReputationKey = useRef<string | null>(null);

  const service = findService(serviceId);

  const networkLabel =
    mode === "mock" ? "Stellar testnet (mock settlement)" : network === "mainnet" ? "Stellar mainnet" : "Stellar testnet";

  const ranked = useMemo(() => {
    if (!results.length) return [];
    const wire: SearchResponseWire = {
      query,
      results,
      totalResults: totalResults ?? results.length,
      executionTime: executionTimeMs ?? 0,
      searchMode: "mock",
    };
    return rankSearchResults(wire, { priorSuccessUrlSet: reputation.priorSuccessfulSearchUrls });
  }, [results, query, totalResults, executionTimeMs, reputation.priorSuccessfulSearchUrls]);

  useEffect(() => {
    if (!query || results.length === 0 || isLoading) return;
    const key = `${query}::${results[0]?.url ?? ""}`;
    if (lastReputationKey.current === key) return;
    lastReputationKey.current = key;
    reputation.emit({ type: "search_completed", source: "search", demoMode: true });
    reputation.markSearchUrlsUsedSuccessfully(results.map((r) => r.url));
  }, [query, results, isLoading, reputation]);

  const buildQuote = useCallback(
    (amount: number): PaymentQuote => ({
      amountUsdc: amount,
      currency: "USDC",
      serviceId: service.id,
      networkLabel,
      payToAddress: DEMO_X402_PAY_TO,
      requestId: `req_${nanoid(10)}`,
      expiresAtIso: new Date(Date.now() + 5 * 60_000).toISOString(),
    }),
    [service.id, networkLabel]
  );

  const settleAndSearch = useCallback(
    async (q: string, amount: number, requestId: string) => {
      setPhase("settling");
      emitTimeline("payment_settling", "Payment submitted (demo)", "Simulated x402 authorization");
      await new Promise((r) => setTimeout(r, mode === "mock" ? 400 : 700));
      appendPaymentReceipt({
        id: nanoid(),
        challengeId: requestId,
        queryId: nanoid(),
        amount,
        currency: "USDC",
        transactionHash: `demo_tx_${nanoid(12)}`,
        status: "simulated",
        promptSnippet: q.slice(0, 120),
        networkLabel,
        settledAt: new Date().toISOString(),
        unlockedSummary: "Search execution authorized for this request",
      });
      emitTimeline("payment_settled", "Settlement confirmed (simulated)", networkLabel);
      pushActivity("Payment settled — executing search.", "success");
      setPhase("settled");
      await search(q);
      emitTimeline("tool_called", "Search executed", "MCP / agent.search");
    },
    [appendPaymentReceipt, emitTimeline, mode, networkLabel, pushActivity, search]
  );

  const startFlow = useCallback(async () => {
    setPolicyError(null);
    const q = localQuery.trim();
    if (!q) return;

    if (policy.automationPaused) {
      setPolicyError("Automation is paused — resume guardrails to continue.");
      pushActivity("Blocked: automation paused.", "warning");
      return;
    }

    if (policy.allowlistOnly && !MCP_SERVICE_CATALOG.some((s) => s.id === service.id)) {
      setPolicyError("Tool not on allowlist.");
      pushActivity("Blocked: tool not allowlisted.", "error");
      return;
    }

    const amount = service.pricePerQueryUsdc;
    if (amount > policy.spendCapUsdc) {
      setPolicyError(`Quote exceeds spend cap (${policy.spendCapUsdc} USDC). Raise the cap or pick a cheaper tool.`);
      pushActivity("Blocked: spend cap exceeded.", "warning");
      return;
    }

    pushActivity(`Request created for “${q.slice(0, 80)}${q.length > 80 ? "…" : ""}”.`, "info");
    emitTimeline("agent_request_started", "Search request created", service.mcpTool);
    pushActivity(`Quote generated: ${amount} USDC on ${networkLabel}.`, "info");
    emitTimeline("payment_required", "Quote ready", `${amount} ${service.currency}`);

    reset();
    setPhase("idle");
    setQuote(null);

    if (amount <= 0) {
      const q0 = buildQuote(0);
      setQuote(q0);
      pushActivity("No payment required for this tool.", "success");
      await settleAndSearch(q, 0, q0.requestId);
      return;
    }

    const auto = policy.approvalMode === "auto_under_cap" && !policy.humanOverride && amount <= policy.spendCapUsdc;

    if (auto) {
      const qAuto = buildQuote(amount);
      setQuote(qAuto);
      pushActivity("Auto-approved under policy cap (audit trail on).", "info");
      await settleAndSearch(q, amount, qAuto.requestId);
      return;
    }

    const qChallenge = buildQuote(amount);
    setQuote(qChallenge);
    setPhase("awaiting_approval");
    pushActivity("Approval required before spend.", "warning");
  }, [
    buildQuote,
    emitTimeline,
    localQuery,
    policy.allowlistOnly,
    policy.approvalMode,
    policy.automationPaused,
    policy.humanOverride,
    policy.spendCapUsdc,
    pushActivity,
    reset,
    service.currency,
    service.id,
    service.mcpTool,
    service.pricePerQueryUsdc,
    settleAndSearch,
    networkLabel,
  ]);

  const onApprove = useCallback(async () => {
    const q = localQuery.trim();
    if (!q || !quote) return;
    await settleAndSearch(q, quote.amountUsdc, quote.requestId);
  }, [localQuery, quote, settleAndSearch]);

  const onDeny = useCallback(() => {
    setPhase("denied");
    pushActivity("Payment denied — no spend executed.", "warning");
    emitTimeline("task_failed", "Payment denied", "User rejected challenge");
  }, [emitTimeline, pushActivity]);

  const onReset = useCallback(() => {
    reset();
    setPhase("idle");
    setQuote(null);
    setPolicyError(null);
    lastReputationKey.current = null;
    pushActivity("Search console reset.", "info");
  }, [pushActivity, reset]);

  const paidQuote = quote && quote.amountUsdc > 0 ? quote : null;

  return (
    <Card className="surface-card border-[var(--border-strong)] p-4 space-y-4 scroll-mt-28" id="console-search">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--accent-primary)]">
          <Search className="h-4 w-4" aria-hidden />
          Search request &amp; x402 path
        </h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="warning">{STELLAR_SEARCH_USES_MOCK ? "Mock results" : "Live search"}</StatusBadge>
          {isDemo ? <StatusBadge tone="secondary">MCP-ready hook</StatusBadge> : null}
        </div>
      </div>

      <InlineAlert variant="info" title="Transparent pricing">
        Connect a wallet to authorize live Stellar actions elsewhere in the app. This panel always shows estimate → approval →
        execution so judges can follow the x402 story, even when settlement is simulated.
      </InlineAlert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-2">
            <p className="text-xs text-[var(--muted-text)]" id="runtime-label">
              Runtime
            </p>
            <RadioGroup
              className="flex flex-wrap gap-3"
              value={mode}
              onValueChange={(v) => setMode(v as DemoRuntimeMode)}
              aria-labelledby="runtime-label"
            >
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <RadioGroupItem value="mock" id="mode-mock" />
                <span>Mock settlement (fast demo)</span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <RadioGroupItem value="testnet" id="mode-testnet" />
                <span>Testnet labeling (still demo tx)</span>
              </label>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agentic-query" className="text-xs text-[var(--muted-text)]">
              Query
            </Label>
            <Input
              id="agentic-query"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Try “Stellar consensus”, “Soroban”, or “USDC on Stellar”"
              disabled={isLoading || phase === "settling"}
              className="bg-[var(--surface-elevated)] text-[var(--text)]"
            />
          </div>

          {policyError ? (
            <InlineAlert variant="error" title="Policy blocked this request">
              {policyError}
            </InlineAlert>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              className="btn-primary flex-1"
              disabled={isLoading || !localQuery.trim() || phase === "settling" || phase === "awaiting_approval"}
              onClick={() => void startFlow()}
            >
              {isLoading || phase === "settling" ? "Working…" : "Estimate & continue"}
            </Button>
            <Button type="button" variant="outline" className="border-[var(--border)]" onClick={onReset} disabled={isLoading}>
              <RotateCcw className="h-4 w-4 mr-2" aria-hidden />
              Reset flow
            </Button>
          </div>

          <PaymentChallengeCard
            quote={paidQuote}
            phase={phase}
            disabled={isLoading}
            onApprove={() => void onApprove()}
            onDeny={onDeny}
          />

          {quote && quote.amountUsdc === 0 ? (
            <p className="text-xs text-[var(--muted-text)]">
              Free tool — no paid challenge. Request{" "}
              <span className="font-mono text-[10px] text-[var(--text)]">{quote.requestId}</span>
            </p>
          ) : null}
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]/70 p-3 space-y-2 text-xs">
          <p className="font-medium text-[var(--text)]">Active tool</p>
          <p className="text-[var(--muted-text)]">{service.name}</p>
          <p className="font-mono text-[10px] text-[var(--accent-primary)]">{service.mcpTool}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <StatusPill tone="neutral">Price {service.pricePerQueryUsdc} USDC</StatusPill>
            <StatusPill tone={mode === "mock" ? "demo" : "info"}>{mode === "mock" ? "Mock" : "Testnet label"}</StatusPill>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Executing search after settlement…" />
      ) : null}

      {error ? (
        <InlineAlert variant="error" title="Search failed">
          {error}
        </InlineAlert>
      ) : null}

      {!isLoading && query && results.length === 0 && !error && phase === "settled" ? (
        <EmptyState title="No hits" description="Try broader keywords — the mock catalog is intentionally small." />
      ) : null}

      {results.length > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted-text)]">
            <span>
              Result state: <span className="font-medium text-[var(--text)]">ready</span>
            </span>
            {executionTimeMs != null ? <span className="tabular-nums">{executionTimeMs} ms</span> : null}
          </div>
          <ul className="space-y-2" aria-label="Search results">
            {ranked.map((r, i) => (
              <li
                key={`${r.url}-${i}`}
                className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-elevated)]/80 p-3"
              >
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[var(--accent-primary)] underline-offset-2 hover:underline"
                >
                  {r.title}
                </a>
                <p className="mt-1 text-xs text-[var(--muted-text)] leading-relaxed">{r.snippet}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge tone="warning">Demo data</StatusBadge>
                  <Badge variant="outline" className="text-[9px] border-[var(--border)]">
                    Trust {Math.round(r.trust.sourceTrust01 * 100)}%
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
