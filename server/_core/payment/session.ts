import { nanoid } from "nanoid";
import type { PaymentAsset, PaymentSession, StellarPaymentNetwork } from "@shared/paymentTypes";
import { PaymentLayerError } from "./errors";
import { getPaymentStore } from "./store";
import { pushPaymentEvent } from "./events";
import { defaultPaymentPolicy } from "./modes";

export function openPaymentSession(input: {
  funder: string;
  payee: string;
  network: StellarPaymentNetwork;
  depositAmount: number;
  asset: PaymentAsset;
}): PaymentSession {
  const store = getPaymentStore();
  const policy = defaultPaymentPolicy(input.payee);
  if (input.depositAmount < policy.sessionMinCap) {
    throw new PaymentLayerError(
      "session_cap_exceeded",
      `Session deposit must be at least ${policy.sessionMinCap} ${input.asset.code}.`
    );
  }
  const id = `sess_${nanoid(12)}`;
  const now = new Date().toISOString();
  const rec = {
    id,
    funder: input.funder,
    payee: input.payee,
    network: input.network,
    cap: input.depositAmount,
    cumulativeCommitted: 0,
    asset: input.asset,
    openedAt: now,
    updatedAt: now,
    status: "open" as const,
  };
  store.sessions.set(id, rec);
  pushPaymentEvent("session_opened", id, { sessionId: id, payer: input.funder });
  return {
    id,
    funder: input.funder,
    payee: input.payee,
    network: input.network,
    cumulativeCommitted: 0,
    cap: input.depositAmount,
    asset: input.asset,
    openedAt: now,
    updatedAt: now,
    status: "open",
  };
}

export function commitSessionUsage(sessionId: string, delta: number): PaymentSession {
  const store = getPaymentStore();
  const s = store.sessions.get(sessionId);
  if (!s || s.status !== "open") {
    throw new PaymentLayerError("session_not_found", "No open payment session for this id.");
  }
  const next = s.cumulativeCommitted + delta;
  if (next > s.cap) {
    throw new PaymentLayerError("session_cap_exceeded", "Session commitment would exceed the channel cap.");
  }
  s.cumulativeCommitted = next;
  s.updatedAt = new Date().toISOString();
  pushPaymentEvent("session_reconciled", `cum=${next}/${s.cap}`, {
    sessionId,
    payer: s.funder,
    meta: { delta },
  });
  return {
    id: s.id,
    funder: s.funder,
    payee: s.payee,
    network: s.network,
    cumulativeCommitted: s.cumulativeCommitted,
    cap: s.cap,
    asset: s.asset,
    openedAt: s.openedAt,
    updatedAt: s.updatedAt,
    status: "open",
    lastReconciliationAt: s.updatedAt,
  };
}

export function closePaymentSession(sessionId: string): PaymentSession {
  const store = getPaymentStore();
  const s = store.sessions.get(sessionId);
  if (!s) {
    throw new PaymentLayerError("session_not_found", "Session not found.");
  }
  s.status = "closed";
  s.updatedAt = new Date().toISOString();
  pushPaymentEvent("session_closed", sessionId, { sessionId, payer: s.funder });
  return {
    id: s.id,
    funder: s.funder,
    payee: s.payee,
    network: s.network,
    cumulativeCommitted: s.cumulativeCommitted,
    cap: s.cap,
    asset: s.asset,
    openedAt: s.openedAt,
    updatedAt: s.updatedAt,
    status: "closed",
    lastReconciliationAt: s.updatedAt,
  };
}
