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
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34, 211, 238, 0.12), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(56, 189, 248, 0.08), transparent 50%), radial-gradient(ellipse 50% 35% at 0% 80%, rgba(14, 165, 233, 0.06), transparent 45%)",
        }}
      />

      <header className="relative z-10 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center shadow-[var(--shadow-card)] border border-white/10">
              <Zap className="w-6 h-6 text-[var(--primary-foreground)]" aria-hidden />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-[var(--text)]">Stellar agent console</p>
              <p className="text-xs text-[var(--muted-text)]">x402 · Search MCP · explicit approval</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-end">
            <Badge variant="outline" className="border-[var(--border)] text-[var(--muted-text)] text-[10px]">
              Demo-ready
            </Badge>
            {STELLAR_SEARCH_USES_MOCK ? (
              <Badge variant="outline" className="border-amber-500/35 text-amber-200 text-[10px]">
                Search mock
              </Badge>
            ) : null}
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-primary)]">
              Stellar · x402 · MCP
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text)] leading-tight">
              Pay-per-request search agents can trust.
            </h1>
            <p className="text-base md:text-lg text-[var(--muted-text)] leading-relaxed">
              Connect a Stellar wallet, review a transparent quote, approve spend, then execute Search MCP tools — with an audit trail you can show judges in under a minute.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                onClick={onConnectLaunch}
                className="btn-primary h-12 px-6 text-base gap-2 justify-center"
              >
                <Wallet className="w-5 h-5 shrink-0" aria-hidden />
                Connect wallet
                <ArrowRight className="w-5 h-5 shrink-0" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onDemoLaunch}
                className="h-12 px-6 text-base border-[var(--border)] text-[var(--text)] gap-2 justify-center"
              >
                <Sparkles className="w-5 h-5 shrink-0" aria-hidden />
                Try demo (mock flow)
              </Button>
            </div>
            <p className="text-xs text-[var(--muted-text)]">
              Demo mode uses mock settlement. Live Freighter sessions keep the same approval UX with real signing where configured.
            </p>
          </div>

          <aside
            className="rounded-[var(--radius-card)] border border-[var(--border-strong)] bg-[var(--surface-elevated)]/90 backdrop-blur-md p-5 shadow-[var(--shadow-elevated)]"
            aria-label="Console preview"
          >
            <p className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wide mb-4">Live preview</p>
            <dl className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="text-[var(--muted-text)]">Wallet</dt>
                <dd className="flex items-center gap-2 min-w-0">
                  <StatusPill tone="info" srLabel={`Wallet ${preview.walletLabel}`}>
                    {preview.walletLabel}
                  </StatusPill>
                </dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="text-[var(--muted-text)]">Network</dt>
                <dd className="font-mono text-xs text-[var(--accent-primary)]">{preview.network}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted-text)] text-xs mb-1">Search query</dt>
                <dd className="text-[var(--text)] text-sm leading-snug">{preview.query}</dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="text-[var(--muted-text)]">Estimate</dt>
                <dd className="font-mono text-xs text-[var(--text)]">{preview.estimate}</dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="text-[var(--muted-text)]">Approval</dt>
                <dd>
                  <StatusPill tone="warning" srLabel={`Approval ${preview.approval}`}>
                    {preview.approval}
                  </StatusPill>
                </dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="text-[var(--muted-text)]">Result</dt>
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

      <footer className="relative z-10 border-t border-[var(--border)] bg-[var(--surface)]/70 backdrop-blur-md mt-12">
        <div className="container mx-auto px-4 py-8 text-center text-xs text-[var(--muted-text)]">
          Human-in-the-loop guardrails · Audit-friendly logs · Stellar testnet / mainnet via Freighter
        </div>
      </footer>
    </div>
  );
}
