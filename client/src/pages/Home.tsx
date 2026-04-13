/**
 * Frontend audit (pre-refactor checklist):
 * - Wallet: detection vs connected vs Horizon account was easy to confuse; status strip + readiness labels fix that.
 * - Chat: tool vs answer flow needed a visible “now” line and calmer cards.
 * - Dashboard: empty disconnected state looked broken; now uses the same panel with an explicit CTA.
 * - Tasks: stage names were raw enums; timeline is surfaced as “recent steps”.
 * - Loading: wallet refresh and dashboard fetches now state what they’re doing.
 * - Mock vs live: centralized badges + copy; search remains explicitly demo when flagged.
 * - Mobile: single column stack, full-width cards, no horizontal tab strip fighting the layout.
 */
import { useMemo, useState } from "react";
import { useStellarWallet } from "@/_core/context/StellarWalletContext";
import { useAgentWorkflow } from "@/_core/context/AgentWorkflowContext";
import type { AgentActivityState } from "@shared/appConnectionModel";
import { WalletConnect } from "@/components/WalletConnect";
import { AgentChat } from "@/components/AgentChat";
import { AccountDashboard } from "@/components/AccountDashboard";
import { AgentTaskPanel } from "@/components/AgentTaskPanel";
import { AppSection, DemoLiveBadge } from "@/components/app/uiPrimitives";
import { Zap, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { STELLAR_SEARCH_USES_MOCK } from "@shared/const";
import { useReputation } from "@/_core/context/ReputationContext";
import { TierBadge, TrendGlyph } from "@/components/reputation/TrustPrimitives";
import { ContractMarketPanel } from "@/components/ContractMarketPanel";
import { ConsoleLanding } from "@/components/console/ConsoleLanding";
import { PolicyControls } from "@/components/console/PolicyControls";
import { ServiceCatalogConsole } from "@/components/console/ServiceCatalogConsole";
import { AgenticSearchWorkflow } from "@/components/console/AgenticSearchWorkflow";
import { ContractStatePanel } from "@/components/console/ContractStatePanel";
import { AuditLogPanel } from "@/components/console/AuditLogPanel";
import { DEFAULT_SERVICE_ID } from "@/data/agenticConsoleSeed";
import type { PolicyState } from "@/lib/demoConsoleTypes";
import { mockWalletState } from "@/lib/mockData";
import { truncatePublicKey } from "@shared/stellarAccountFormat";

function agentActivityLabel(state: AgentActivityState): string {
  switch (state) {
    case "idle":
      return "Idle";
    case "thinking":
      return "Thinking";
    case "planning":
      return "Planning";
    case "tool_selection":
      return "Choosing tool";
    case "calling_tool":
      return "Calling tool";
    case "waiting_wallet":
      return "Waiting for wallet";
    case "waiting_search":
      return "Waiting on search";
    case "looking_up_blockchain":
      return "Blockchain lookup";
    case "payment_required":
      return "Payment required";
    case "payment_authorizing":
      return "Authorizing payment";
    case "settling":
      return "Settling";
    case "rendering_result":
      return "Rendering";
    case "streaming":
      return "Streaming answer";
    case "error":
      return "Error";
    default:
      return state;
  }
}

function HomeShell() {
  const {
    isConnected,
    account,
    publicKey,
    connectWallet,
    network,
    refreshAccount,
    status,
    freighterDetected,
    readinessLabel,
    isWalletReady,
  } = useStellarWallet();
  const { activity, paymentReceipts } = useAgentWorkflow();
  const reputation = useReputation();
  const isDetecting = status === "detecting";
  const isConnecting = status === "connecting";
  const freighterAvailable = freighterDetected;
  const [showApp, setShowApp] = useState(isConnected);
  const [catalogServiceId, setCatalogServiceId] = useState(DEFAULT_SERVICE_ID);
  const [policy, setPolicy] = useState<PolicyState>({
    spendCapUsdc: 0.02,
    approvalMode: "explicit",
    allowlistOnly: false,
    automationPaused: false,
    humanOverride: false,
  });
  const caps = trpc.agent.capabilities.useQuery(undefined, { staleTime: 60_000 });

  const landingPreview = useMemo(
    () => ({
      walletLabel:
        isConnected && (publicKey ?? account?.publicKey)
          ? truncatePublicKey(publicKey ?? account!.publicKey)
          : `Demo ${truncatePublicKey(mockWalletState.address)}`,
      network: isConnected ? (network === "mainnet" ? "Mainnet" : "Testnet") : "Testnet (mock)",
      query: "USDC liquidity routes on Stellar",
      estimate: "0.001 USDC · Search MCP (web)",
      approval: "Explicit approval",
      result: "Structured results + audit trail",
    }),
    [isConnected, publicKey, account?.publicKey, network]
  );

  if (!isConnected && !showApp) {
    return (
      <ConsoleLanding
        preview={landingPreview}
        onConnectLaunch={() => {
          setShowApp(true);
          void connectWallet();
        }}
        onDemoLaunch={() => setShowApp(true)}
      />
    );
  }

  const networkLabel = network === "mainnet" ? "Mainnet" : "Testnet";

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <a
        href="#console-search"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-[var(--surface-elevated)] focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to search console
      </a>
      <header className="border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-[var(--shadow-card)] border border-white/10 shrink-0">
                  <Zap className="w-6 h-6 text-[var(--primary-foreground)]" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-semibold tracking-tight text-[var(--text)] truncate">Stellar agent console</h1>
                  <p className="text-xs text-[var(--muted-text)]">Wallet · x402 demo · Search MCP · Horizon</p>
                </div>
              </div>
              <nav
                className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--muted-text)]"
                aria-label="Console sections"
              >
                <a className="hover:text-[var(--accent-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-sm" href="#guardrails">
                  Guardrails
                </a>
                <a className="hover:text-[var(--accent-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-sm" href="#mcp-catalog">
                  MCP catalog
                </a>
                <a className="hover:text-[var(--accent-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-sm" href="#console-search">
                  Search &amp; x402
                </a>
                <a className="hover:text-[var(--accent-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-sm" href="#contract-state">
                  Contract
                </a>
                <a className="hover:text-[var(--accent-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-sm" href="#audit-log">
                  Audit log
                </a>
              </nav>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end">
              <Badge variant="outline" className="border-cyan-500/35 text-cyan-200 text-[10px]">
                {networkLabel}
              </Badge>
              <Badge
                variant="outline"
                className={`text-[10px] ${caps.data?.llmConfigured ? "border-emerald-500/40 text-emerald-300" : "border-amber-500/40 text-amber-200"}`}
              >
                {caps.data?.llmConfigured ? "LLM live" : "LLM required"}
              </Badge>
              {STELLAR_SEARCH_USES_MOCK && (
                <Badge variant="outline" className="border-amber-500/35 text-amber-200 text-[10px]">
                  Search mock
                </Badge>
              )}
              {!isConnected && (
                <Badge variant="outline" className="border-slate-600 text-slate-300 text-[10px]">
                  Wallet optional
                </Badge>
              )}
              {isConnected && (publicKey ?? account?.publicKey) && (
                <span
                  className="text-xs font-mono text-cyan-400/90 truncate max-w-[10rem]"
                  title={publicKey ?? account?.publicKey}
                >
                  {(publicKey ?? account!.publicKey).slice(0, 6)}…{(publicKey ?? account!.publicKey).slice(-4)}
                </span>
              )}
              {reputation.hydrated && (
                <span className="inline-flex items-center gap-1.5" title="Behavioral reputation in this browser">
                  <TierBadge tier={reputation.summary.score.tier} />
                  <span className="text-[10px] text-slate-500 tabular-nums">{reputation.summary.score.value}</span>
                  <TrendGlyph trend={reputation.summary.score.trend} />
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div
        className="border-b border-[var(--border)] bg-[var(--surface)]/75"
        role="status"
        aria-live="polite"
        aria-label="App connection status"
      >
        <div className="container mx-auto px-4 py-2.5 text-xs text-[var(--muted-text)] flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1">
          <span className="min-w-0">
            <span className="text-slate-500">Wallet: </span>
            <span className="text-slate-200">{readinessLabel}</span>
            {!isWalletReady && isConnected ? (
              <span className="text-amber-200/90"> · Finish setup in the wallet card</span>
            ) : null}
          </span>
          <span className="hidden sm:inline text-slate-700" aria-hidden>
            ·
          </span>
          <span>
            <span className="text-slate-500">Freighter: </span>
            {freighterAvailable === null && "Checking…"}
            {freighterAvailable === true && "Installed"}
            {freighterAvailable === false && "Required — not detected"}
          </span>
          <span className="hidden sm:inline text-slate-700" aria-hidden>
            ·
          </span>
          <span>
            <span className="text-slate-500">Agent: </span>
            {agentActivityLabel(activity)}
          </span>
          <span className="hidden sm:inline text-slate-700" aria-hidden>
            ·
          </span>
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500">Data: </span>
            <DemoLiveBadge
              mode={
                STELLAR_SEARCH_USES_MOCK ||
                caps.data?.searchMode === "mock" ||
                caps.data?.searchMode == null
                  ? "mock_search"
                  : "live"
              }
            />
            {isWalletReady ? (
              <DemoLiveBadge mode="live_stellar" />
            ) : (
              <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-300">
                Stellar data gated
              </Badge>
            )}
            {!isConnected ? (
              <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-300">
                Wallet not connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] border-emerald-500/35 text-emerald-200">
                Real wallet connected
              </Badge>
            )}
          </span>
          <span className="hidden sm:inline text-slate-700" aria-hidden>
            ·
          </span>
          <span>
            <span className="text-slate-500">x402 (demo): </span>
            {paymentReceipts.length > 0
              ? `${paymentReceipts.length} simulated settlement${paymentReceipts.length === 1 ? "" : "s"}`
              : "none yet"}
          </span>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 max-w-[100vw] overflow-x-hidden space-y-6">
        <section className="app-hero" aria-labelledby="console-hero-title">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 id="console-hero-title" className="text-lg font-semibold text-[var(--text)] tracking-tight">
                Control center
              </h2>
              <p className="text-sm text-[var(--muted-text)] max-w-2xl leading-relaxed mt-1">
                One surface for wallet health, explicit x402 approval, Search MCP catalog inspection, Soroban market context,
                agent chat, and an auditable timeline. Demo labels stay visible so mock and live paths never blur together.
              </p>
            </div>
            {!isConnected && (
              <Button
                type="button"
                size="sm"
                className="btn-primary shrink-0 h-10"
                onClick={() => void connectWallet()}
                disabled={isDetecting || isConnecting || freighterAvailable === false}
              >
                Connect Freighter
              </Button>
            )}
          </div>
        </section>

        {!isConnected && (
          <Alert className="border-cyan-500/25 bg-[var(--surface)]/80">
            <Wallet className="h-4 w-4 text-cyan-400" aria-hidden />
            <AlertTitle className="text-cyan-200">Demo mode — wallet optional</AlertTitle>
            <AlertDescription className="text-[var(--muted-text)] text-sm leading-relaxed">
              Chat, tasks, and mock search run without Freighter. Connect when you want live balances, sequence, and
              Horizon activity in the dashboard.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-3 space-y-6 min-w-0">
            <AppSection
              title="Wallet & session"
              description="Provider, address, balance, and network. Signing readiness is surfaced for x402-style auth entries."
            >
              <WalletConnect />
            </AppSection>
            <div id="guardrails" className="scroll-mt-28">
              <AppSection
                title="Policy & guardrails"
                description="Spend caps, approval mode, allowlists, and pause — first-class controls, not warnings."
              >
                <PolicyControls policy={policy} onChange={setPolicy} />
              </AppSection>
            </div>
            <div id="mcp-catalog" className="scroll-mt-28">
              <AppSection
                title="Service discovery"
                description="Inspect MCP tools, pricing, and whether human approval is required before spend."
              >
                <ServiceCatalogConsole selectedId={catalogServiceId} onSelect={setCatalogServiceId} />
              </AppSection>
            </div>
            <AppSection
              title="Account dashboard"
              description="Live Horizon rows for the connected address when a wallet is ready."
            >
              <AccountDashboard onConnectRequest={() => void connectWallet()} />
            </AppSection>
            <div id="contract-state" className="scroll-mt-28">
              <AppSection
                title="Onchain snapshot (demo registry)"
                description="Observability-style view of registry fields plus session settlements."
              >
                <ContractStatePanel />
              </AppSection>
            </div>
            <AppSection
              title="Soroban market"
              description="Registered agents, pricing, escrow hooks, and reputation counters when a contract id is configured."
            >
              <ContractMarketPanel network={network} />
            </AppSection>
            <div id="audit-log" className="scroll-mt-28">
              <AuditLogPanel />
            </div>
          </div>

          <div className="xl:col-span-6 flex flex-col gap-6 min-w-0 min-h-0">
            <AppSection
              title="Search request composer"
              description="Quote → approval → simulated settlement → MCP-backed search. Mirrors the story judges expect from x402 + Stellar."
            >
              <AgenticSearchWorkflow policy={policy} serviceId={catalogServiceId} />
            </AppSection>
            <AppSection
              title="Agent chat"
              description="Plans and tool calls stay visible. Demo or mock sources are labeled on each result card."
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="min-h-[min(70vh,720px)] min-h-[22rem] h-full flex flex-col">
                <AgentChat walletPublicKey={publicKey ?? account?.publicKey} />
              </div>
            </AppSection>
          </div>

          <div className="xl:col-span-3 min-w-0 min-h-[min(24rem,50vh)] xl:min-h-[min(70vh,720px)] flex flex-col">
            <AppSection
              title="Task monitor"
              description="Stage, progress, elapsed time, and the last few timeline events for the current turn."
              className="flex flex-col flex-1 min-h-0 h-full"
            >
              <div className="flex-1 min-h-0 flex flex-col">
                <AgentTaskPanel embedded />
              </div>
            </AppSection>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)]/85 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-xs text-[var(--muted-text)]">
          Stellar agent console · Horizon {networkLabel} ·{" "}
          <a
            href="https://developers.stellar.org"
            className="text-[var(--accent-primary)] hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Developers
          </a>{" "}
          ·{" "}
          <a href="https://freighter.app" className="text-[var(--accent-primary)] hover:underline" target="_blank" rel="noreferrer">
            Freighter
          </a>
        </div>
      </footer>
    </div>
  );
}

export default HomeShell;
