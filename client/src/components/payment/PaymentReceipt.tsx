import { Badge } from "@/components/ui/badge";

type Props = {
  transactionHash: string;
  amount: number;
  currency: string;
  summary: string;
  modeLabel?: string;
};

export function PaymentReceiptLine({ transactionHash, amount, currency, summary, modeLabel }: Props) {
  return (
    <div className="rounded-md border border-emerald-500/25 bg-emerald-950/15 px-2 py-1.5 text-[11px] space-y-1">
      <div className="flex flex-wrap gap-1 items-center">
        <span className="text-emerald-200/95 font-medium">Receipt</span>
        {modeLabel && (
          <Badge variant="outline" className="text-[8px] border-emerald-500/35 text-emerald-200/90">
            {modeLabel}
          </Badge>
        )}
        <span className="text-slate-500">
          {amount} {currency}
        </span>
      </div>
      <p className="text-slate-400 leading-snug">{summary}</p>
      <p className="font-mono text-[10px] text-emerald-300/80 break-all">{transactionHash}</p>
    </div>
  );
}
