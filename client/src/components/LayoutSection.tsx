import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface LayoutSectionProps {
  id?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  /** Use plain div instead of section when nested inside another landmark */
  asDiv?: boolean;
}

export function LayoutSection({
  id,
  title,
  description,
  children,
  className,
  contentClassName,
  asDiv,
}: LayoutSectionProps) {
  const headingId = id && title ? `${id}-heading` : undefined;
  const Wrapper: "section" | "div" = asDiv ? "div" : "section";

  return (
    <Wrapper
      id={id}
      aria-labelledby={headingId}
      className={cn(
        "rounded-xl border border-border/70 bg-card/50 shadow-[var(--shadow-elevated)] backdrop-blur-sm transition-[box-shadow,border-color] duration-200",
        className
      )}
    >
      {(title || description) && (
        <header className="border-b border-border/50 px-4 py-3 sm:px-6 sm:py-4">
          {title ? (
            <h2 id={headingId} className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </header>
      )}
      <div className={cn("p-4 sm:p-6", contentClassName)}>{children}</div>
    </Wrapper>
  );
}
