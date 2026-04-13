import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as StellarSdk from "@stellar/stellar-sdk";
import {
  getHorizonUrl,
  STELLAR_NETWORK_PASSPHRASE,
  type StellarNetworkMode,
} from "@shared/stellarHorizon";
import { mapAccountData } from "@shared/stellarAccountFormat";

function horizonServer(network: StellarNetworkMode) {
  return new StellarSdk.Horizon.Server(getHorizonUrl(network), {
    allowHttp: network === "testnet",
  });
}

export const stellarRouter = router({
  getAccountDetails: publicProcedure
    .input(
      z.object({
        publicKey: z.string(),
        network: z.enum(["mainnet", "testnet"]).default("testnet"),
      })
    )
    .query(async ({ input }) => {
      const server = horizonServer(input.network);
      try {
        const account = await server.accounts().accountId(input.publicKey).call();
        return mapAccountData({
          publicKey: input.publicKey,
          network: input.network,
          balances: account.balances as Array<{ asset_type?: string; balance?: string }>,
          sequence: account.sequence,
          subentry_count: account.subentry_count,
          id: account.id,
        });
      } catch (error) {
        throw new Error(`Failed to fetch account details: ${error}`);
      }
    }),

  getRecentTransactions: publicProcedure
    .input(
      z.object({
        publicKey: z.string(),
        limit: z.number().default(10),
        network: z.enum(["mainnet", "testnet"]).default("testnet"),
      })
    )
    .query(async ({ input }) => {
      const server = horizonServer(input.network);
      try {
        const transactions = await server
          .transactions()
          .forAccount(input.publicKey)
          .limit(input.limit)
          .order("desc")
          .call();

        return transactions.records.map((tx) => {
          const t = tx as unknown as {
            id: string;
            hash: string;
            created_at: string;
            source_account: string;
            successful: boolean;
            type?: string;
            ledger?: number;
            ledger_attr?: number;
          };
          return {
            id: t.id,
            hash: t.hash,
            ledger: typeof t.ledger === "number" ? t.ledger : t.ledger_attr ?? 0,
            created_at: t.created_at,
            source_account: t.source_account,
            type: t.type ?? "unknown",
            successful: t.successful,
          };
        });
      } catch (error) {
        throw new Error(`Failed to fetch transactions: ${error}`);
      }
    }),

  getOperations: publicProcedure
    .input(
      z.object({
        publicKey: z.string(),
        limit: z.number().default(20),
        network: z.enum(["mainnet", "testnet"]).default("testnet"),
      })
    )
    .query(async ({ input }) => {
      const server = horizonServer(input.network);
      try {
        const operations = await server
          .operations()
          .forAccount(input.publicKey)
          .limit(input.limit)
          .order("desc")
          .call();

        return operations.records.map((op) => {
          const o = op as {
            id: string | number;
            type?: string;
            created_at: string;
            source_account: string;
            transaction_hash: string;
          };
          return {
            id: String(o.id),
            type: o.type ?? "unknown",
            created_at: o.created_at,
            source_account: o.source_account,
            transaction_hash: o.transaction_hash,
          };
        });
      } catch (error) {
        throw new Error(`Failed to fetch operations: ${error}`);
      }
    }),

  getNetworkInfo: publicProcedure
    .input(
      z
        .object({
          network: z.enum(["mainnet", "testnet"]).default("testnet"),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const network: StellarNetworkMode = input?.network ?? "testnet";
      const server = horizonServer(network);
      try {
        const ledger = await server.ledgers().limit(1).order("desc").call();
        const latestLedger = ledger.records[0] as {
          sequence: number;
          base_fee?: number;
          base_fee_in_stroops?: number;
          base_reserve?: number;
          base_reserve_in_stroops?: number;
        };

        return {
          latestLedger: latestLedger.sequence,
          baseFee: latestLedger.base_fee_in_stroops?.toString() ?? String(latestLedger.base_fee ?? "100"),
          baseReserve: latestLedger.base_reserve_in_stroops?.toString() ?? "5000000",
          networkPassphrase: STELLAR_NETWORK_PASSPHRASE[network],
          network,
          horizonUrl: getHorizonUrl(network),
        };
      } catch (error) {
        throw new Error(`Failed to fetch network info: ${error}`);
      }
    }),
});
