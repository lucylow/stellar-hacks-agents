import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreditCard, Loader2, ShieldCheck, Wallet } from "lucide-react";
import type { PaymentMode } from "@shared/paymentTypes";

const FALLBACK_PAYEE = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

function modeLabel(mode: PaymentMode): string {
  switch (mode) {
    case "per_request":
      return "Per-request";
    case "prepaid_credits":
      return "Prepaid credits";
    case "session_streaming":
      return "Session";
    case "demo_free":
      return "Demo free";
    default:
      return mode;
  }
}

type PaymentChallengeCardProps = {
  amount: number;
  currency: string;
  challengeId: string;
  queryId: string;
  expiresAt?: Date;
  networkLabel: string;
  walletConnected: boolean;
  paymentMode: PaymentMode;
  payee?: string;
  serviceDescription?: string;
  routeReason?: string;
  authEntrySigningRequired?: boolean;
  authEntrySigningAvailable?: boolean;
  blockReason?: string;
  status: "pending" | "authorizing" | "settled" | "failed";
  error?: string;
  onAuthorize: () => void;
};

export function PaymentChallengeCard({
  amount,
  currency,
  challengeId,
  queryId,
  expiresAt,
  networkLabel,
  walletConnected,
  paymentMode,
  payee,
  serviceDescription,
  routeReason,
  authEntrySigningRequired = true,
  authEntrySigningAvailable = false,
  blockReason,
  status,
  error,
  onAuthorize,
}: PaymentChallengeCardProps) {
  const busy = status === "authorizing";
  const gated = Boolean(blockReason);
  const canClick = status === "pending" && !busy && !gated;

  const payeeDisplay = payee && payee.length > 10 ? payee : FALLBACK_PAYEE;

  return (
    <div
      className="rounded-lg border border-amber-500/40 bg-gradient-to-br from-amber-950/40 to-slate-950/80 p-3 space-y-3"
      role="region"
      aria-label="Payment required"
    >
      <div className="flex flex-wrap items-center gap-2">
        <CreditCard className="w-4 h-4 text-amber-400 shrink-0" aria-hidden />
        <p className="text-sm font-semibold text-amber-100">Payment required</p>
        <Badge variant="outline" className="text-[9px] border-amber-500/45 text-amber-200">
          {modeLabel(paymentMode)}
        </Badge>
        <Badge variant="outline" className="text-[9px] border-slate-500/40 text-slate-300">
          {networkLabel}
        </Badge>
        {authEntrySigningRequired ? (
          <Badge
            variant="outline"
            className={`text-[9px] ${authEntrySigningAvailable ? "border-emerald-500/40 text-emerald-200" : "border-amber-500/40 text-amber-200"}`}
          >
            Auth entry {authEntrySigningAvailable ? "ready" : "missing"}
          </Badge>
        ) : null}
      </div>
      {serviceDescription && <p className="text-xs text-amber-100/90 font-medium">{serviceDescription}</p>}
      {routeReason && <p className="text-[11px] text-slate-500 leading-snug">{routeReason}</p>}
      <p className="text-xs text-slate-300 leading-relaxed">
        Server-issued quote (x402 / MPP-style negotiation). On Stellar, x402 uses Soroban authorization entries; Freighter
        browser extension supports signing. This build simulates approve → settle → unlock tools.
      </p>
      <dl className="grid gap-1.5 text-xs text-slate-300">
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">Amount</dt>
          <dd className="font-mono text-amber-200">
            {amount} {currency}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">Pay to</dt>
          <dd className="font-mono text-[10px] text-cyan-300/90 truncate max-w-[14rem]" title={payeeDisplay}>
            {payeeDisplay.slice(0, 12)}…{payeeDisplay.slice(-8)}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">Challenge</dt>
          <dd className="font-mono text-[10px] text-slate-400 truncate max-w-[12rem]">{challengeId}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">Request ref</dt>
          <dd className="font-mono text-[10px] text-slate-400 truncate max-w-[12rem]">{queryId}</dd>
        </div>
        {expiresAt && (
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Valid until</dt>
            <dd className="text-slate-400">{expiresAt.toLocaleString()}</dd>
          </div>
        )}
      </dl>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
        <Wallet className="w-3.5 h-3.5 shrink-0" aria-hidden />
        {walletConnected ? (
          <span className="text-emerald-300/90">Wallet connected</span>
        ) : (
          <span className="text-amber-200/90">Connect Freighter so the payer address matches your session.</span>
        )}
      </div>

      {blockReason && (
        <Alert className="border-amber-500/35 bg-amber-950/25">
          <AlertTitle className="text-amber-200 text-sm">Cannot authorize yet</AlertTitle>
          <AlertDescription className="text-xs text-amber-100/85">{blockReason}</AlertDescription>
        </Alert>
      )}

      {error && status === "failed" && (
        <Alert variant="destructive" className="border-red-500/40">
          <AlertTitle className="text-sm">Payment failed</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="button"
        size="sm"
        disabled={!canClick}
        onClick={onAuthorize}
        className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-semibold focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        aria-busy={busy}
      >
        {busy ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            Authorizing…
          </span>
        ) : (
          "Authorize payment (simulated)"
        )}
      </Button>
    </div>
  );
}

type PaymentSuccessCardProps = {
  transactionHash: string;
  amount: number;
  currency: string;
  unlockedSummary: string;
  networkLabel: string;
};

export function PaymentSuccessCard({
  transactionHash,
  amount,
  currency,
  unlockedSummary,
  networkLabel,
}: PaymentSuccessCardProps) {
  return (
    <div
      className="rounded-lg border border-emerald-500/35 bg-emerald-950/20 p-3 space-y-2"
      role="status"
      aria-label="Payment settled"
    >
      <div className="flex flex-wrap items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden />
        <p className="text-sm font-semibold text-emerald-100">Payment settled</p>
        <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-200">
          {networkLabel}
        </Badge>
      </div>
      <p className="text-xs text-slate-300">{unlockedSummary}</p>
      <p className="text-[11px] text-slate-500">
        <span className="text-slate-500">Settlement ref: </span>
        <code className="text-emerald-300/90 font-mono break-all">{transactionHash}</code>
      </p>
      <p className="text-[10px] text-slate-500">
        Recorded {amount} {currency} — align with Horizon when using live x402 / channel settlement.
      </p>
    </div>
  );
}
