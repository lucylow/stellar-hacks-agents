import type { StellarAccountSummary } from "./stellarAccountFormat";
import type { StellarNetworkMode } from "./stellarHorizon";
import type { StellarOperationRecord, StellarTxRecord } from "./appConnectionModel";

/** Short, user-facing lines derived from live Horizon-shaped data */
export function interpretStellarAccountPanel(opts: {
  account: StellarAccountSummary | null;
  network: StellarNetworkMode;
  transactions: StellarTxRecord[];
  operations: StellarOperationRecord[];
  txsError: string | null;
  opsError: string | null;
}): string[] {
  const lines: string[] = [];
  const net = opts.network === "mainnet" ? "mainnet" : "testnet";
  lines.push(`Network context: ${net} — balances and sequence are read from Horizon for this mode.`);

  if (!opts.account) {
    lines.push("No account payload yet — fund the address on this network or refresh after switching.");
    return lines;
  }

  const bal = Number.parseFloat(opts.account.balance);
  if (Number.isFinite(bal) && bal > 0) {
    lines.push("The account holds a positive XLM balance and can pay base fees.");
  } else if (Number.isFinite(bal) && bal === 0) {
    lines.push("Native balance is zero — fund with XLM before submitting transactions.");
  }

  lines.push(
    "Sequence numbers increase with each successful transaction; they prevent replay and show how active signing has been."
  );
  lines.push(
    "Subentries count trustlines, offers, and similar entries — higher counts mean more reserve requirements."
  );

  if (opts.txsError) {
    lines.push("Transaction history could not load; other account fields may still be valid.");
  } else if (opts.transactions.length === 0) {
    lines.push("No recent transactions in this Horizon window — the account may be new or quiet.");
  } else {
    const ok = opts.transactions.filter((t) => t.successful).length;
    lines.push(
      `Recent activity: ${opts.transactions.length} transaction(s) in view, ${ok} marked successful.`
    );
  }

  if (opts.opsError) {
    lines.push("Operations could not load separately — use transactions or an explorer for detail.");
  } else if (opts.operations.length === 0) {
    lines.push("No recent operations returned — try again after a refresh.");
  } else {
    lines.push(
      "Operations break down each ledger effect (payments, path payments, etc.) inside a transaction."
    );
  }

  return lines.slice(0, 8);
}
