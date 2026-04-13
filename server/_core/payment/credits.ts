import { PaymentLayerError } from "./errors";
import { getPaymentStore } from "./store";
import { pushPaymentEvent } from "./events";

export function getCreditBalance(wallet: string): number {
  return getPaymentStore().credits.get(wallet) ?? 0;
}

export function topUpCredits(wallet: string, amount: number): { balance: number } {
  const store = getPaymentStore();
  const next = (store.credits.get(wallet) ?? 0) + amount;
  store.credits.set(wallet, next);
  store.creditLedger.unshift({
    wallet,
    delta: amount,
    reason: "top_up",
    at: new Date().toISOString(),
  });
  pushPaymentEvent("credit_top_up", `+${amount} credits`, { payer: wallet, meta: { balance: next } });
  return { balance: next };
}

export function consumeCredits(wallet: string, amount: number, serviceId: string): { balance: number } {
  const store = getPaymentStore();
  const cur = store.credits.get(wallet) ?? 0;
  if (cur < amount) {
    throw new PaymentLayerError("insufficient_credits", "Not enough prepaid credits for this call.");
  }
  const next = cur - amount;
  store.credits.set(wallet, next);
  store.creditLedger.unshift({
    wallet,
    delta: -amount,
    reason: `consume:${serviceId}`,
    at: new Date().toISOString(),
  });
  pushPaymentEvent("credit_consumed", `${amount} for ${serviceId}`, { payer: wallet, meta: { balance: next } });
  return { balance: next };
}

export function restoreCredits(wallet: string, amount: number, reason: string): { balance: number } {
  const store = getPaymentStore();
  const next = (store.credits.get(wallet) ?? 0) + amount;
  store.credits.set(wallet, next);
  store.creditLedger.unshift({
    wallet,
    delta: amount,
    reason,
    at: new Date().toISOString(),
  });
  pushPaymentEvent("credit_restored", `+${amount} (${reason})`, { payer: wallet });
  return { balance: next };
}
