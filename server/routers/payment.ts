import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  PaymentLayerError,
  selectPaymentMode,
  settleChallenge,
  getCreditBalance,
  topUpCredits,
  restoreCredits,
  openPaymentSession,
  commitSessionUsage,
  closePaymentSession,
  listPaymentEvents,
  evaluateWalletReadiness,
  logWalletCapabilityCheck,
  markExecutionFailedRollback,
  getPaymentStore,
  DEMO_PLACEHOLDER_PAYEE,
  quoteForAgentRequest,
} from "../_core/payment";
import type { PaymentRouteInput } from "@shared/paymentTypes";
import { nanoid } from "nanoid";

function mapPaymentError(e: unknown): never {
  if (e instanceof PaymentLayerError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: e.message,
      cause: e,
    });
  }
  throw e;
}

const routeInputSchema = z.object({
  requestType: z.enum(["search", "blockchain_lookup", "chat_tools", "premium_tool", "session", "unknown"]),
  estimatedCost: z.number().nonnegative(),
  expectedCallCount: z.number().int().positive(),
  streamingOrBurst: z.boolean(),
  userPreferredMode: z
    .enum(["per_request", "prepaid_credits", "session_streaming", "demo_free", "auto"])
    .optional(),
  demoMode: z.boolean(),
  walletConnected: z.boolean(),
  walletSupportsAuthEntry: z.boolean(),
  creditBalance: z.number().nonnegative(),
  activeSessionId: z.string().optional(),
});

