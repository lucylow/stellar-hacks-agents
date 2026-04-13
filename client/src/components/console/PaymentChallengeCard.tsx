import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "./StatusPill";
import { CopyButton } from "./CopyButton";
import type { PaymentQuote, PaymentPhase } from "@/lib/demoConsoleTypes";
import { CreditCard, ShieldCheck, ShieldOff } from "lucide-react";

type PaymentChallengeCardProps = {
  quote: PaymentQuote | null;
  phase: PaymentPhase;
  disabled: boolean;
  onApprove: () => void;
  onDeny: () => void;
};

function phasePill(phase: PaymentPhase) {
  switch (phase) {
    case "awaiting_approval":
      return (
        <StatusPill tone="warning" srLabel="Awaiting approval">
          Awaiting approval
        </StatusPill>
      );
    case "settling":
      return (
        <StatusPill tone="pending" srLabel="Settling">
          Settling
        </StatusPill>
      );
    case "settled":
      return (
        <StatusPill tone="success" srLabel="Settled">
          Settled
        </StatusPill>
      );
    case "denied":
      return (
        <StatusPill tone="danger" srLabel="Denied">
          Denied
        </StatusPill>
      );
    case "error":
      return (
        <StatusPill tone="danger" srLabel="Error">
          Error
        </StatusPill>
      );
    default:
      return (
        <StatusPill tone="neutral" srLabel="Idle">
          Idle
        </StatusPill>
      );
  }
}

export function PaymentChallengeCard({ quote, phase, disabled, onApprove, onDeny }: PaymentChallengeCardProps) {
  if (!quote) return null;

  return (
    <Card
      className="border border-[var(--border-strong)] bg-[var(--surface)]/95 p-4 space-y-4 shadow-[var(--shadow-card)]"
      role="region"
      aria-labelledby="pay-challenge-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 id="pay-challenge-title" className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden />
            Payment challenge (x402 demo)
          </h4>
          <p className="text-xs text-[var(--muted-text)] mt-1">
            Estimate before execution. Demo mode uses mock settlement; testnet label reflects target network only.
          </p>
        </div>
        {phasePill(phase)}
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-[var(--muted-text)]">Amount</dt>
          <dd className="mt-0.5 font-mono text-sm text-[var(--accent-primary)]">
            {quote.amountUsdc} {quote.currency}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted-text)]">Network</dt>
          <dd className="mt-0.5 font-mono text-[var(--text)]">{quote.networkLabel}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[var(--muted-text)]">Pay to</dt>
          <dd className="mt-0.5 flex flex-wrap items-center gap-2 min-w-0">
            <span className="font-mono text-[10px] break-all text-[var(--text)]">{quote.payToAddress}</span>
            <CopyButton text={quote.payToAddress} label="Copy pay-to address" />
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted-text)]">Request ID</dt>
          <dd className="mt-0.5 flex items-center gap-2 min-w-0">
            <span className="font-mono text-[10px] break-all">{quote.requestId}</span>
            <CopyButton text={quote.requestId} label="Copy request id" />
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted-text)]">Expires</dt>
          <dd className="mt-0.5 font-mono text-[10px] text-[var(--muted-text)]">{new Date(quote.expiresAtIso).toLocaleString()}</dd>
        </div>
      </dl>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          className="btn-primary flex-1"
          onClick={onApprove}
          disabled={disabled || phase === "settling" || phase === "settled" || phase === "denied"}
        >
          <ShieldCheck className="h-4 w-4 mr-2" aria-hidden />
          Approve spend
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 border-[var(--border)]"
          onClick={onDeny}
          disabled={disabled || phase === "settling" || phase === "settled" || phase === "denied"}
        >
          <ShieldOff className="h-4 w-4 mr-2" aria-hidden />
          Deny
        </Button>
      </div>
    </Card>
  );
}
