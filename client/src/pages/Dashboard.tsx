import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, Wallet, TrendingUp, Activity, Settings } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Dashboard() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress] = useState("GBRPYHIL2CI3FIQQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H");

  // Fetch wallet info and transactions from API
  const walletInfo = trpc.wallet.getInfo.useQuery(
    { address: walletAddress },
    { enabled: walletConnected }
  );

  const transactions = trpc.wallet.getTransactions.useQuery(
    { address: walletAddress, limit: 5 },
    { enabled: walletConnected }
  );

  const stats = [
    { label: "Total Spent", value: "$24.50", change: "+12.5%", icon: TrendingUp },
    { label: "Queries Used", value: walletInfo.data?.queriesUsed.toLocaleString() || "24,500", change: "+8.2%", icon: Activity },
    { label: "Wallet Balance", value: `$${walletInfo.data?.balance.toFixed(2) || "1,250.00"}`, change: "Stable", icon: Wallet },
    { label: "Avg Cost/Query", value: "$0.001", change: "-2.1%", icon: ArrowDownLeft },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar walletConnected={walletConnected} onWalletToggle={setWalletConnected} />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your StellarHacks Agent activity and transactions</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx} className="p-6 bg-card border-border hover:border-accent/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-accent mt-2">{stat.change}</p>
                  </div>
                  <Icon className="w-8 h-8 text-accent opacity-60" />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transaction History */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Recent Transactions</h2>
                <Button variant="outline" size="sm">View All</Button>
              </div>
              
              <div className="space-y-4">
                {transactions.isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
                ) : transactions.data ? (
                  transactions.data.map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-background/50 rounded-lg hover:bg-background transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${tx.type === 'query' ? 'bg-accent/20' : 'bg-green-500/20'}`}>
                          {tx.type === 'query' ? (
                            <ArrowUpRight className="w-5 h-5 text-accent" />
                          ) : (
                            <ArrowDownLeft className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{tx.service} {tx.type}</p>
                          <p className="text-sm text-muted-foreground">{new Date(tx.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{tx.type === 'query' ? '-' : '+'}{tx.amount} USDC</p>
                        <p className="text-xs text-green-500 capitalize">{tx.status}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No transactions yet</div>
                )}
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <Card className="p-6 bg-card border-border">
              <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button 
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => setWalletConnected(!walletConnected)}
                >
                  {walletConnected ? "✓ Connected" : "Connect Wallet"}
                </Button>
                <Button variant="outline" className="w-full">
                  Add Funds
                </Button>
                <Button variant="outline" className="w-full">
                  View Policies
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-accent/20 to-primary/20 border-accent/30">
              <h3 className="text-lg font-bold mb-2">Pro Tip</h3>
              <p className="text-sm text-muted-foreground">
                Batch your queries to reduce transaction costs and improve performance.
              </p>
            </Card>

            {walletInfo.data && (
              <Card className="p-6 bg-card border-border">
                <h3 className="text-lg font-bold mb-4">Wallet Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network:</span>
                    <span className="font-medium capitalize">{walletInfo.data.network}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Limit:</span>
                    <span className="font-medium">{walletInfo.data.queryLimit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Spend Limit:</span>
                    <span className="font-medium">${walletInfo.data.spendingLimit}/day</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
