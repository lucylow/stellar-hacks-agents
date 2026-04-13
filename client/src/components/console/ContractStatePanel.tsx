import { Card } from "@/components/ui/card";
import { mockContractState } from "@/lib/mockData";
import { CopyButton } from "./CopyButton";
import { useAgentWorkflow } from "@/_core/context/AgentWorkflowContext";
import { Activity, ExternalLink } from "lucide-react";
import { StatusPill } from "./StatusPill";

export function ContractStatePanel() {
  const { paymentReceipts } = useAgentWorkflow();
  const c = mockContractState;

  return (
    <Card className="app-card border border-[var(--border)] bg-[var(--surface-elevated)]/90 p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
          <Activity className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden />
          Contract & settlement (demo)
        </h3>
        <StatusPill tone="demo" srLabel="Observability uses mock registry fields">
          Mock registry
        </StatusPill>
      </div>
      <p className="text-xs text-[var(--muted-text)] leading-relaxed">
        Mirrors how registration, pricing, and policy would surface onchain. Receipts below mix simulated x402 rows from this session.
      </p>

      <dl className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)]/70 p-3">
          <dt className="text-[var(--muted-text)]">Contract</dt>
          <dd className="mt-1 flex items-center gap-2 min-w-0">
            <span className="font-mono text-[10px] break-all text-[var(--text)]">{c.contractId}</span>
            <CopyButton text={c.contractId} label="Copy contract id" />
          </dd>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)]/70 p-3">
          <dt className="text-[var(--muted-text)]">Network</dt>
          <dd className="mt-1 font-mono text-[var(--text)]">{c.network}</dd>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)]/70 p-3">
          <dt className="text-[var(--muted-text)]">Owner</dt>
          <dd className="mt-1 flex items-center gap-2 min-w-0">
            <span className="font-mono text-[10px] break-all">{c.owner}</span>
            <CopyButton text={c.owner} label="Copy owner address" />
          </dd>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)]/70 p-3">
          <dt className="text-[var(--muted-text)]">Approval mode</dt>
          <dd className="mt-1 text-[var(--text)]">{c.approvalMode}</dd>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)]/70 p-3">
          <dt className="text-[var(--muted-text)]">Paused</dt>
          <dd className="mt-1">{c.isPaused ? "Yes" : "No"}</dd>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)]/70 p-3">
          <dt className="text-[var(--muted-text)]">Total spent (demo)</dt>
          <dd className="mt-1 font-mono text-[var(--accent-primary)]">{c.totalSpent} USDC</dd>
        </div>
      </dl>

      <div>
        <p className="text-xs font-medium text-[var(--text)] mb-2">Recent settlements (session)</p>
        {paymentReceipts.length === 0 ? (
          <p className="text-xs text-[var(--muted-text)]">No simulated settlements yet — approve a search payment to populate this list.</p>
        ) : (
          <ul className="space-y-2" aria-label="Recent payment receipts">
            {paymentReceipts.slice(0, 5).map((r) => (
              <li key={r.id} className="rounded-md border border-[var(--border)] bg-[var(--surface)]/60 p-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-[var(--muted-text)]">{r.networkLabel}</span>
                  <StatusPill tone="success" srLabel="Simulated settlement">
                    {r.status}
                  </StatusPill>
                </div>
                <p className="mt-1 text-[var(--text)] line-clamp-2">{r.promptSnippet}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] break-all">{r.transactionHash}</span>
                  <CopyButton text={r.transactionHash} label="Copy transaction hash" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <a
        href="https://developers.stellar.org"
        className="inline-flex items-center gap-1 text-xs text-[var(--accent-primary)] underline-offset-2 hover:underline"
        target="_blank"
        rel="noreferrer"
      >
        Stellar docs
        <ExternalLink className="h-3 w-3" aria-hidden />
      </a>
    </Card>
  );
}
