import type { PaymentMode, PaymentReceipt, PaymentSettlement } from "@shared/paymentTypes";
import { nanoid } from "nanoid";

export function buildReceiptFromSettlement(
  settlement: PaymentSettlement,
  unlockedDescription: string,
  requestCompleted: boolean
): PaymentReceipt {
  return {
    id: nanoid(),
    settlementId: settlement.id,
    summary: `${settlement.mode}: ${settlement.amount} ${settlement.asset.code} for ${settlement.serviceId}`,
    unlockedDescription,
    transactionOrCommitmentRef: settlement.transactionOrCommitmentRef,
    mode: settlement.mode,
    requestCompleted,
    createdAt: settlement.settledAt,
  };
}

export function unlockedSummaryForService(serviceId: string, mode: PaymentMode): string {
  if (mode === "demo_free") return "No payment required — demo execution.";
  if (mode === "session_streaming")
    return `Session channel active — usage accounted against commitment for ${serviceId}.`;
  if (mode === "prepaid_credits") return `Prepaid credits debited for ${serviceId}.`;
  return `Per-request settlement recorded — tools unlocked for ${serviceId}.`;
}
