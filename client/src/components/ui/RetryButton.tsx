import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RetryButtonProps = {
  onRetry: () => void;
  loading?: boolean;
  label?: string;
  className?: string;
};

export function RetryButton({
  onRetry,
  loading,
  label = "Retry",
  className,
}: RetryButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={onRetry}
      className={cn("border-[var(--border)] text-[var(--text)]", className)}
    >
      <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", loading && "animate-spin")} aria-hidden />
      {label}
    </Button>
  );
}
