import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "info" | "success" | "warning" | "destructive";

const icons: Record<Tone, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: AlertCircle,
};

const toneClass: Record<Tone, string> = {
  info: "border-[color-mix(in_oklab,var(--info)_40%,transparent)] bg-[color-mix(in_oklab,var(--info)_8%,transparent)] text-foreground [&>svg]:text-[var(--info)]",
  success:
    "border-[color-mix(in_oklab,var(--success)_40%,transparent)] bg-[color-mix(in_oklab,var(--success)_8%,transparent)] text-foreground [&>svg]:text-[var(--success)]",
  warning:
    "border-[color-mix(in_oklab,var(--warning)_40%,transparent)] bg-[color-mix(in_oklab,var(--warning)_10%,transparent)] text-foreground [&>svg]:text-[var(--warning)]",
  destructive: "border-destructive/50 bg-destructive/10 text-foreground [&>svg]:text-destructive",
};

interface InlineAlertProps {
  title?: string;
  children: ReactNode;
  tone?: Tone;
  /** @deprecated use tone — error→destructive, info/warning unchanged */
  variant?: "info" | "warning" | "error" | "success";
  className?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

function variantToTone(variant: NonNullable<InlineAlertProps["variant"]>): Tone {
  if (variant === "error") return "destructive";
  if (variant === "success") return "success";
  if (variant === "warning") return "warning";
  return "info";
}

export function InlineAlert({
  title,
  children,
  tone: toneProp,
  variant,
  className,
  onRetry,
  retryLabel = "Retry",
}: InlineAlertProps) {
  const tone = toneProp ?? (variant ? variantToTone(variant) : "info");
  const Icon = icons[tone];
  return (
    <Alert className={cn(toneClass[tone], className)} role="status">
      <Icon className="size-4" aria-hidden />
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="leading-relaxed">{children}</span>
        {onRetry ? (
          <Button type="button" size="sm" variant="secondary" onClick={onRetry} className="shrink-0">
            {retryLabel}
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
