import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCw, TrendingUp, TrendingDown, Zap, Copy, User, Layers, Activity, Globe } from "lucide-react";
import { formatXlmBalance, truncatePublicKey, mapHorizonError } from "@shared/stellarAccountFormat";
import type { StellarTxRecord, StellarOperationRecord } from "@shared/appConnectionModel";
import { useReputation } from "@/_core/context/ReputationContext";
import {
  approximateScoreTrail,
  onChainSuccessRateFromTx,
  accountActivityTrendFromOps,
} from "@shared/reputationCompute";
import { TierBadge, TrendGlyph, TrustSparkline } from "@/components/reputation/TrustPrimitives";
import { Shield } from "lucide-react";
import {
  EmptyState,
  InlineLoading,
  ErrorState,
  StatusBadge,
  MetricCard,
  SectionCard,
  TraceTimeline,
  CategoryChip,
} from "@/components/app/uiPrimitives";
import { useStellarWallet } from "@/_core/context/StellarWalletContext";
import { interpretStellarAccountPanel } from "@shared/blockchainInterpret";
import { trpc } from "@/lib/trpc";
import { PaymentHistory } from "@/components/payment/PaymentHistory";

type AccountDashboardProps = {
  onConnectRequest?: () => void;
};

export function AccountDashboard({ onConnectRequest }: AccountDashboardProps) {
  const [copied, setCopied] = useState(false);
  const { summary, setHorizonSuccessRate, hydrated } = useReputation();
  const w = useStellarWallet();
  const paymentEventsQuery = trpc.payments.getEvents.useQuery({ limit: 20 }, { retry: 0 });

  const publicKey = w.publicKey;
  const network = w.network;

  const isRefreshing =
    w.isAccountSyncing || w.isFetchingTransactions || w.isFetchingOperations || w.isFetchingNetwork;

  const handleRefresh = async () => {
    await w.refreshAccount();
  };

  useEffect(() => {
    if (!w.transactions.length) {
      setHorizonSuccessRate(null);
      return;
    }
    setHorizonSuccessRate(onChainSuccessRateFromTx(w.transactions));
  }, [w.transactions, setHorizonSuccessRate]);

  const accountErr = w.refreshError
    ? mapHorizonError(new Error(w.refreshError))
    : null;

  const networkLabel = network === "mainnet" ? "Mainnet" : "Testnet";
  const activityTrend = accountActivityTrendFromOps(w.operations);
  const scoreTrail = approximateScoreTrail(summary.recentEvents);

  const interpretationLines = interpretStellarAccountPanel({
    account: w.account,
    network,
    transactions: w.transactions,
    operations: w.operations,
    txsError: w.transactionsError,
    opsError: w.operationsError,
  });

  const copyPk = () => {
    if (!publicKey) return;
    void navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const latestTx = w.transactions[0];
  const latestOp = w.operations[0];

  const traceItems = [
    {
      id: "conn",
      label: "Wallet connection",
      detail: publicKey ? truncatePublicKey(publicKey, 8, 6) : undefined,
      state: publicKey ? ("done" as const) : ("todo" as const),
    },
    {
      id: "acct",
      label: "Account refresh",
      detail: w.lastRefreshedAt
        ? new Date(w.lastRefreshedAt).toLocaleString()
        : w.isAccountSyncing
          ? "In progress…"
          : undefined,
      state: w.account ? ("done" as const) : w.isAccountSyncing ? ("current" as const) : ("todo" as const),
    },
    {
      id: "tx",
      label: "Latest transaction in view",
      detail: latestTx
        ? `${truncatePublicKey(latestTx.hash, 8, 6)} · ${latestTx.successful ? "Success" : "Failed"}`
        : w.transactionsError
          ? "Could not load"
          : publicKey && !w.isFetchingTransactions
            ? "None in this window"
            : undefined,
      state: latestTx ? ("done" as const) : w.isFetchingTransactions ? ("current" as const) : ("todo" as const),
    },
    {
      id: "op",
      label: "Latest operation in view",
      detail: latestOp
        ? `${latestOp.type} · ${truncatePublicKey(latestOp.transaction_hash, 8, 6)}`
        : w.operationsError
          ? "Could not load"
          : publicKey && !w.isFetchingOperations
            ? "None in this window"
            : undefined,
      state: latestOp ? ("done" as const) : w.isFetchingOperations ? ("current" as const) : ("todo" as const),
    },
    {
      id: "agent",
      label: "Agent action",
      detail: "Use Agent chat to run blockchain_lookup or search tools on this session.",
      state: "todo" as const,
    },
  ];

  if (!publicKey) {
    return (
      <EmptyState
        title="Connect Freighter to view Stellar account data"
        body="You’ll see live XLM balance, sequence, subentries, recent transactions, and operations from Horizon for Testnet or Mainnet. Chat still works in demo mode without a wallet."
        action={
          onConnectRequest ? (
            <Button type="button" size="sm" className="btn-primary" onClick={() => void onConnectRequest()}>
              Connect Freighter
            </Button>
          ) : null
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryChip category="blockchain" />
          <StatusBadge tone="ok">Live Stellar data</StatusBadge>
          <Badge variant="outline" className="border-cyan-500/40 text-cyan-200/90 text-[10px]">
            Horizon · {networkLabel}
          </Badge>
          {w.hasPartialHorizonData ? (
            <StatusBadge tone="warn">Partial load</StatusBadge>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {w.lastRefreshedAt && (
            <span className="text-[11px] text-slate-500 tabular-nums">
              Account updated {new Date(w.lastRefreshedAt).toLocaleTimeString()}
            </span>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
            className="border-cyan-500/35 text-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-500/50"
            aria-label="Refresh Horizon account, transactions, and operations"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden />
            Refresh Horizon
          </Button>
        </div>
      </div>

      <SectionCard
        title="Chain trace"
        icon={<Activity className="w-4 h-4 text-cyan-400" aria-hidden />}
        className="border-cyan-500/20"
      >
        <p className="text-[11px] text-slate-500 leading-snug">
          Links wallet refresh, recent ledger rows, and where to continue in chat — not a full explorer.
        </p>
        <TraceTimeline items={traceItems} />
      </SectionCard>

      {/* Identity */}
      <SectionCard title="Account identity" icon={<User className="w-4 h-4 text-cyan-400" aria-hidden />}>
        {w.isAccountSyncing && !w.account ? (
          <div className="space-y-2" aria-busy aria-label="Loading account identity">
            <InlineLoading label="Fetching account identity from Horizon…" className="py-1" />
            <Skeleton className="h-4 w-full bg-slate-800" />
            <Skeleton className="h-4 w-2/3 bg-slate-800" />
          </div>
        ) : w.account ? (
          <div className="space-y-2 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-500">Public key</span>
              <div className="flex items-center gap-1">
                <code className="text-xs font-mono text-cyan-300">{truncatePublicKey(publicKey, 10, 8)}</code>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500/50"
                  onClick={copyPk}
                  aria-label={copied ? "Copied public key" : "Copy public key"}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Live account row from Horizon on {networkLabel}. Sequence and subentries change when you transact.
            </p>
          </div>
        ) : (
          <Alert className="border-amber-500/30 bg-amber-950/15">
            <AlertTitle className="text-amber-200">{accountErr?.title ?? "No account data"}</AlertTitle>
            <AlertDescription className="text-sm text-amber-100/85">
              {accountErr?.userMessage ??
                "This address may be unfunded on this network, or Horizon is temporarily unavailable."}
            </AlertDescription>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2 border-amber-500/40"
              onClick={() => void handleRefresh()}
            >
              Retry Horizon fetch
            </Button>
          </Alert>
        )}
      </SectionCard>

      <div className="rounded-lg border border-purple-500/20 bg-slate-950/80 p-3 space-y-2">
        <p className="text-[10px] uppercase tracking-wide text-purple-300/90">What this means</p>
        <ul className="list-disc pl-4 text-[11px] text-slate-400 space-y-1 leading-relaxed">
          {interpretationLines.slice(0, 6).map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>

      {/* Reputation & on-chain trust */}
      <SectionCard
        title="Account trust signals"
        icon={<Shield className="w-4 h-4 text-emerald-400" aria-hidden />}
        className="border-emerald-500/20"
        headerClassName="text-emerald-400"
      >
        {!hydrated ? (
          <p className="text-sm text-slate-500" role="status">
            Loading trust summary…
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="space-y-2 rounded-md border border-emerald-500/15 bg-slate-900/40 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <TierBadge tier={summary.score.tier} />
                <TrendGlyph trend={summary.score.trend} />
                <span className="text-cyan-300 font-mono tabular-nums">{summary.score.value}/100</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Confidence {Math.round(summary.score.confidence * 100)}% · Demo label: {summary.demoModeLabel}
              </p>
              <TrustSparkline values={scoreTrail} />
            </div>
            <div className="space-y-2 rounded-md border border-cyan-500/15 bg-slate-900/40 p-3 text-xs">
              <div className="flex justify-between gap-2 text-slate-400">
                <span>Agent success / fail</span>
                <span className="text-slate-200 tabular-nums">
                  {summary.successCount} / {summary.failureCount}
                </span>
              </div>
              {summary.refundCount > 0 ? (
                <div className="flex justify-between gap-2 text-amber-400/90">
                  <span>Refund signals</span>
                  <span className="tabular-nums">{summary.refundCount}</span>
                </div>
              ) : null}
              <div className="flex justify-between gap-2 text-slate-400">
                <span>Tx success in view</span>
                <span className="text-slate-200 tabular-nums">
                  {summary.settlementSuccessRate != null
                    ? `${Math.round(summary.settlementSuccessRate * 100)}%`
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between gap-2 text-slate-400">
                <span>Activity cadence</span>
                <span className="text-slate-200 capitalize">{activityTrend}</span>
              </div>
              <div className="flex justify-between gap-2 text-slate-400">
                <span>Trust updated</span>
                <span className="text-slate-200">{new Date(summary.lastUpdated).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}
        <p className="text-[11px] text-slate-500 leading-snug">
          On-chain percentages use the transactions loaded in this panel alongside agent runs in this browser.
        </p>
      </SectionCard>

      {/* Balances & meta */}
      <SectionCard
        title="Balance & sequence"
        icon={<Layers className="w-4 h-4 text-purple-400" aria-hidden />}
        className="border-purple-500/25"
        headerClassName="text-purple-400"
      >
        {w.isAccountSyncing && !w.account ? (
          <div className="grid grid-cols-2 gap-3" aria-busy>
            <Skeleton className="h-14 bg-slate-800" />
            <Skeleton className="h-14 bg-slate-800" />
          </div>
        ) : w.account ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MetricCard
              label="XLM (native)"
              value={<span className="font-mono text-cyan-300">{formatXlmBalance(w.account.balance)} XLM</span>}
              hint="Spendable native balance on this network."
            />
            <MetricCard
              label="Sequence"
              value={<span className="font-mono text-purple-300 break-all">{w.account.sequenceNumber}</span>}
              hint="Increments with each included transaction — protects against replay."
            />
            <MetricCard
              label="Subentries"
              value={<span className="font-mono text-purple-300">{w.account.subentryCount}</span>}
              hint="Trustlines, offers, and similar entries; each adds reserve requirement."
            />
            <MetricCard
              label="Account id"
              value={
                <span className="font-mono text-cyan-300/90 text-xs truncate" title={w.account.id}>
                  {truncatePublicKey(w.account.id, 12, 8)}
                </span>
              }
            />
          </div>
        ) : (
          <p className="text-sm text-[var(--muted-text)]">No account details yet — retry refresh above.</p>
        )}
      </SectionCard>

      {/* Network status */}
      <SectionCard
        title="Network status"
        icon={<Globe className="w-4 h-4 text-sky-400" aria-hidden />}
        headerClassName="text-sky-300"
      >
        {w.isFetchingNetwork && !w.networkInfo ? (
          <InlineLoading label="Fetching latest ledger and fee data from Horizon…" />
        ) : w.networkInfoError ? (
          <ErrorState
            title="Network info unavailable"
            body={w.networkInfoError}
            onRetry={() => void w.refreshNetworkInfo()}
            retryLabel="Retry network info"
          />
        ) : w.networkInfo ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <MetricCard
              label="Latest ledger"
              value={w.networkInfo.latestLedger}
              hint="Tip of the ledger this Horizon node reports."
            />
            <MetricCard label="Base fee (stroops)" value={w.networkInfo.baseFee} />
            <MetricCard label="Base reserve (stroops)" value={w.networkInfo.baseReserve} />
            <div className="rounded-md border border-slate-800 bg-slate-900/50 p-2 space-y-1">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Passphrase</p>
              <p className="text-[10px] text-slate-400 break-words leading-snug">{w.networkInfo.networkPassphrase}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Network metadata not loaded yet.</p>
        )}
      </SectionCard>

      {/* Activity */}
      <SectionCard
        title="Activity"
        icon={<Activity className="w-4 h-4 text-purple-400" aria-hidden />}
        className="border-purple-500/25"
        headerClassName="text-purple-400"
      >
        <div>
          <p className="text-xs text-slate-500 mb-2">Recent transactions</p>
          {w.isFetchingTransactions && w.transactions.length === 0 ? (
            <Skeleton className="h-24 w-full bg-slate-800" aria-busy />
          ) : w.transactionsError ? (
            <ErrorState
              title="Could not load transactions"
              body={w.transactionsError}
              onRetry={() => void w.refreshTransactions()}
            />
          ) : w.transactions.length === 0 ? (
            <p className="text-sm text-[var(--muted-text)] py-2">
              No recent transactions in this Horizon window — this account may be new or quiet on {networkLabel}.
            </p>
          ) : (
            <ScrollArea className="h-48 rounded-md border border-purple-500/15">
              <ul className="space-y-2 p-2 pr-4">
                {w.transactions.map((tx: StellarTxRecord) => (
                  <li
                    key={tx.id}
                    className="bg-slate-900/50 border border-purple-500/15 rounded-md p-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="sr-only">{tx.successful ? "Successful" : "Failed"}</span>
                        {tx.successful ? (
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 text-red-400 shrink-0" aria-hidden />
                        )}
                        <span className="font-mono text-cyan-300 truncate">{truncatePublicKey(tx.hash, 10, 6)}</span>
                      </div>
                      <span className="text-slate-500 shrink-0">L{tx.ledger}</span>
                    </div>
                    <p className="text-slate-500">{tx.type}</p>
                    <p className="text-slate-500 truncate" title={tx.source_account}>
                      From {truncatePublicKey(tx.source_account, 8, 4)}
                    </p>
                    <p className="text-purple-400/90 mt-1">{new Date(tx.created_at).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>

        <div className="pt-3">
          <p className="text-xs text-slate-500 mb-2">Recent operations</p>
          {w.isFetchingOperations && w.operations.length === 0 ? (
            <Skeleton className="h-20 w-full bg-slate-800" aria-busy />
          ) : w.operationsError ? (
            <ErrorState
              title="Could not load operations"
              body={w.operationsError}
              onRetry={() => void w.refreshOperations()}
            />
          ) : w.operations.length === 0 ? (
            <p className="text-sm text-slate-500">No recent operations returned — try refresh after activity.</p>
          ) : (
            <ScrollArea className="h-36 rounded-md border border-cyan-500/15">
              <ul className="space-y-1.5 p-2 pr-4">
                {w.operations.map((op: StellarOperationRecord) => (
                  <li
                    key={op.id}
                    className="text-xs text-slate-300 flex flex-col gap-0.5 border-b border-slate-800/80 pb-1.5"
                  >
                    <div className="flex justify-between gap-2 flex-wrap">
                      <span className="text-cyan-300/90 font-medium">{op.type}</span>
                      <time className="text-slate-500 shrink-0" dateTime={op.created_at}>
                        {new Date(op.created_at).toLocaleString()}
                      </time>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono truncate" title={op.transaction_hash}>
                      Tx {truncatePublicKey(op.transaction_hash, 10, 6)}
                    </p>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Payment traces"
        icon={<Zap className="w-4 h-4 text-amber-400" aria-hidden />}
        className="border-amber-500/25"
        headerClassName="text-amber-200/95"
      >
        <div className="flex flex-wrap gap-2 mb-2">
          <CategoryChip category="demo" label="Demo x402 ledger" />
          <StatusBadge tone="warn">Simulated</StatusBadge>
        </div>
        <p className="text-xs text-slate-500">
          Payment middleware ledger (this server). Distinct from Horizon activity above until live x402 is wired.
        </p>
        <PaymentHistory />
        <div className="mt-3 pt-3 border-t border-amber-500/10">
          <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Debug events</p>
          {paymentEventsQuery.isLoading ? (
            <Skeleton className="h-10 w-full bg-slate-800" />
          ) : paymentEventsQuery.error || !paymentEventsQuery.data?.length ? (
            <p className="text-[11px] text-slate-600">No structured events yet.</p>
          ) : (
            <ul className="space-y-1 text-[10px] text-slate-500 max-h-28 overflow-y-auto pr-1">
              {paymentEventsQuery.data.slice(0, 15).map((ev) => (
                <li key={ev.id} className="flex justify-between gap-2 border-b border-slate-800/80 pb-1">
                  <span className="text-cyan-600/90 shrink-0">{ev.type}</span>
                  <span className="truncate text-right">{ev.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SectionCard>

      <CardFootnote />
    </div>
  );
}

function CardFootnote() {
  return (
    <div className="rounded-lg border border-cyan-500/20 bg-slate-950/60 p-3 flex items-center gap-2 text-xs text-slate-500">
      <Zap className="w-4 h-4 text-cyan-500 shrink-0" aria-hidden />
      <span>
        Dashboard reads the same network mode as the wallet card. If one Horizon call fails, others can still show —
        watch the partial load badge.
      </span>
    </div>
  );
}
