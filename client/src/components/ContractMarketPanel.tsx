import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ACCESS_PAID,
  ACCESS_PUBLIC,
  ACCESS_RESTRICTED,
  STATUS_ACTIVE,
  STATUS_DISABLED,
} from "@shared/agentMarketContract";
import type { StellarNetworkMode } from "@shared/stellarHorizon";

function accessLabel(m: number): string {
  if (m === ACCESS_PUBLIC) return "Public";
  if (m === ACCESS_PAID) return "Paid";
  if (m === ACCESS_RESTRICTED) return "Restricted";
  return `Mode ${m}`;
}

function statusLabel(s: number): string {
  if (s === STATUS_ACTIVE) return "Active";
  if (s === STATUS_DISABLED) return "Disabled";
  return `Status ${s}`;
}

type Props = {
  network: StellarNetworkMode;
};

export function ContractMarketPanel({ network }: Props) {
  const cfg = trpc.agentMarket.config.useQuery({ network }, { staleTime: 60_000 });
  const list = trpc.agentMarket.listServices.useQuery(
    { network, startAfter: 0, limit: 16 },
    { enabled: cfg.data?.configured === true, staleTime: 30_000 }
  );
  const firstId = list.data?.services?.[0]?.service_id;
  const rep = trpc.agentMarket.getReputation.useQuery(
    { network, serviceId: firstId ?? 0 },
    { enabled: cfg.data?.configured === true && firstId != null, staleTime: 30_000 }
  );

  if (cfg.isLoading) {
    return (
      <Card className="border-cyan-500/15 bg-[var(--surface)]/80">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-full mt-2" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!cfg.data?.configured) {
    return (
      <Card className="border-amber-500/20 bg-[var(--surface)]/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-amber-100">Onchain market (Soroban)</CardTitle>
          <CardDescription className="text-xs text-[var(--muted-text)]">
            Set <span className="font-mono">SOROBAN_AGENT_MARKET_CONTRACT_ID</span> and optional{" "}
            <span className="font-mono">SOROBAN_RPC_URL</span> on the server to load the service registry, pricing,
            escrow, and reputation from the deployed contract.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const services = list.data?.services ?? [];
  const err = list.error instanceof Error ? list.error.message : list.error ? String(list.error) : null;

  return (
    <div className="space-y-3">
      <Card className="border-cyan-500/15 bg-[var(--surface)]/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-cyan-100">Registry &amp; RPC</CardTitle>
          <CardDescription className="text-xs text-[var(--muted-text)]">
            Live Soroban reads via <span className="font-mono text-[10px] break-all">{cfg.data.rpcUrl}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <p className="font-mono text-[10px] break-all text-slate-300">{cfg.data.contractId}</p>
          <p className="text-slate-500">
            {services.length} service{services.length === 1 ? "" : "s"} onchain
          </p>
          {err ? <p className="text-amber-200/90">{err}</p> : null}
        </CardContent>
      </Card>

      <Card className="border-cyan-500/15 bg-[var(--surface)]/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-cyan-100">Pricing &amp; access</CardTitle>
          <CardDescription className="text-xs text-[var(--muted-text)]">
            Authoritative per-service price and access mode from contract storage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {list.isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : services.length === 0 ? (
            <p className="text-xs text-slate-500">No services registered yet.</p>
          ) : (
            services.map(s => (
              <div
                key={s.service_id}
                className="rounded-md border border-slate-700/50 bg-slate-950/40 p-2 space-y-1"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-200 text-xs">{s.name}</span>
                  <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-300">
                    v{s.price_version}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-200">
                    {accessLabel(s.access_mode)}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                    {statusLabel(s.status)}
                  </Badge>
                </div>
                <p className="text-[10px] text-slate-500 font-mono break-all">{s.endpoint}</p>
                <p className="text-xs text-emerald-200/90 tabular-nums">
                  {s.price} {s.asset}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-cyan-500/15 bg-[var(--surface)]/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-cyan-100">Escrow &amp; settlement</CardTitle>
          <CardDescription className="text-xs text-[var(--muted-text)]">
            Escrow state and settlement rows are read with <span className="font-mono">get_escrow</span> /{" "}
            <span className="font-mono">get_settlement</span> from the task flow or explorer; this panel surfaces catalog
            context only.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-slate-500">
          Use tRPC <span className="font-mono">agentMarket.getEscrow</span>,{" "}
          <span className="font-mono">getSettlement</span>, and <span className="font-mono">getActionReceipt</span> with
          known ids.
        </CardContent>
      </Card>

      <Card className="border-cyan-500/15 bg-[var(--surface)]/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-cyan-100">Reputation (service #1)</CardTitle>
          <CardDescription className="text-xs text-[var(--muted-text)]">
            Onchain counters for the first catalog service when present.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs">
          {firstId == null ? (
            <p className="text-slate-500">No services to score yet.</p>
          ) : rep.isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : rep.data?.reputation ? (
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="outline" className="text-[10px] border-violet-500/35 text-violet-200">
                score {rep.data.reputation.reputation_score}
              </Badge>
              <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-300">
                done {rep.data.reputation.completed_count}
              </Badge>
              <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-300">
                refunds {rep.data.reputation.refund_count}
              </Badge>
              <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-300">
                fail {rep.data.reputation.failure_count}
              </Badge>
            </div>
          ) : (
            <p className="text-slate-500">No reputation row yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
