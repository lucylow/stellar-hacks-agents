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
import { useState } from "react";
import { useStellarWallet } from "@/_core/context/StellarWalletContext";
import { useAgentWorkflow } from "@/_core/context/AgentWorkflowContext";
import type { AgentActivityState } from "@shared/appConnectionModel";
import { WalletConnect } from "@/components/WalletConnect";
import { AgentChat } from "@/components/AgentChat";
import { AccountDashboard } from "@/components/AccountDashboard";
import { AgentTaskPanel } from "@/components/AgentTaskPanel";
import { AppSection, DemoLiveBadge } from "@/components/app/uiPrimitives";
import { Zap, Wallet, ArrowRight, Sparkles, Cpu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { STELLAR_SEARCH_USES_MOCK } from "@shared/const";
import { LayoutSection } from "@/components/LayoutSection";
import { SearchDemoPanel } from "@/components/SearchDemoPanel";
import { ActivityFeedSection } from "@/components/ActivityFeedSection";
import { useReputation } from "@/_core/context/ReputationContext";
import { TierBadge, TrendGlyph } from "@/components/reputation/TrustPrimitives";
import { ContractMarketPanel } from "@/components/ContractMarketPanel";

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
  const caps = trpc.agent.capabilities.useQuery(undefined, { staleTime: 60_000 });

  if (!isConnected && !showApp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-20 left-10 w-96 h-96 bg-purple-500/8 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
        </div>

        <header className="relative z-10 border-b border-cyan-500/15 bg-slate-950/50 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md shadow-cyan-900/40">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400">
                  Stellar AI Agent
                </h1>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-end">
                <Badge variant="outline" className="border-slate-600 text-slate-300 text-[10px]">
                  Demo
                </Badge>
                {STELLAR_SEARCH_USES_MOCK && (
                  <Badge variant="outline" className="border-amber-500/35 text-amber-200 text-[10px]">
                    Search mock
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10 container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-5xl md:text-6xl font-bold">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-300">
                  Blockchain AI
                </span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Meets Intelligence
                </span>
              </h2>
              <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Connect Freighter for live Horizon data, or open the demo to chat and inspect the agent workflow without a
                wallet.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-12">
              {[
                {
                  icon: Wallet,
                  title: "Wallet connect",
                  body: "Freighter + configurable testnet or mainnet Horizon.",
                  border: "border-cyan-500/25",
                },
                {
                  icon: Cpu,
                  title: "AI agents",
                  body: "LLM tool calls with visible search and lookup steps.",
                  border: "border-purple-500/25",
                },
                {
                  icon: Search,
                  title: "Search bridge",
                  body: "Structured cards for mock or future live MCP search.",
                  border: "border-pink-500/25",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className={`relative bg-slate-900/40 ${f.border} rounded-xl p-6 transition hover:border-opacity-60 hover:shadow-lg hover:shadow-black/20`}
                >
                  <f.icon className="w-8 h-8 text-cyan-400 mb-3" />
                  <h3 className="text-lg font-semibold text-slate-100 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button
                type="button"
                onClick={() => {
                  setShowApp(true);
                  void connectWallet();
                }}
                className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-black font-semibold px-8 py-6 text-lg rounded-lg shadow-md shadow-cyan-900/40 flex items-center gap-2"
              >
                <Wallet className="w-5 h-5" />
                Connect wallet & launch
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                type="button"
                onClick={() => setShowApp(true)}
                variant="outline"
                className="border-purple-500/40 text-purple-200 hover:bg-purple-950/40 px-8 py-6 text-lg rounded-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Explore demo (no wallet)
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-16 border-t border-slate-800/80">
              <div className="text-center">
                <p className="text-3xl font-bold text-cyan-400">Stellar</p>
                <p className="text-sm text-slate-500 mt-1">Native scope</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-400">tRPC</p>
                <p className="text-sm text-slate-500 mt-1">Typed API</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-pink-400">Tools</p>
                <p className="text-sm text-slate-500 mt-1">Visible steps</p>
              </div>
            </div>
          </div>
        </main>

        <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/40 backdrop-blur-md mt-20">
          <div className="container mx-auto px-4 py-8">
            <p className="text-center text-sm text-slate-500">
              DoraHacks Stellar Agents x402 Stripe MPP | Stellar testnet/mainnet via Horizon
            </p>
          </div>
        </footer>
      </div>
    );
  }

  const networkLabel = network === "mainnet" ? "Mainnet" : "Testnet";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-cyan-500/15 bg-slate-950/85 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md shadow-slate-900/50">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                  Stellar AI Agent
                </h1>
                <p className="text-xs text-slate-500">Wallet + agent + Horizon</p>
              </div>
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
              <h2 id="console-hero-title" className="text-lg font-semibold text-cyan-100 tracking-tight">
                Stellar AI console
              </h2>
              <p className="text-sm text-[var(--muted-text)] max-w-2xl leading-relaxed mt-1">
                Wallet status, agent chat, Horizon account data, and task timing in one layout. Anything labeled demo or
                mock uses simulated data — live ledger rows are called out when real.
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
              description="Provider, address, balance, and network. x402 flows are demo-only here."
            >
              <WalletConnect />
            </AppSection>
            <AppSection
              title="Account dashboard"
              description="Live blockchain data from Horizon for the connected address."
            >
              <AccountDashboard onConnectRequest={() => void connectWallet()} />
            </AppSection>
            <AppSection
              title="Soroban market"
              description="Service registry, onchain pricing, escrow/settlement hooks, and reputation counters when a contract id is configured."
            >
              <ContractMarketPanel network={network} />
            </AppSection>
            <ActivityFeedSection />
          </div>

          <div className="xl:col-span-6 flex flex-col gap-6 min-w-0 min-h-0">
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

      <div id="search-demo" className="container mx-auto px-4 pb-10">
        <LayoutSection
          title="Search experience (demo)"
          description="Uses the same tRPC search procedure as the agent. Results are labeled mock data until a live MCP server is connected."
        >
          <SearchDemoPanel />
        </LayoutSection>
      </div>

      <footer className="border-t border-cyan-500/15 bg-slate-950/80 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-xs text-slate-500">
          Stellar AI Agent · Horizon {networkLabel} ·{" "}
          <a href="https://freighter.app" className="text-cyan-500/90 hover:underline" target="_blank" rel="noreferrer">
            Freighter
          </a>
        </div>
      </footer>
    </div>
  );
}

export default HomeShell;
