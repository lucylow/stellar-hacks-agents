import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Props = {
  /** When false, children are replaced with a blocking explanation */
  allowed: boolean;
  blockTitle?: string;
  blockMessage?: string;
  children: ReactNode;
};

/**
 * Makes “payment required / pending / blocked” explicit before rendering paid UI.
 */
export function PaymentGate({ allowed, blockTitle = "Payment blocked", blockMessage, children }: Props) {
  if (allowed) return <>{children}</>;
  return (
    <Alert className="border-amber-500/35 bg-amber-950/20">
      <AlertTitle className="text-amber-200 text-sm">{blockTitle}</AlertTitle>
      {blockMessage ? <AlertDescription className="text-xs text-amber-100/85">{blockMessage}</AlertDescription> : null}
    </Alert>
  );
}
