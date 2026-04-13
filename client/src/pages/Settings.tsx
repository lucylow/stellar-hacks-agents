import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, Lock, Bell, Palette, Copy, Check } from "lucide-react";

export default function Settings() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navItems = [
    { icon: Wallet, label: "Wallet", active: true },
    { icon: Lock, label: "Security", active: false },
    { icon: Bell, label: "Notifications", active: false },
    { icon: Palette, label: "Preferences", active: false },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar walletConnected={walletConnected} onWalletToggle={setWalletConnected} />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="space-y-2">
              {navItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      item.active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-card"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Wallet Settings */}
            <Card className="p-6 bg-card border-border">
              <h2 className="text-2xl font-bold mb-6">Wallet Settings</h2>
              
              <div className="space-y-6">
                {/* Connected Wallet */}
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-2 block">Connected Wallet</label>
                  <div className="flex gap-3">
                    <Input
                      value="GBRPYHIL2CI3..."
                      readOnly
                      className="bg-background border-border"
                    />
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      className="gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Network */}
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-2 block">Network</label>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 bg-background border-border">Testnet</Button>
                    <Button variant="outline" className="flex-1">Mainnet</Button>
                  </div>
                </div>

                {/* Balance */}
                <div className="p-4 bg-background rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                  <p className="text-2xl font-bold text-accent">1,250.00 USDC</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                    Add Funds
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Disconnect
                  </Button>
                </div>
              </div>
            </Card>

            {/* Query Limits */}
            <Card className="p-6 bg-card border-border">
              <h2 className="text-xl font-bold mb-6">Query Limits</h2>
              
              <div className="space-y-4">
                {[
                  { service: "Web Search", used: 450, limit: 1000, percentage: 45 },
                  { service: "Market Data", used: 180, limit: 500, percentage: 36 },
                  { service: "News Feed", used: 890, limit: 2000, percentage: 44 },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{item.service}</span>
                      <span className="text-sm text-muted-foreground">{item.used}/{item.limit}</span>
                    </div>
                    <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-accent h-full rounded-full transition-all"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Policies */}
            <Card className="p-6 bg-card border-border">
              <h2 className="text-xl font-bold mb-6">Smart Contract Policies</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-background rounded-lg border border-border">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">Daily Query Limit</p>
                      <p className="text-sm text-muted-foreground">5000 queries/day</p>
                    </div>
                    <Button size="sm" variant="outline">Edit</Button>
                  </div>
                </div>

                <div className="p-4 bg-background rounded-lg border border-border">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">Daily Spending Limit</p>
                      <p className="text-sm text-muted-foreground">$50/day</p>
                    </div>
                    <Button size="sm" variant="outline">Edit</Button>
                  </div>
                </div>

                <div className="p-4 bg-background rounded-lg border border-border">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">Auto-Approval Threshold</p>
                      <p className="text-sm text-muted-foreground">$0.01 per query</p>
                    </div>
                    <Button size="sm" variant="outline">Edit</Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="p-6 bg-card border-destructive/50">
              <h2 className="text-xl font-bold mb-4 text-destructive">Danger Zone</h2>
              
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  These actions cannot be undone. Please proceed with caution.
                </p>
                <Button variant="destructive" className="w-full">
                  Revoke All Approvals
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