export const paymentRouter = router({
  selectMode: publicProcedure.input(routeInputSchema).mutation(({ input }) => {
    return selectPaymentMode(input as PaymentRouteInput);
  }),

  walletReadiness: publicProcedure
    .input(
      z.object({
        walletConnected: z.boolean(),
        networkMatchesApp: z.boolean(),
        authEntrySigningAvailable: z.boolean(),
        xlmBalance: z.number().optional(),
        requireAuthEntry: z.boolean().default(true),
      })
    )
    .query(({ input }) => {
      const res = evaluateWalletReadiness({
        walletConnected: input.walletConnected,
        networkMatchesApp: input.networkMatchesApp,
        authEntrySigningAvailable: input.authEntrySigningAvailable,
        xlmBalance: input.xlmBalance,
        requireAuthEntry: input.requireAuthEntry,
      });
      logWalletCapabilityCheck(undefined, res.ok, res.ok ? "ready" : res.message);
      return res;
    }),

  createChallenge: publicProcedure
    .input(
      z.object({
        queryId: z.string(),
        amount: z.number().positive(),
        currency: z.string().default("USDC"),
        walletAddress: z.string().optional(),
        network: z.enum(["mainnet", "testnet"]).default("testnet"),
        idempotencyKey: z.string().optional(),
        demoMode: z.boolean().optional(),
        walletSupportsAuthEntry: z.boolean().optional(),
        userPreferredMode: z
          .enum(["per_request", "prepaid_credits", "session_streaming", "demo_free", "auto"])
          .optional(),
        streamingHint: z.boolean().optional(),
        expectedCallCount: z.number().int().positive().optional(),
        activeSessionId: z.string().optional(),
        serviceDescription: z.string().optional(),
        serviceId: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const idempotencyKey = input.idempotencyKey ?? `idem_${input.queryId}_${nanoid(8)}`;
      const routeInput: PaymentRouteInput = {
        requestType: "chat_tools",
        estimatedCost: input.amount,
        expectedCallCount: input.expectedCallCount ?? 1,
        streamingOrBurst: input.streamingHint ?? false,
        userPreferredMode: input.userPreferredMode,
        demoMode: input.demoMode ?? false,
        walletConnected: Boolean(input.walletAddress),
        walletSupportsAuthEntry: input.walletSupportsAuthEntry ?? false,
        creditBalance: input.walletAddress ? getCreditBalance(input.walletAddress) : 0,
        activeSessionId: input.activeSessionId,
      };

      const quoted = quoteForAgentRequest({
        routeInput,
        serviceId: input.serviceId ?? "agent.chat.tools",
        requestId: input.queryId,
        idempotencyKey,
        payer: input.walletAddress ?? null,
        network: input.network,
        serviceDescription: input.serviceDescription ?? "Unlock agent search and Stellar lookup for this turn",
      });

      if (!quoted.challenge) {
        return {
          challengeId: "",
          quoteId: "",
          amount: input.amount,
          currency: input.currency,
          queryId: input.queryId,
          timestamp: new Date(),
          status: "demo_free" as const,
          expiresAt: new Date(),
          mode: quoted.mode,
          routeReason: quoted.routeReason,
          replayKey: "",
          idempotencyKey,
          payee: "",
          serviceDescription: input.serviceDescription ?? "Agent tools (demo)",
          authEntrySigningRequired: false,
          network: input.network,
        };
      }

      const { challenge, reused } = quoted;
      const q = challenge.quote;
      return {
        challengeId: challenge.challengeId,
        quoteId: q.id,
        amount: q.amount,
        currency: q.asset.code,
        queryId: q.requestId,
        timestamp: new Date(q.createdAt),
        status: "pending" as const,
        expiresAt: new Date(q.expiresAt),
        mode: q.mode,
        routeReason: quoted.routeReason,
        replayKey: q.replayKey,
        idempotencyKey: q.idempotencyKey,
        payee: q.payee,
        serviceDescription: q.serviceDescription,
        authEntrySigningRequired: q.authEntrySigningRequired,
        instructions: q.instructions,
        network: q.network,
        reused,
      };
    }),

  approveChallenge: publicProcedure
    .input(
      z.object({
        challengeId: z.string(),
        walletAddress: z.string(),
        replayKey: z.string(),
        idempotencyKey: z.string(),
        signedAuthEntryXdr: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      if (!input.challengeId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No challenge in demo-free mode." });
      }
      try {
        const result = settleChallenge({
          challengeId: input.challengeId,
          payer: input.walletAddress,
          replayKey: input.replayKey,
          idempotencyKey: input.idempotencyKey,
          signedAuthEntryXdr: input.signedAuthEntryXdr,
        });
        return {
          success: true,
          transactionHash: result.transactionHash,
          status: "confirmed" as const,
          timestamp: new Date(),
          amount: result.amount,
          currency: result.currency,
          mode: result.mode,
          receiptSummary: result.receiptSummary,
        };
      } catch (e) {
        mapPaymentError(e);
      }
    }),

  getHistory: publicProcedure.query(() => {
    return getPaymentStore().history.map((row, i) => ({
      id: row.id ?? String(i),
      type: row.type,
      description: row.description,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      transactionHash: row.transactionHash,
      timestamp: row.timestamp,
      mode: row.mode,
    }));
  }),

  getEvents: publicProcedure.input(z.object({ limit: z.number().min(1).max(100).default(40) })).query(({ input }) => {
    return listPaymentEvents(input.limit);
  }),

  getBalance: publicProcedure
    .input(z.object({ walletAddress: z.string() }))
    .query(({ input }) => ({
      address: input.walletAddress,
      balance: getCreditBalance(input.walletAddress),
      currency: "CREDITS",
      network: "testnet" as const,
      lastUpdated: new Date(),
    })),

  topUpCredits: publicProcedure
    .input(z.object({ walletAddress: z.string(), amount: z.number().positive() }))
    .mutation(({ input }) => topUpCredits(input.walletAddress, input.amount)),

  openSession: publicProcedure
    .input(
      z.object({
        funder: z.string(),
        payee: z.string().optional(),
        network: z.enum(["mainnet", "testnet"]),
        depositAmount: z.number().positive(),
      })
    )
    .mutation(({ input }) => {
      try {
        return openPaymentSession({
          funder: input.funder,
          payee: input.payee ?? DEMO_PLACEHOLDER_PAYEE,
          network: input.network,
          depositAmount: input.depositAmount,
          asset: { code: "USDC" },
        });
      } catch (e) {
        mapPaymentError(e);
      }
    }),

  sessionPulse: publicProcedure
    .input(z.object({ sessionId: z.string(), delta: z.number().positive() }))
    .mutation(({ input }) => {
      try {
        return commitSessionUsage(input.sessionId, input.delta);
      } catch (e) {
        mapPaymentError(e);
      }
    }),

  closeSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(({ input }) => {
      try {
        return closePaymentSession(input.sessionId);
      } catch (e) {
        mapPaymentError(e);
      }
    }),

  notifyExecutionFailed: publicProcedure
    .input(
      z.object({
        challengeId: z.string().optional(),
        restoreCredits: z
          .object({
            wallet: z.string(),
            amount: z.number().positive(),
          })
          .optional(),
      })
    )
    .mutation(({ input }) => {
      markExecutionFailedRollback(input.challengeId ?? "", input.restoreCredits);
      return { ok: true as const };
    }),

  refundCredits: publicProcedure
    .input(z.object({ wallet: z.string(), amount: z.number().positive(), reason: z.string().default("refund") }))
    .mutation(({ input }) => restoreCredits(input.wallet, input.amount, input.reason)),
});
