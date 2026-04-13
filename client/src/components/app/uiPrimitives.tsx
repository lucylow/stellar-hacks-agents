import type { ReactNode } from "react";
import { Loader2, AlertCircle, Inbox, ShieldAlert, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type ToolCategoryChip =
  | "search"
  | "blockchain"
  | "wallet"
  | "account"
  | "network"
  | "demo";

const CATEGORY_STYLES: Record<ToolCategoryChip, string> = {
  search: "border-cyan-500/40 text-cyan-200/95",
  blockchain: "border-purple-500/45 text-purple-200/95",
  wallet: "border-emerald-500/40 text-emerald-200/90",
  account: "border-violet-500/40 text-violet-200/90",
  network: "border-sky-500/40 text-sky-200/90",
  demo: "border-amber-500/45 text-amber-200/95",
};

export function CategoryChip({ category, label }: { category: ToolCategoryChip; label?: string }) {
  const text =
    label ??
    (category === "search"
      ? "Search"
      : category === "blockchain"
        ? "Blockchain"
        : category === "wallet"
          ? "Wallet"
          : category === "account"
            ? "Account"
            : category === "network"
              ? "Network"
              : "Demo");
  return (
    <Badge variant="outline" className={cn("text-[9px] uppercase tracking-wide", CATEGORY_STYLES[category])}>
      {text}
    </Badge>
  );
}

export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: "neutral" | "ok" | "warn" | "error" | "accent";
  children: ReactNode;
  className?: string;
}) {
  const toneCls =
    tone === "ok"
      ? "border-emerald-500/45 text-emerald-300"
      : tone === "warn"
        ? "border-amber-500/45 text-amber-200"
        : tone === "error"
          ? "border-red-500/45 text-red-200"
          : tone === "accent"
            ? "border-purple-500/45 text-purple-200"
            : "border-slate-600 text-slate-300";
  return (
    <Badge variant="outline" className={cn("text-[10px]", toneCls, className)}>
      {children}
    </Badge>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-[var(--border)] bg-[var(--surface)]/80 px-3 py-2 min-w-0",
        className
      )}
    >
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <div className="text-sm font-medium text-slate-100 tabular-nums truncate">{value}</div>
      {hint ? <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{hint}</p> : null}
    </div>
  );
}

export function SectionCard({
  title,
  icon,
  children,
  className,
  headerClassName,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
}) {
  return (
    <div className={cn("rounded-[var(--radius-md)] border border-[var(--border)] bg-slate-950/90 p-4 space-y-3", className)}>
      <h3
        className={cn(
          "text-sm font-semibold text-cyan-100/95 flex items-center gap-2",
          headerClassName
        )}
      >
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

export function TraceTimeline({
  items,
  className,
}: {
  items: { id: string; label: string; detail?: string; state: "done" | "current" | "todo" }[];
  className?: string;
}) {
  return (
    <ol className={cn("space-y-2", className)} aria-label="Chain trace">
      {items.map((it) => (
        <li
          key={it.id}
          className={cn(
            "flex gap-2 text-xs rounded-md border px-2 py-1.5",
            it.state === "current"
              ? "border-purple-500/40 bg-purple-950/30 text-purple-50"
              : it.state === "done"
                ? "border-emerald-500/25 text-emerald-100/90"
                : "border-slate-800/90 text-slate-500"
          )}
        >
          <Link2
            className={cn(
              "w-3.5 h-3.5 shrink-0 mt-0.5",
              it.state === "done" ? "text-emerald-400" : it.state === "current" ? "text-purple-400" : "text-slate-600"
            )}
            aria-hidden
          />
          <div className="min-w-0">
            <span className="font-medium">{it.label}</span>
            {it.detail ? <p className="text-[10px] text-slate-500 mt-0.5">{it.detail}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}


/** Shared section chrome — spacing matches Home shell rhythm */
export function AppSection({
  id,
  title,
  description,
  children,
  className,
}: {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("app-section space-y-3", className)}>
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-[var(--text)] tracking-tight">{title}</h2>
        {description ? <p className="text-sm text-[var(--muted-text)] leading-relaxed max-w-3xl">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

export function DemoLiveBadge({
  mode,
}: {
  mode: "demo" | "live" | "mock_search" | "live_stellar";
}) {
  const label =
    mode === "live"
      ? "Live data"
      : mode === "mock_search"
        ? "Mock search"
        : mode === "live_stellar"
          ? "Live Stellar data"
          : "Demo mode";
  const isLive = mode === "live" || mode === "live_stellar";
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] uppercase tracking-wide",
        isLive ? "border-emerald-500/35 text-emerald-300" : "border-amber-500/40 text-amber-200"
      )}
    >
      {label}
    </Badge>
  );
}

export function InlineLoading({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center gap-2 text-sm text-[var(--muted-text)]", className)}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--accent-primary)]" aria-hidden />
      {label}
    </div>
  );
}

/** Alias for shared naming across blockchain panels */
export const LoadingState = InlineLoading;

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div
      className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)]/80 p-6 text-center space-y-2"
      role="status"
    >
      <Inbox className="h-10 w-10 mx-auto text-[var(--muted-text)] opacity-70" aria-hidden />
      <p className="text-sm font-medium text-[var(--text)]">{title}</p>
      <p className="text-xs text-[var(--muted-text)] leading-relaxed max-w-md mx-auto">{body}</p>
      {action ? <div className="pt-2 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  body,
  onRetry,
  retryLabel = "Try again",
}: {
  title: string;
  body: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div
      className="rounded-[var(--radius-card)] border border-red-500/30 bg-red-950/20 p-4 space-y-2"
      role="alert"
    >
      <div className="flex gap-2">
        <ShieldAlert className="h-4 w-4 shrink-0 text-[var(--error)] mt-0.5" aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-[var(--text)]">{title}</p>
          <p className="text-xs text-[var(--muted-text)] leading-relaxed">{body}</p>
        </div>
      </div>
      {onRetry ? (
        <Button type="button" size="sm" variant="outline" className="mt-1" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function BlockedState({ title, body }: { title: string; body: string }) {
  return (
    <div
      className="rounded-[var(--radius-card)] border border-amber-500/30 bg-amber-950/15 p-4 flex gap-2"
      role="status"
    >
      <AlertCircle className="h-4 w-4 shrink-0 text-[var(--warning)] mt-0.5" aria-hidden />
      <div>
        <p className="text-sm font-medium text-[var(--text)]">{title}</p>
        <p className="text-xs text-[var(--muted-text)] leading-relaxed mt-0.5">{body}</p>
      </div>
    </div>
  );
}

export function AppCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "app-card rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-elevated)]/95 p-4 shadow-[var(--shadow-card)]",
        className
      )}
    >
      {children}
    </div>
  );
}
