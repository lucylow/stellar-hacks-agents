import { Client } from "@stellar/stellar-sdk/contract";
import { STELLAR_NETWORK_PASSPHRASE, type StellarNetworkMode } from "@shared/stellarHorizon";
import { getSorobanRpcUrl } from "@shared/stellarSoroban";
import { getAgentMarketContractId, getSorobanRpcUrlOverride } from "../_core/agentMarketEnv";

export type AgentMarketContractClient = Client;

export async function loadAgentMarketClient(
  network: StellarNetworkMode
): Promise<Client | null> {
  const contractId = getAgentMarketContractId();
  if (!contractId) return null;
  const rpcUrl = getSorobanRpcUrl(network, getSorobanRpcUrlOverride());
  return Client.from({
    contractId,
    rpcUrl,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE[network],
    allowHttp: network === "testnet",
  });
}

function asBigIntString(v: unknown): string {
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "number") return String(Math.trunc(v));
  if (typeof v === "string") return v;
  return String(v ?? "");
}

function asStr(v: unknown): string {
  return typeof v === "string" ? v : String(v ?? "");
}

function asNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "string") return Number(v);
  return 0;
}

function escrowStateFromNative(v: unknown): import("@shared/agentMarketContract").AgentMarketEscrowState {
  if (typeof v === "string") {
    const allowed: import("@shared/agentMarketContract").AgentMarketEscrowState[] = [
      "Open",
      "Locked",
      "PendingVerify",
      "Verified",
      "Released",
      "Refunded",
    ];
    if ((allowed as string[]).includes(v)) return v as import("@shared/agentMarketContract").AgentMarketEscrowState;
  }
  if (v && typeof v === "object" && "tag" in (v as object)) {
    const tag = (v as { tag?: string }).tag;
    if (tag) return escrowStateFromNative(tag);
  }
  return "Open";
}

export function normalizeServiceRecord(raw: unknown): import("@shared/agentMarketContract").AgentMarketServiceRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    service_id: asNum(o.service_id),
    owner: asStr(o.owner),
    name: asStr(o.name),
    endpoint: asStr(o.endpoint),
    description: asStr(o.description),
    price: asBigIntString(o.price),
    asset: asStr(o.asset),
    access_mode: asNum(o.access_mode),
    status: asNum(o.status),
    price_version: asNum(o.price_version),
    created_at: asBigIntString(o.created_at),
    updated_at: asBigIntString(o.updated_at),
  };
}

export function normalizeReputationRecord(
  raw: unknown
): import("@shared/agentMarketContract").AgentMarketReputationRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    completed_count: asBigIntString(o.completed_count),
    successful_settlements: asBigIntString(o.successful_settlements),
    refund_count: asBigIntString(o.refund_count),
    failure_count: asBigIntString(o.failure_count),
    reputation_score: asBigIntString(o.reputation_score),
  };
}

export function normalizeEscrowRecord(raw: unknown): import("@shared/agentMarketContract").AgentMarketEscrowRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    id: asBigIntString(o.id),
    payer: asStr(o.payer),
    payee: asStr(o.payee),
    service_id: asNum(o.service_id),
    amount: asBigIntString(o.amount),
    asset: asStr(o.asset),
    state: escrowStateFromNative(o.state),
    request_id: asBigIntString(o.request_id),
    created_at: asBigIntString(o.created_at),
    updated_at: asBigIntString(o.updated_at),
    tx_hash: bytesLikeToHex(o.tx_hash),
  };
}

export function normalizeSettlementRecord(
  raw: unknown
): import("@shared/agentMarketContract").AgentMarketSettlementRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    request_id: asBigIntString(o.request_id),
    service_id: asNum(o.service_id),
    payer: asStr(o.payer),
    payee: asStr(o.payee),
    amount: asBigIntString(o.amount),
    asset: asStr(o.asset),
    status: asNum(o.status),
    ts: asBigIntString(o.ts),
    tx_ref: bytesLikeToHex(o.tx_ref),
  };
}

export function normalizeActionReceipt(raw: unknown): import("@shared/agentMarketContract").AgentMarketActionReceipt | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    service_id: asNum(o.service_id),
    amount: asBigIntString(o.amount),
    asset: asStr(o.asset),
    payer: asStr(o.payer),
    owner: asStr(o.owner),
    settlement_status: asNum(o.settlement_status),
    chain_ref: bytesLikeToHex(o.chain_ref),
  };
}

function bytesLikeToHex(v: unknown): string {
  if (typeof v === "string") return v;
  if (v instanceof Uint8Array) return Buffer.from(v).toString("hex");
  return "";
}
