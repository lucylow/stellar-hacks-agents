import { useState } from "react";
import { useStellarWallet } from "@/_core/context/StellarWalletContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Wallet, Copy, LogOut, Loader2, RefreshCw, Radio, AlertCircle } from "lucide-react";
import { truncatePublicKey } from "@shared/stellarAccountFormat";
import { STELLAR_SEARCH_USES_MOCK } from "@shared/const";

export function WalletConnect() {
  const {
    status,
    isConnected,
    publicKey,
    account,
    balance,
    accountSequence,
    subentryCount,
    network,
    providerName,
    error,
    refreshError,
    lastRefreshedAt,
    freighterDetected,
    connectWallet,
    disconnectWallet,
    refreshAccount,
    setNetwork,
  } = useStellarWallet();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const readyLabel = !isConnected ? "Not connected" : account ? "Ready" : "Connected (Horizon pending)";
  const networkLabel = network === "mainnet" ? "Mainnet" : "Testnet";

  return (
    <Card className="border border-cyan-500/25 bg-slate-950/90 shadow-md shadow-cyan-950/20 p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-cyan-400 font-semibold flex items-center gap-2 flex-1 min-w-[12rem]">
          <Wallet className="w-4 h-4 shrink-0" aria-hidden />
          Stellar wallet
        </h3>
        <div className="flex flex-wrap gap-1.5 justify-end">
          <Badge variant="outline" className="border-cyan-500/40 text-cyan-200/90 text-[10px] uppercase tracking-wide">
            Stellar
          </Badge>
          <Badge variant="outline" className="border-purple-500/40 text-purple-200/90 text-[10px] uppercase tracking-wide">
            Freighter
          </Badge>
          <Badge variant="outline" className="border-slate-500/50 text-slate-300 text-[10px] uppercase tracking-wide">
            {networkLabel}
          </Badge>
          <Badge
            variant="outline"
            className={`text-[10px] uppercase tracking-wide ${
              isConnected ? "border-emerald-500/40 text-emerald-300" : "border-amber-500/40 text-amber-200"
            }`}
          >
            {readyLabel}
          </Badge>
          {STELLAR_SEARCH_USES_MOCK && (
            <Badge variant="outline" className="border-amber-500/35 text-amber-200/90 text-[10px]">
              Search mock
            </Badge>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Connect Freighter to sign Stellar transactions, load live account balances from Horizon, and give the agent your
        public key for personalized answers.
      </p>

      {status === "detecting" && (
        <div
          className="flex items-center gap-2 text-sm text-cyan-200/90"
          role="status"
          aria-live="polite"
          aria-label="Scanning for Freighter wallet"
        >
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" aria-hidden />
          Scanning for Freighter…
        </div>
      )}

      {freighterDetected === false && status !== "detecting" && (
        <Alert className="border-amber-500/35 bg-amber-950/20">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <AlertTitle className="text-amber-200">Freighter required</AlertTitle>
          <AlertDescription className="text-amber-100/80 text-sm">
            Freighter not detected. Install the extension for Chrome or Firefox, then refresh this page.
          </AlertDescription>
        </Alert>
      )}

      {error && (status === "error" || status === "connecting") && (
        <Alert variant="destructive" className="border-red-500/40 bg-red-950/25">
          <AlertTitle>Could not connect</AlertTitle>
          <AlertDescription className="text-sm">{error}</AlertDescription>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3 border-red-400/40"
            onClick={() => void connectWallet()}
          >
            Retry connection
          </Button>
        </Alert>
      )}

      {refreshError && isConnected && (
        <Alert className="border-amber-500/35 bg-amber-950/20">
          <AlertTitle className="text-amber-200">Refresh issue</AlertTitle>
          <AlertDescription className="text-sm text-amber-100/85">{refreshError}</AlertDescription>
        </Alert>
      )}

      {isConnected && publicKey && (
        <div className="space-y-3 rounded-lg border border-cyan-500/20 bg-slate-900/40 p-3">
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Provider</span>
              <span className="text-slate-200 font-medium">{providerName ?? "—"}</span>
            </div>
            <div className="flex justify-between gap-2 items-center">
              <span className="text-slate-500">Public key</span>
              <div className="flex items-center gap-1 min-w-0">
                <code className="text-xs font-mono text-cyan-300 truncate max-w-[10rem] sm:max-w-[14rem]">
                  {truncatePublicKey(publicKey, 8, 6)}
                </code>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 text-cyan-400"
                  onClick={() => copyToClipboard(publicKey)}
                  aria-label={copied ? "Copied public key" : "Copy full public key"}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">XLM balance</span>
              <span className="font-mono text-cyan-300">{balance} XLM</span>
            </div>
            <div className="flex justify-between gap-2 text-xs">
              <span className="text-slate-500">Sequence</span>
              <span className="font-mono text-purple-300">{accountSequence ?? "—"}</span>
            </div>
            <div className="flex justify-between gap-2 text-xs">
              <span className="text-slate-500">Subentries</span>
              <span className="font-mono text-purple-300">{subentryCount ?? "—"}</span>
            </div>
            <div className="flex justify-between gap-2 text-xs text-slate-500">
              <span>Network</span>
              <span className="text-slate-300">{networkLabel}</span>
            </div>
            {lastRefreshedAt && (
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-800">
                Last refreshed {new Date(lastRefreshedAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-cyan-500/35"
              onClick={() => setNetwork(network === "testnet" ? "mainnet" : "testnet")}
              aria-label={`Switch to ${network === "testnet" ? "mainnet" : "testnet"}`}
            >
              <Radio className="w-3.5 h-3.5 mr-1" aria-hidden />
              Use {network === "testnet" ? "mainnet" : "testnet"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-cyan-500/35"
              onClick={() => void refreshAccount()}
              aria-label="Refresh account from Horizon"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" aria-hidden />
              Refresh
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-purple-300 ml-auto"
              onClick={disconnectWallet}
              aria-label="Disconnect wallet"
            >
              <LogOut className="w-4 h-4 mr-1" aria-hidden />
              Disconnect
            </Button>
          </div>
        </div>
      )}

      {!isConnected && (
        <div className="space-y-2">
          <Button
            type="button"
            onClick={() => void connectWallet()}
            disabled={status === "connecting" || status === "detecting"}
            className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-black font-semibold focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            aria-busy={status === "connecting"}
          >
            {status === "connecting" ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                Connecting…
              </span>
            ) : (
              "Connect Freighter"
            )}
          </Button>
          {status === "disconnected" && freighterDetected && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full border-purple-500/35 text-purple-200"
              onClick={() => void connectWallet()}
            >
              Reconnect wallet
            </Button>
          )}
          <p className="text-[11px] text-slate-500 text-center">
            Unsupported without a Chromium-based or Firefox browser and the Freighter extension.
          </p>
        </div>
      )}
    </Card>
  );
}
