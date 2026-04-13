import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { stellarRouter } from "./routers/stellar";
import { agentRouter } from "./routers/agent";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  stellar: stellarRouter,
  agent: agentRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // x402 Payment Endpoints
  payments: router({
    createChallenge: publicProcedure
      .input(z.object({ queryId: z.string(), amount: z.number().positive(), currency: z.string().default("USDC") }))
      .mutation(async ({ input }) => {
        const challengeId = `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return {
          challengeId,
          amount: input.amount,
          currency: input.currency,
          queryId: input.queryId,
          timestamp: new Date(),
          status: "pending",
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        };
      }),
    approveChallenge: publicProcedure
      .input(z.object({ challengeId: z.string(), walletAddress: z.string() }))
      .mutation(async ({ input }) => {
        const transactionHash = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return {
          success: true,
          transactionHash,
          status: "confirmed",
          timestamp: new Date(),
          amount: 0.001,
          currency: "USDC",
        };
      }),
    getHistory: publicProcedure.query(async () => {
      return [
        { id: 1, type: "query", description: "Web Search Query", amount: 0.001, currency: "USDC", status: "confirmed", transactionHash: "0x123abc...", timestamp: new Date(Date.now() - 2 * 60 * 1000) },
        { id: 2, type: "query", description: "Market Data Query", amount: 0.002, currency: "USDC", status: "confirmed", transactionHash: "0x456def...", timestamp: new Date(Date.now() - 5 * 60 * 1000) },
        { id: 3, type: "deposit", description: "Wallet Deposit", amount: 100, currency: "USDC", status: "confirmed", transactionHash: "0x789ghi...", timestamp: new Date(Date.now() - 60 * 60 * 1000) },
      ];
    }),
    getBalance: publicProcedure
      .input(z.object({ walletAddress: z.string() }))
      .query(async ({ input }) => ({
        address: input.walletAddress,
        balance: 1250.00,
        currency: "USDC",
        network: "testnet",
        lastUpdated: new Date(),
      })),
  }),

  // Wallet Endpoints
  wallet: router({
    connect: publicProcedure
      .input(z.object({ address: z.string(), network: z.enum(["testnet", "mainnet"]) }))
      .mutation(async ({ input }) => ({
        success: true,
        address: input.address,
        network: input.network,
        balance: 1250.00,
        timestamp: new Date(),
      })),
    getInfo: publicProcedure
      .input(z.object({ address: z.string() }))
      .query(async ({ input }) => ({
        address: input.address,
        network: "testnet",
        balance: 1250.00,
        currency: "USDC",
        queryLimit: 5000,
        queriesUsed: 450,
        spendingLimit: 50,
        spentToday: 0.45,
      })),
    getTransactions: publicProcedure
      .input(z.object({ address: z.string(), limit: z.number().default(10) }))
      .query(async () => [
        { id: "tx_001", type: "query", service: "web-search", amount: 0.001, status: "confirmed", hash: "0x123...", timestamp: new Date(Date.now() - 2 * 60 * 1000) },
        { id: "tx_002", type: "query", service: "market-data", amount: 0.002, status: "confirmed", hash: "0x456...", timestamp: new Date(Date.now() - 10 * 60 * 1000) },
        { id: "tx_003", type: "deposit", service: "wallet", amount: 100, status: "confirmed", hash: "0x789...", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      ]),
  }),

  // Query/Search Endpoints
  search: router({
    execute: publicProcedure
      .input(z.object({ query: z.string(), service: z.enum(["web-search", "market-data", "news-feed"]) }))
      .mutation(async ({ input }) => {
        const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return {
          queryId,
          query: input.query,
          service: input.service,
          cost: 0.001,
          currency: "USDC",
          status: "processing",
          timestamp: new Date(),
          estimatedSettlementTime: "< 500ms",
        };
      }),
    getResult: publicProcedure
      .input(z.object({ queryId: z.string() }))
      .query(async () => ({
        status: "completed",
        results: [
          { title: "Stellar Protocol Documentation", url: "https://developers.stellar.org", snippet: "Official Stellar protocol documentation..." },
          { title: "x402 Payment Protocol", url: "https://x402.org", snippet: "Micropayment protocol for web services..." },
        ],
        executionTime: 234,
        resultCount: 2,
      })),
    estimateCost: publicProcedure
      .input(z.object({ query: z.string(), service: z.enum(["web-search", "market-data", "news-feed"]) }))
      .query(async ({ input }) => {
        const costMap: Record<string, number> = { "web-search": 0.001, "market-data": 0.002, "news-feed": 0.001 };
        return {
          service: input.service,
          baseCost: costMap[input.service] || 0.001,
          currency: "USDC",
          estimatedSettlementTime: "< 500ms",
          dailyLimit: 5000,
          dailyUsed: 450,
        };
      }),
  }),

  // Service Catalog Endpoints
  services: router({
    list: publicProcedure.query(async () => [
      { id: "web-search", name: "Web Search", description: "Search the web with AI-powered agents", price: 0.001, currency: "USDC", rateLimit: "1000 queries/day", status: "available", features: ["Real-time results", "AI-powered", "Fast settlement", "Auditable"] },
      { id: "market-data", name: "Market Data", description: "Real-time cryptocurrency and stock market data", price: 0.002, currency: "USDC", rateLimit: "500 queries/day", status: "available", features: ["Live prices", "Historical data", "Technical analysis", "Alerts"] },
      { id: "news-feed", name: "News Feed", description: "Curated news and updates from multiple sources", price: 0.001, currency: "USDC", rateLimit: "2000 queries/day", status: "available", features: ["Multi-source", "Real-time", "Categorized", "Searchable"] },
    ]),
    getDetails: publicProcedure
      .input(z.object({ serviceId: z.string() }))
      .query(async ({ input }) => {
        const services: Record<string, any> = {
          "web-search": { id: "web-search", name: "Web Search", description: "Search the web with AI-powered agents", price: 0.001, rateLimit: 1000, period: "day", documentation: "https://docs.stellarhacks.io/web-search", status: "available" },
          "market-data": { id: "market-data", name: "Market Data", description: "Real-time cryptocurrency and stock market data", price: 0.002, rateLimit: 500, period: "day", documentation: "https://docs.stellarhacks.io/market-data", status: "available" },
          "news-feed": { id: "news-feed", name: "News Feed", description: "Curated news and updates from multiple sources", price: 0.001, rateLimit: 2000, period: "day", documentation: "https://docs.stellarhacks.io/news-feed", status: "available" },
        };
        return services[input.serviceId] || null;
      }),
  }),
});

export type AppRouter = typeof appRouter;
