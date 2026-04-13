import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
};

export function EmptyState({ icon: Icon, title, description, className, children }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--border)] bg-[var(--surface)]/60 px-4 py-10 text-center",
        className
      )}
      role="status"
    >
      {Icon ? (
        <Icon className="h-10 w-10 text-[var(--accent-secondary)] opacity-80" aria-hidden />
      ) : null}
      <div className="space-y-1">
        <p className="text-sm font-medium text-[var(--text)]">{title}</p>
        {description ? (
          <p className="text-xs leading-relaxed text-[var(--muted-text)] max-w-sm mx-auto">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
