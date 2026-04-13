import { useState } from "react";
import { useStellarWallet } from "@/_core/hooks/useStellarWallet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet, Copy, LogOut } from "lucide-react";

export function WalletConnect() {
  const { isConnected, isConnecting, account, error, connectWallet, disconnectWallet } =
    useStellarWallet();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isConnected && account) {
    return (
      <Card className="bg-slate-950 border-cyan-500/50 p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-cyan-400 font-semibold flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Stellar Wallet Connected
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={disconnectWallet}
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-950/30"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-400">Public Key</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-slate-900 text-cyan-300 px-2 py-1 rounded text-xs font-mono truncate flex-1">
                  {account.publicKey}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(account.publicKey)}
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <p className="text-gray-400">XLM Balance</p>
              <p className="text-cyan-300 font-mono text-lg">
                {parseFloat(account.balance).toFixed(2)} XLM
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-400">Sequence</p>
                <p className="text-purple-300 font-mono">{account.sequenceNumber}</p>
              </div>
              <div>
                <p className="text-gray-400">Subentries</p>
                <p className="text-purple-300 font-mono">{account.subentryCount}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-950 border-cyan-500/50 p-4">
      <div className="space-y-3">
        <h3 className="text-cyan-400 font-semibold flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Connect Stellar Wallet
        </h3>

        {error && (
          <div className="bg-red-950/50 border border-red-500/50 text-red-300 text-sm p-2 rounded">
            {error}
          </div>
        )}

        <Button
          onClick={connectWallet}
          disabled={isConnecting}
          className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-black font-semibold"
        >
          {isConnecting ? "Connecting..." : "Connect Freighter Wallet"}
        </Button>

        <p className="text-xs text-gray-400 text-center">
          Make sure you have the Freighter wallet extension installed
        </p>
      </div>
    </Card>
  );
}
