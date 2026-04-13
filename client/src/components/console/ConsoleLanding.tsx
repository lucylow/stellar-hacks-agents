import { Zap, Wallet, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STELLAR_SEARCH_USES_MOCK } from "@shared/const";
import { StatusPill } from "./StatusPill";

type ConsoleLandingProps = {
  onConnectLaunch: () => void;
  onDemoLaunch: () => void;
  preview: {
    walletLabel: string;
    network: string;
    query: string;
    estimate: string;
    approval: string;
    result: string;
  };
};

export function ConsoleLanding({ onConnectLaunch, onDemoLaunch, preview }: ConsoleLandingProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden flex flex-col">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34, 211, 238, 0.15), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(56, 189, 248, 0.1), transparent 50%), radial-gradient(ellipse 50% 35% at 0% 80%, rgba(14, 165, 233, 0.08), transparent 45%)",
        }}
      />

      <header className="relative z-10 border-b border-[var(--border)] bg-gradient-to-r from-[var(--background)] via-[var(--background)]/95 to-[var(--background)] backdrop-blur-sm">
        <div className="container mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-300/30 flex-shrink-0">
              <Zap className="w-6 h-6 text-[var(--primary-foreground)]" aria-hidden />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-[var(--foreground)]">Stellar Agent Console</p>
              <p className="text-xs text-[var(--muted-foreground)]">x402 · Search MCP · Explicit Approval</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Badge variant="outline" className="border-cyan-500/40 bg-cyan-500/5 text-cyan-300 text-xs font-medium">
              Demo-ready
            </Badge>
            {STELLAR_SEARCH_USES_MOCK ? (
              <Badge variant="outline" className="border-amber-500/40 bg-amber-500/5 text-amber-300 text-xs font-medium">
                Search mock
              </Badge>
            ) : null}
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                Stellar · x402 · MCP
              </p>
              <h1 className="text-5xl md:text-6xl font-black text-[var(--foreground)] leading-tight tracking-tight">
                Pay-per-request search<br /><span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">agents can trust.</span>
              </h1>
            </div>
            <p className="text-lg text-[var(--muted-foreground)] leading-relaxed max-w-lg">
              Connect a Stellar wallet, review a transparent quote, approve spend, then execute Search MCP tools — with an audit trail you can show judges in under a minute.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="button"
                onClick={onConnectLaunch}
                className="h-13 px-8 text-base font-semibold gap-2 justify-center bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:shadow-cyan-500/50"
              >
                <Wallet className="w-5 h-5 shrink-0" aria-hidden />
                Connect Wallet
                <ArrowRight className="w-5 h-5 shrink-0" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onDemoLaunch}
                className="h-13 px-8 text-base font-semibold border-2 border-cyan-500/40 bg-cyan-500/5 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500/60 gap-2 justify-center transition-all duration-300"
              >
                <Sparkles className="w-5 h-5 shrink-0" aria-hidden />
                Try Demo (Mock)
              </Button>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] pt-2">
              Demo mode uses mock settlement. Live Freighter sessions keep the same approval UX with real signing where configured.
            </p>
          </div>

          <aside
            className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-transparent backdrop-blur-md p-7 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-shadow duration-300"
            aria-label="Console preview"
          >
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-6">Live Preview</p>
            <dl className="space-y-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cyan-500/15">
                <dt className="text-[var(--muted-foreground)] font-medium">Wallet</dt>
                <dd className="flex items-center gap-2 min-w-0">
                  <StatusPill tone="info" srLabel={`Wallet ${preview.walletLabel}`}>
                    {preview.walletLabel}
                  </StatusPill>
                </dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cyan-500/15">
                <dt className="text-[var(--muted-foreground)] font-medium">Network</dt>
                <dd className="font-mono text-xs text-cyan-300 font-semibold">{preview.network}</dd>
              </div>
              <div className="pb-3 border-b border-cyan-500/15">
                <dt className="text-[var(--muted-foreground)] text-xs font-medium mb-2">Search Query</dt>
                <dd className="text-[var(--foreground)] text-sm leading-snug font-medium">{preview.query}</dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cyan-500/15">
                <dt className="text-[var(--muted-foreground)] font-medium">Estimate</dt>
                <dd className="font-mono text-xs text-cyan-300 font-semibold">{preview.estimate}</dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cyan-500/15">
                <dt className="text-[var(--muted-foreground)] font-medium">Approval</dt>
                <dd>
                  <StatusPill tone="warning" srLabel={`Approval ${preview.approval}`}>
                    {preview.approval}
                  </StatusPill>
                </dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <dt className="text-[var(--muted-foreground)] font-medium">Result</dt>
                <dd>
                  <StatusPill tone="success" srLabel={`Result ${preview.result}`}>
                    {preview.result}
                  </StatusPill>
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </main>

      <footer className="relative z-10 border-t border-cyan-500/20 bg-gradient-to-r from-[var(--background)] via-[var(--background)]/95 to-[var(--background)] backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-xs text-[var(--muted-foreground)]">
          <p className="font-medium">Human-in-the-loop guardrails · Audit-friendly logs · Stellar testnet / mainnet via Freighter</p>
        </div>
      </footer>
    </div>
  );
}
