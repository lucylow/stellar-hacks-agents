import { Badge } from "@/components/ui/badge";
import type { ReputationTier, ReputationTrend } from "@shared/reputationModel";
import { ArrowDownRight, ArrowUpRight, Loader2, Minus, Shield } from "lucide-react";

const TIER_STYLES: Record<ReputationTier, string> = {
  new: "border-slate-500/45 text-slate-300",
  stable: "border-cyan-500/40 text-cyan-200",
  trusted: "border-emerald-500/40 text-emerald-200",
  verified: "border-purple-500/45 text-purple-200",
  at_risk: "border-amber-500/50 text-amber-200",
};

const TIER_LABEL: Record<ReputationTier, string> = {
  new: "New",
  stable: "Stable",
  trusted: "Trusted",
  verified: "Verified",
  at_risk: "At risk",
};

export function TierBadge({ tier, className }: { tier: ReputationTier; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={`text-[9px] uppercase tracking-wide ${TIER_STYLES[tier]} ${className ?? ""}`}
    >
      <Shield className="w-3 h-3 mr-0.5 inline opacity-80" aria-hidden />
      {TIER_LABEL[tier]}
    </Badge>
  );
}

export function TrendGlyph({ trend, className }: { trend: ReputationTrend; className?: string }) {
  const label =
    trend === "improving" ? "Trend: improving" : trend === "declining" ? "Trend: declining" : "Trend: steady";
  if (trend === "improving") {
    return (
      <span className={`inline-flex items-center gap-0.5 text-emerald-400 ${className ?? ""}`} title={label}>
        <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
        <span className="sr-only">{label}</span>
      </span>
    );
  }
  if (trend === "declining") {
    return (
      <span className={`inline-flex items-center gap-0.5 text-amber-400 ${className ?? ""}`} title={label}>
        <ArrowDownRight className="w-3.5 h-3.5" aria-hidden />
        <span className="sr-only">{label}</span>
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-0.5 text-slate-500 ${className ?? ""}`} title={label}>
      <Minus className="w-3.5 h-3.5" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function ReputationLoadingInline() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500" role="status" aria-live="polite">
      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-500/80" aria-hidden />
      Loading trust summary…
    </span>
  );
}

/** Compact sparkline from 0–100 points (last N scores approximated from event weights). */
export function TrustSparkline({ values, className }: { values: number[]; className?: string }) {
  if (!values.length) {
    return (
      <p className={`text-[10px] text-slate-500 ${className ?? ""}`}>
        No trend points yet — complete tasks to build history.
      </p>
    );
  }
  const max = 100;
  const min = 0;
  const w = 120;
  const h = 28;
  const pts = values
    .slice(-12)
    .map((v, i, arr) => {
      const x = (i / Math.max(1, arr.length - 1)) * w;
      const y = h - ((clamp(v, min, max) - min) / (max - min)) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="rgba(34,211,238,0.55)"
        strokeWidth="1.5"
        points={pts}
      />
    </svg>
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}
