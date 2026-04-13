import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Transaction {
  id: string;
  hash: string;
  ledger: number;
  created_at: string;
  source_account: string;
  type: string;
  successful: boolean;
}

export function AccountDashboard({ publicKey }: { publicKey: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const accountQuery = trpc.stellar.getAccountDetails.useQuery({ publicKey });
  const transactionsQuery = trpc.stellar.getRecentTransactions.useQuery({
    publicKey,
    limit: 10,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([accountQuery.refetch(), transactionsQuery.refetch()]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (transactionsQuery.data) {
      setTransactions(transactionsQuery.data);
    }
  }, [transactionsQuery.data]);

  return (
    <div className="space-y-4">
      {/* Account Overview */}
      <Card className="bg-slate-950 border-cyan-500/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-cyan-400 font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Account Overview
          </h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-cyan-400 hover:text-cyan-300"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {accountQuery.isLoading ? (
          <div className="text-gray-400 text-sm">Loading account data...</div>
        ) : accountQuery.data ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-xs">Balance</p>
              <p className="text-cyan-300 font-mono text-lg">
                {parseFloat(accountQuery.data.balance).toFixed(2)} XLM
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Sequence</p>
              <p className="text-purple-300 font-mono">
                {accountQuery.data.sequenceNumber}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Subentries</p>
              <p className="text-purple-300 font-mono">{accountQuery.data.subentryCount}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Account ID</p>
              <p className="text-cyan-300 font-mono text-xs truncate">
                {accountQuery.data.id.substring(0, 16)}...
              </p>
            </div>
          </div>
        ) : null}
      </Card>

      {/* Recent Transactions */}
      <Card className="bg-slate-950 border-purple-500/50 p-4">
        <h3 className="text-purple-400 font-semibold mb-4">Recent Transactions</h3>

        {transactionsQuery.isLoading ? (
          <div className="text-gray-400 text-sm">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="text-gray-400 text-sm text-center py-4">
            No transactions found
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-2 pr-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-slate-900/50 border border-purple-500/20 rounded p-3 hover:border-purple-500/50 transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {tx.successful ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-xs font-mono text-cyan-300">
                        {tx.hash.substring(0, 16)}...
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">Ledger {tx.ledger}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    <p>Type: {tx.type}</p>
                    <p className="truncate">From: {tx.source_account.substring(0, 20)}...</p>
                    <p className="text-purple-400 mt-1">
                      {new Date(tx.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
}
