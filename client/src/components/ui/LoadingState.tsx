import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  label?: string;
  className?: string;
  variant?: "spinner" | "skeleton";
  lines?: number;
  size?: "sm" | "md";
}

export function LoadingSkeletonBlock({ lines = 3, className }: { lines?: number; className?: string }) {
  return <LoadingState variant="skeleton" lines={lines} className={className} label="Loading" />;
}

export function LoadingState({
  label = "Loading…",
  className,
  variant = "spinner",
  lines = 3,
  size = "md",
}: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <div
        className={cn("flex flex-col gap-2", className)}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="sr-only">{label}</span>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cn("h-4 w-full", i === lines - 1 && "w-3/4")} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 text-muted-foreground",
        size === "sm" ? "text-xs" : "text-sm",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className={cn("shrink-0 animate-spin text-primary", size === "sm" ? "size-3.5" : "size-4")} aria-hidden />
      <span>{label}</span>
    </div>
  );
}
