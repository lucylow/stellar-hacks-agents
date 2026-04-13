import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCw, TrendingUp, TrendingDown, Zap, Copy, User, Layers, Activity } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatXlmBalance, truncatePublicKey, mapHorizonError } from "@shared/stellarAccountFormat";
import type { StellarNetworkMode } from "@shared/stellarHorizon";
import type { StellarTxRecord, StellarOperationRecord } from "@shared/appConnectionModel";

type AccountDashboardProps = {
  publicKey: string;
  network: StellarNetworkMode;
  onRefreshWallet?: () => void;
};

export function AccountDashboard({ publicKey, network, onRefreshWallet }: AccountDashboardProps) {
  const [transactions, setTransactions] = useState<StellarTxRecord[]>([]);
  const [copied, setCopied] = useState(false);

  const accountQuery = trpc.stellar.getAccountDetails.useQuery(
    { publicKey, network },
    { retry: 1 }
  );
  const transactionsQuery = trpc.stellar.getRecentTransactions.useQuery(
    { publicKey, limit: 10, network },
    { retry: 1 }
  );
  const operationsQuery = trpc.stellar.getOperations.useQuery(
    { publicKey, limit: 8, network },
    { retry: 1 }
  );

  const isRefreshing =
    accountQuery.isFetching || transactionsQuery.isFetching || operationsQuery.isFetching;

  const lastDataTick = Math.max(
    accountQuery.dataUpdatedAt,
    transactionsQuery.dataUpdatedAt,
    operationsQuery.dataUpdatedAt
  );

  const handleRefresh = async () => {
    await Promise.all([
      accountQuery.refetch(),
      transactionsQuery.refetch(),
      operationsQuery.refetch(),
    ]);
    onRefreshWallet?.();
  };

  useEffect(() => {
    if (transactionsQuery.data) setTransactions(transactionsQuery.data as StellarTxRecord[]);
  }, [transactionsQuery.data]);

  const accountErr =
    accountQuery.error instanceof Error
      ? mapHorizonError(accountQuery.error)
      : accountQuery.error
        ? mapHorizonError(new Error(String(accountQuery.error)))
        : null;

  const networkLabel = network === "mainnet" ? "Mainnet" : "Testnet";

  const copyPk = () => {
    void navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="outline" className="border-cyan-500/40 text-cyan-200/90">
          Horizon · {networkLabel}
        </Badge>
        <div className="flex flex-wrap items-center gap-2">
          {lastDataTick > 0 && (
            <span className="text-[11px] text-slate-500 tabular-nums">
              Updated {new Date(lastDataTick).toLocaleTimeString()}
            </span>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
            className="border-cyan-500/35 text-cyan-200"
            aria-label="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden />
            Refresh
          </Button>
        </div>
      </div>

      {/* Identity */}
      <Card className="border border-cyan-500/25 bg-slate-950/90 p-4 space-y-3">
        <h3 className="text-cyan-400 font-semibold flex items-center gap-2 text-sm">
          <User className="w-4 h-4" aria-hidden />
          Account identity
        </h3>
        {accountQuery.isLoading ? (
          <div className="space-y-2" aria-busy>
            <Skeleton className="h-4 w-full bg-slate-800" />
            <Skeleton className="h-4 w-2/3 bg-slate-800" />
          </div>
        ) : accountQuery.data ? (
          <div className="space-y-2 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-500">Public key</span>
              <div className="flex items-center gap-1">
                <code className="text-xs font-mono text-cyan-300">{truncatePublicKey(publicKey, 10, 8)}</code>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-cyan-400"
                  onClick={copyPk}
                  aria-label={copied ? "Copied" : "Copy public key"}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Data from Horizon at {networkLabel}. Sequence and subentries update when you refresh.
            </p>
          </div>
        ) : (
          <Alert className="border-amber-500/30 bg-amber-950/15">
            <AlertTitle className="text-amber-200">{accountErr?.title ?? "No account data"}</AlertTitle>
            <AlertDescription className="text-sm text-amber-100/85">
              {accountErr?.userMessage ?? "Connect a funded account on this network or switch network mode."}
            </AlertDescription>
            <Button type="button" size="sm" variant="outline" className="mt-2 border-amber-500/40" onClick={() => void handleRefresh()}>
              Retry
            </Button>
          </Alert>
        )}
      </Card>

      {/* Balances & meta */}
      <Card className="border border-purple-500/25 bg-slate-950/90 p-4 space-y-3">
        <h3 className="text-purple-400 font-semibold flex items-center gap-2 text-sm">
          <Layers className="w-4 h-4" aria-hidden />
          Balances & sequence
        </h3>
        {accountQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-3" aria-busy>
            <Skeleton className="h-14 bg-slate-800" />
            <Skeleton className="h-14 bg-slate-800" />
          </div>
        ) : accountQuery.data ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs">XLM</p>
              <p className="text-cyan-300 font-mono text-lg tabular-nums">
                {formatXlmBalance(accountQuery.data.balance)} XLM
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Sequence</p>
              <p className="text-purple-300 font-mono text-sm break-all">{accountQuery.data.sequenceNumber}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Subentries</p>
              <p className="text-purple-300 font-mono">{accountQuery.data.subentryCount}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Account id</p>
              <p className="text-cyan-300/90 font-mono text-xs truncate" title={accountQuery.data.id}>
                {truncatePublicKey(accountQuery.data.id, 12, 8)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Load account details to see balances.</p>
        )}
      </Card>

      {/* Activity */}
      <Card className="border border-purple-500/25 bg-slate-950/90 p-4 space-y-3">
        <h3 className="text-purple-400 font-semibold flex items-center gap-2 text-sm">
          <Activity className="w-4 h-4" aria-hidden />
          Activity preview
        </h3>

        <div>
          <p className="text-xs text-slate-500 mb-2">Recent transactions</p>
          {transactionsQuery.isLoading ? (
            <Skeleton className="h-24 w-full bg-slate-800" />
          ) : transactionsQuery.error ? (
            <Alert variant="destructive" className="text-sm">
              <AlertTitle>Transactions</AlertTitle>
              <AlertDescription>Could not load transactions. Try refresh.</AlertDescription>
            </Alert>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">No recent transactions, or account is new on this network.</p>
          ) : (
            <ScrollArea className="h-48 rounded-md border border-purple-500/15">
              <ul className="space-y-2 p-2 pr-4">
                {transactions.map((tx) => (
                  <li
                    key={tx.id}
                    className="bg-slate-900/50 border border-purple-500/15 rounded-md p-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
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

        <div>
          <p className="text-xs text-slate-500 mb-2">Recent operations</p>
          {operationsQuery.isLoading ? (
            <Skeleton className="h-20 w-full bg-slate-800" />
          ) : operationsQuery.error ? (
            <p className="text-sm text-slate-500">Operations unavailable.</p>
          ) : !operationsQuery.data?.length ? (
            <p className="text-sm text-slate-500">No operations loaded.</p>
          ) : (
            <ScrollArea className="h-36 rounded-md border border-cyan-500/15">
              <ul className="space-y-1.5 p-2 pr-4">
                {(operationsQuery.data as StellarOperationRecord[]).map((op) => (
                  <li key={op.id} className="text-xs text-slate-300 flex justify-between gap-2 border-b border-slate-800/80 pb-1.5">
                    <span className="text-cyan-300/90">{op.type}</span>
                    <span className="text-slate-500 shrink-0">{new Date(op.created_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>
      </Card>

      <Card className="border border-cyan-500/20 bg-slate-950/60 p-3 flex items-center gap-2 text-xs text-slate-500">
        <Zap className="w-4 h-4 text-cyan-500 shrink-0" aria-hidden />
        <span>Dashboard uses the same network mode as the wallet card. Horizon errors are isolated so your connection state stays stable.</span>
      </Card>
    </div>
  );
}
