import { nanoid } from "nanoid";
import type { PaymentAuthorization, PaymentSettlement, PaymentMode } from "@shared/paymentTypes";
import { PaymentLayerError } from "./errors";
import { getPaymentStore } from "./store";
import { buildReceiptFromSettlement, unlockedSummaryForService } from "./receipts";
import { pushPaymentEvent } from "./events";
import { consumeCredits, restoreCredits as refundCreditBalance } from "./credits";
import { commitSessionUsage } from "./session";

export type ApproveParams = {
  challengeId: string;
  payer: string;
  /** Must match quote.replayKey on first settlement */
  replayKey: string;
  idempotencyKey: string;
  signedAuthEntryXdr?: string;
  simulateTxHash?: boolean;
};

export type ApproveResult = {
  settlement: PaymentSettlement;
  receiptSummary: string;
  transactionHash: string;
  amount: number;
  currency: string;
  mode: PaymentMode;
};

export function settleChallenge(params: ApproveParams): ApproveResult {
  const store = getPaymentStore();
  const row = store.challenges.get(params.challengeId);
  if (!row) {
    throw new PaymentLayerError("challenge_not_found", "Unknown or expired payment challenge.");
  }

  const now = Date.now();
  if (new Date(row.quote.expiresAt).getTime() < now) {
    row.status = "expired";
    row.quote.status = "expired";
    row.quote.updatedAt = new Date().toISOString();
    throw new PaymentLayerError("quote_expired", "Payment quote expired — request a new quote.");
  }

  if (row.status === "settled") {
    if (row.consumedIdempotencyKey === params.idempotencyKey && row.settlementId) {
      const prev = store.settlements.find((s) => s.id === row.settlementId);
      if (prev) {
        return {
          settlement: prev,
          receiptSummary: unlockedSummaryForService(prev.serviceId, prev.mode),
          transactionHash: prev.transactionOrCommitmentRef,
          amount: prev.amount,
          currency: prev.asset.code,
          mode: prev.mode,
        };
      }
    }
    throw new PaymentLayerError("replay_detected", "This challenge was already settled.");
  }

  if (row.quote.replayKey !== params.replayKey) {
    throw new PaymentLayerError("replay_detected", "Replay key does not match this challenge.");
  }

  if (!store.consumeReplayKey(params.replayKey)) {
    throw new PaymentLayerError("replay_detected", "Authorization already used.");
  }

  if (row.quote.idempotencyKey !== params.idempotencyKey) {
    store.releaseReplayKey(params.replayKey);
    throw new PaymentLayerError("idempotency_conflict", "Idempotency key does not match quote.");
  }

  if (row.quote.mode === "prepaid_credits") {
    try {
      consumeCredits(params.payer, row.quote.amount, row.quote.serviceId);
    } catch (e) {
      store.releaseReplayKey(params.replayKey);
      throw e;
    }
  } else if (row.quote.mode === "session_streaming" && row.quote.sessionId) {
    try {
      commitSessionUsage(row.quote.sessionId, row.quote.amount);
    } catch (e) {
      store.releaseReplayKey(params.replayKey);
      throw e;
    }
  }

  const settledAt = new Date().toISOString();
  const txRef =
    params.simulateTxHash !== false
      ? `tx_${Date.now()}_${nanoid(10)}`
      : params.signedAuthEntryXdr?.slice(0, 24) ?? `auth_${nanoid(12)}`;

  const settlement: PaymentSettlement = {
    id: nanoid(),
    requestId: row.quote.requestId,
    serviceId: row.quote.serviceId,
    payer: params.payer,
    payee: row.quote.payee,
    amount: row.quote.amount,
    asset: row.quote.asset,
    mode: row.quote.mode,
    status: "confirmed",
    settledAt,
    transactionOrCommitmentRef: txRef,
    receiptHash: store.receiptHash([txRef, params.challengeId, params.payer, String(row.quote.amount)]),
  };

  store.settlements.unshift(settlement);
  if (store.settlements.length > 500) store.settlements.length = 500;

  row.status = "settled";
  row.settlementId = settlement.id;
  row.quote.status = "settled";
  row.quote.updatedAt = settledAt;
  row.usedReplayKey = true;

  const receipt = buildReceiptFromSettlement(
    settlement,
    unlockedSummaryForService(row.quote.serviceId, row.quote.mode),
    true
  );

  pushPaymentEvent("payment_authorized", params.challengeId, {
    mode: row.quote.mode,
    challengeId: params.challengeId,
    payer: params.payer,
  });
  if (params.signedAuthEntryXdr) {
    pushPaymentEvent("auth_entry_verified", "Signed auth entry supplied", {
      challengeId: params.challengeId,
      payer: params.payer,
    });
  }
  pushPaymentEvent("settlement_confirmed", settlement.id, {
    mode: settlement.mode,
    challengeId: params.challengeId,
    payer: params.payer,
    meta: { txRef },
  });
  pushPaymentEvent("receipt_issued", receipt.id, {
    mode: settlement.mode,
    challengeId: params.challengeId,
    payer: params.payer,
  });

  store.addHistory({
    id: receipt.id,
    type: "settlement",
    description: row.quote.serviceDescription,
    amount: settlement.amount,
    currency: settlement.asset.code,
    status: settlement.status,
    transactionHash: txRef,
    timestamp: new Date(settledAt),
    mode: settlement.mode,
  });

  return {
    settlement,
    receiptSummary: receipt.summary,
    transactionHash: txRef,
    amount: settlement.amount,
    currency: settlement.asset.code,
    mode: settlement.mode,
  };
}

export function markExecutionFailedRollback(
  challengeId: string | undefined,
  creditRefund?: { wallet: string; amount: number }
) {
  const store = getPaymentStore();
  if (!challengeId) {
    if (creditRefund) {
      refundCreditBalance(creditRefund.wallet, creditRefund.amount, "execution_failed_rollback");
    }
    return;
  }
  const row = store.challenges.get(challengeId);
  if (row && row.status === "settled") {
    row.quote.status = "failed";
    row.status = "failed";
    const s = store.settlements.find((x) => x.id === row.settlementId);
    if (s) s.status = "rolled_back";
  }
  if (creditRefund) {
    refundCreditBalance(creditRefund.wallet, creditRefund.amount, "execution_failed_rollback");
  }
  pushPaymentEvent("refund_issued", `Rollback for challenge ${challengeId}`, { challengeId });
}

/** Record authorization without full settlement (extension point) */
export function recordAuthorization(auth: PaymentAuthorization): void {
  pushPaymentEvent("payment_authorized", `Recorded auth ${auth.challengeId}`, {
    payer: auth.payer,
    challengeId: auth.challengeId,
  });
}
