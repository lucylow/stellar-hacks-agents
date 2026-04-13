import { cn } from "@/lib/utils";

export type StatusPillTone = "neutral" | "info" | "success" | "warning" | "danger" | "demo" | "pending";

const toneClass: Record<StatusPillTone, string> = {
  neutral: "border-[var(--border)] bg-[var(--surface-elevated)]/80 text-[var(--muted-text)]",
  info: "border-sky-500/35 bg-sky-500/10 text-sky-100",
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-100",
  danger: "border-red-500/40 bg-red-500/10 text-red-100",
  demo: "border-violet-500/35 bg-violet-500/10 text-violet-100",
  pending: "border-cyan-500/35 bg-cyan-500/10 text-cyan-100",
};

type StatusPillProps = {
  children: React.ReactNode;
  tone?: StatusPillTone;
  className?: string;
  /** Short status for screen readers when children are abbreviated */
  srLabel?: string;
};

export function StatusPill({ children, tone = "neutral", className, srLabel }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        toneClass[tone],
        className
      )}
      role="status"
    >
      {srLabel ? <span className="sr-only">{srLabel}</span> : null}
      {children}
    </span>
  );
}
