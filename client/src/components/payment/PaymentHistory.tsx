import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

export function PaymentHistory() {
  const q = trpc.payments.getHistory.useQuery(undefined, { retry: 0 });

  if (q.isLoading) return <Skeleton className="h-24 w-full bg-slate-800" />;
  if (q.error) return <p className="text-xs text-slate-500">Could not load payment history.</p>;
  const rows = q.data ?? [];
  if (!rows.length) return <p className="text-xs text-slate-500">No settlements recorded yet.</p>;

  return (
    <ScrollArea className="h-40 rounded-md border border-amber-500/15">
      <ul className="space-y-2 p-2 pr-4">
        {rows.map((row) => (
          <li key={String(row.id)} className="text-xs border border-slate-800 rounded-md p-2 bg-slate-900/50 space-y-1">
            <div className="flex justify-between gap-2 text-slate-200">
              <span>{row.description}</span>
              <span className="font-mono text-amber-200/90 shrink-0">
                {row.amount} {row.currency}
              </span>
            </div>
            <p className="text-slate-500">
              {row.status}
              {" · "}
              {row.timestamp instanceof Date ? row.timestamp.toLocaleString() : String(row.timestamp)}
            </p>
            {"mode" in row && row.mode ? (
              <p className="text-[10px] text-cyan-500/80">Mode: {String(row.mode)}</p>
            ) : null}
            <p className="text-[10px] font-mono text-slate-600 break-all">{row.transactionHash}</p>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}
