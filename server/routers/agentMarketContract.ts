import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { AssembledTransaction } from "@stellar/stellar-sdk/contract";
import { publicProcedure, router } from "../_core/trpc";
import { getAgentMarketContractId, getSorobanRpcUrlOverride } from "../_core/agentMarketEnv";
import {
  loadAgentMarketClient,
  normalizeActionReceipt,
  normalizeEscrowRecord,
  normalizeReputationRecord,
  normalizeServiceRecord,
  normalizeSettlementRecord,
} from "../soroban/agentMarketClient";
import { agentMarketErrorNameFromCode } from "@shared/agentMarketContract";
import { getSorobanRpcUrl } from "@shared/stellarSoroban";
import { STELLAR_NETWORK_PASSPHRASE } from "@shared/stellarHorizon";

const networkIn = z.enum(["mainnet", "testnet"]).default("testnet");

type AgentMarketClient = NonNullable<Awaited<ReturnType<typeof loadAgentMarketClient>>>;

async function resolveAgentMarketClient(
  network: z.infer<typeof networkIn>
): Promise<{ kind: "unconfigured" } | { kind: "ready"; client: AgentMarketClient }> {
  if (!getAgentMarketContractId()) {
    return { kind: "unconfigured" };
  }
  const client = await loadAgentMarketClient(network);
  if (!client) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "The agent market contract is configured but the Soroban client could not be created. Check the contract ID and Soroban RPC URL.",
    });
  }
  return { kind: "ready", client };
}

function parseContractUintString(field: string, raw: string): bigint {
  const s = raw.trim();
  if (!/^\d+$/.test(s)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${field} must be a non-negative integer`,
    });
  }
  try {
    return BigInt(s);
  } catch {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${field} is not a valid integer`,
    });
  }
}

function mapSimulationFailure(err: unknown): never {
  if (err instanceof AssembledTransaction.Errors.SimulationFailed) {
    const msg = err.message || String(err);
    const m = /ContractError:\s*\(?(\d+)\)?/i.exec(msg) ?? /Error\((\d+)\)/.exec(msg);
    const code = m ? Number(m[1]) : null;
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: code != null && !Number.isNaN(code)
        ? `agent_market:${agentMarketErrorNameFromCode(code)}(${code})`
        : `agent_market_simulation:${msg}`,
      cause: err,
    });
  }
  throw err;
}

type DynClient = Record<string, (args?: Record<string, unknown>) => Promise<unknown>>;

function unwrapSorobanResultTree<T>(raw: unknown): T | undefined {
  let v: unknown = raw;
  for (let d = 0; d < 6; d++) {
    if (v === null || v === undefined) return undefined;
    if (Array.isArray(v)) return v as T;
    if (typeof v !== "object") return v as T;
    const o = v as Record<string, unknown>;
    if (o.tag === "Err") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `agent_market:${String(o.values ?? "contract_err")}`,
      });
    }
    if (o.tag === "Ok" || o.tag === "Some") {
      v = o.values;
      continue;
    }
    if (o.tag === "None") return undefined;
    return v as T;
  }
  return undefined;
}

async function readResult<T>(p: Promise<unknown>): Promise<T | undefined> {
  try {
    const tx = (await p) as AssembledTransaction<T>;
    await tx.simulate();
    return unwrapSorobanResultTree<T>(tx.result);
  } catch (e) {
    if (e instanceof TRPCError) throw e;
    mapSimulationFailure(e);
  }
}

