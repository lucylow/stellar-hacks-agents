import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

const variants: Record<string, string> = {
  default: "border-border/60 bg-muted/40 text-muted-foreground",
  success: "border-[color-mix(in_oklab,var(--success)_35%,transparent)] bg-[color-mix(in_oklab,var(--success)_12%,transparent)] text-[var(--success-foreground)]",
  warning: "border-[color-mix(in_oklab,var(--warning)_35%,transparent)] bg-[color-mix(in_oklab,var(--warning)_12%,transparent)] text-[var(--warning-foreground)]",
  danger: "border-destructive/40 bg-destructive/15 text-destructive",
  accent: "border-primary/35 bg-primary/10 text-primary",
  info: "border-[color-mix(in_oklab,var(--info)_35%,transparent)] bg-[color-mix(in_oklab,var(--info)_12%,transparent)] text-[var(--info-foreground)]",
};

const toneToVariant: Record<string, keyof typeof variants> = {
  primary: "accent",
  secondary: "info",
  default: "default",
  success: "success",
  warning: "warning",
  danger: "danger",
  info: "info",
};

interface StatusBadgeProps {
  children: ReactNode;
  variant?: keyof typeof variants;
  /** @deprecated alias of variant — maps primary→accent, secondary→info, danger→danger */
  tone?: keyof typeof toneToVariant;
  className?: string;
}

export function StatusBadge({ children, variant, tone, className }: StatusBadgeProps) {
  const resolved =
    variant ?? (tone ? (toneToVariant[tone] ?? "default") : "default");
  return (
    <Badge
      variant="outline"
      className={cn("font-medium capitalize", variants[resolved] ?? variants.default, className)}
    >
      {children}
    </Badge>
  );
}
