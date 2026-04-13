import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as StellarSdk from "@stellar/stellar-sdk";

const HORIZON_URL = "https://horizon.stellar.org";
const server = new StellarSdk.Horizon.Server(HORIZON_URL);

export const stellarRouter = router({
  // Get account details from Stellar Horizon
  getAccountDetails: publicProcedure
    .input(z.object({ publicKey: z.string() }))
    .query(async ({ input }) => {
      try {
        const account = await server.accounts().accountId(input.publicKey).call();

        const nativeBalance =
          account.balances.find((b) => b.asset_type === "native")?.balance || "0";

        return {
          publicKey: input.publicKey,
          balance: nativeBalance,
          sequenceNumber: account.sequence,
          subentryCount: account.subentry_count,
          id: account.id,
        };
      } catch (error) {
        throw new Error(`Failed to fetch account details: ${error}`);
      }
    }),

  // Get recent transactions for an account
  getRecentTransactions: publicProcedure
    .input(z.object({ publicKey: z.string(), limit: z.number().default(10) }))
    .query(async ({ input }) => {
      try {
        const transactions = await server
          .transactions()
          .forAccount(input.publicKey)
          .limit(input.limit)
          .order("desc")
          .call();

        return transactions.records.map((tx: any) => ({
          id: tx.id,
          hash: tx.hash,
          ledger: tx.ledger,
          created_at: tx.created_at,
          source_account: tx.source_account,
          type: tx.type,
          successful: tx.successful,
        }));
      } catch (error) {
        throw new Error(`Failed to fetch transactions: ${error}`);
      }
    }),

  // Get operations for an account
  getOperations: publicProcedure
    .input(z.object({ publicKey: z.string(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      try {
        const operations = await server
          .operations()
          .forAccount(input.publicKey)
          .limit(input.limit)
          .order("desc")
          .call();

        return operations.records.map((op: any) => ({
          id: op.id,
          type: op.type,
          created_at: op.created_at,
          source_account: op.source_account,
          transaction_hash: op.transaction_hash,
        }));
      } catch (error) {
        throw new Error(`Failed to fetch operations: ${error}`);
      }
    }),

  // Get current Stellar network info
  getNetworkInfo: publicProcedure.query(async () => {
    try {
      const ledger = await server.ledgers().limit(1).order("desc").call();
      const latestLedger = ledger.records[0] as any;

      return {
        latestLedger: latestLedger.sequence,
        baseFee: latestLedger.base_fee || "100",
        baseReserve: latestLedger.base_reserve || "0.5",
        networkPassphrase: "Public Global Stellar Network ; September 2015",
      };
    } catch (error) {
      throw new Error(`Failed to fetch network info: ${error}`);
    }
  })
});
