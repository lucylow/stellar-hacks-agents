import { nanoid } from "nanoid";
import type { PaymentEvent, PaymentEventType, PaymentMode } from "@shared/paymentTypes";

const MAX = 300;
const buffer: PaymentEvent[] = [];

export function pushPaymentEvent(
  type: PaymentEventType,
  detail: string,
  opts?: {
    mode?: PaymentMode;
    challengeId?: string;
    sessionId?: string;
    payer?: string;
    meta?: Record<string, unknown>;
  }
): PaymentEvent {
  const ev: PaymentEvent = {
    id: nanoid(),
    type,
    at: new Date().toISOString(),
    detail,
    ...opts,
  };
  buffer.unshift(ev);
  if (buffer.length > MAX) buffer.length = MAX;

  const line = `[payment:${type}] ${detail}`;
  if (type === "settlement_confirmed" || type === "refund_issued" || type === "session_closed") {
    console.info(line, opts?.meta ?? {});
  } else {
    console.debug(line, opts?.meta ?? {});
  }
  return ev;
}

export function listPaymentEvents(limit = 50): PaymentEvent[] {
  return buffer.slice(0, limit);
}