export const agentMarketContractRouter = router({
  config: publicProcedure
    .input(z.object({ network: networkIn }).optional())
    .query(({ input }) => {
      const network = input?.network ?? "testnet";
      const contractId = getAgentMarketContractId();
      const configured = Boolean(contractId);
      return {
        configured,
        contractId: contractId ?? null,
        rpcUrl: getSorobanRpcUrl(network, getSorobanRpcUrlOverride()),
        network,
        networkPassphrase: STELLAR_NETWORK_PASSPHRASE[network],
      } as const;
    }),

  getService: publicProcedure
    .input(z.object({ network: networkIn, serviceId: z.number().int().nonnegative() }))
    .query(async ({ input }) => {
      const gate = await resolveAgentMarketClient(input.network);
      if (gate.kind === "unconfigured") return { configured: false as const, service: null };
      const client = gate.client;
      const c = client as unknown as DynClient;
      const raw = await readResult<unknown>(
        c.get_service({ service_id: input.serviceId })
      );
      return {
        configured: true as const,
        service: normalizeServiceRecord(raw ?? null),
      };
    }),

  listServices: publicProcedure
    .input(
      z.object({
        network: networkIn,
        startAfter: z.number().int().nonnegative().default(0),
        limit: z.number().int().min(1).max(32).default(16),
      })
    )
    .query(async ({ input }) => {
      const gate = await resolveAgentMarketClient(input.network);
      if (gate.kind === "unconfigured") return { configured: false as const, services: [] as const };
      const client = gate.client;
      const c = client as unknown as DynClient;
      const raw = await readResult<unknown[]>(
        c.list_services({ start_after: input.startAfter, limit: input.limit })
      );
      const services = (raw ?? [])
        .map(s => normalizeServiceRecord(s))
        .filter((s): s is NonNullable<typeof s> => s != null);
      return { configured: true as const, services };
    }),

  listServicesFilter: publicProcedure
    .input(
      z.object({
        network: networkIn,
        statusFilter: z.number().int().nonnegative(),
        accessFilter: z.number().int().nonnegative(),
        startAfter: z.number().int().nonnegative().default(0),
        limit: z.number().int().min(1).max(32).default(16),
      })
    )
    .query(async ({ input }) => {
      const gate = await resolveAgentMarketClient(input.network);
      if (gate.kind === "unconfigured") return { configured: false as const, services: [] as const };
      const client = gate.client;
      const c = client as unknown as DynClient;
      const raw = await readResult<unknown[]>(
        c.list_services_filter({
          status_filter: input.statusFilter,
          access_filter: input.accessFilter,
          start_after: input.startAfter,
          limit: input.limit,
        })
      );
      const services = (raw ?? [])
        .map(s => normalizeServiceRecord(s))
        .filter((s): s is NonNullable<typeof s> => s != null);
      return { configured: true as const, services };
    }),

  getEscrow: publicProcedure
    .input(z.object({ network: networkIn, escrowId: z.string() }))
    .query(async ({ input }) => {
      const gate = await resolveAgentMarketClient(input.network);
      if (gate.kind === "unconfigured") return { configured: false as const, escrow: null };
      const client = gate.client;
      const c = client as unknown as DynClient;
      const id = parseContractUintString("escrowId", input.escrowId);
      const raw = await readResult<unknown>(c.get_escrow({ escrow_id: id }));
      return {
        configured: true as const,
        escrow: raw == null ? null : normalizeEscrowRecord(raw),
      };
    }),

  getSettlement: publicProcedure
    .input(z.object({ network: networkIn, requestId: z.string() }))
    .query(async ({ input }) => {
      const gate = await resolveAgentMarketClient(input.network);
      if (gate.kind === "unconfigured") return { configured: false as const, settlement: null };
      const client = gate.client;
      const c = client as unknown as DynClient;
      const rid = parseContractUintString("requestId", input.requestId);
      const raw = await readResult<unknown>(c.get_settlement({ request_id: rid }));
      return {
        configured: true as const,
        settlement: raw == null ? null : normalizeSettlementRecord(raw),
      };
    }),

  getActionReceipt: publicProcedure
    .input(z.object({ network: networkIn, requestId: z.string() }))
    .query(async ({ input }) => {
      const gate = await resolveAgentMarketClient(input.network);
      if (gate.kind === "unconfigured") return { configured: false as const, receipt: null };
      const client = gate.client;
      const c = client as unknown as DynClient;
      const rid = parseContractUintString("requestId", input.requestId);
      const raw = await readResult<unknown>(
        c.get_action_receipt({ request_id: rid })
      );
      return {
        configured: true as const,
        receipt: raw == null ? null : normalizeActionReceipt(raw),
      };
    }),

  getReputation: publicProcedure
    .input(z.object({ network: networkIn, serviceId: z.number().int().nonnegative() }))
    .query(async ({ input }) => {
      const gate = await resolveAgentMarketClient(input.network);
      if (gate.kind === "unconfigured") return { configured: false as const, reputation: null };
      const client = gate.client;
      const c = client as unknown as DynClient;
      const raw = await readResult<unknown>(
        c.get_reputation({ service_id: input.serviceId })
      );
      return {
        configured: true as const,
        reputation: raw == null ? null : normalizeReputationRecord(raw),
      };
    }),
});
