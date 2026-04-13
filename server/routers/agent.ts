import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import type { Message, TextContent, Tool, ToolCall as LLMToolCall } from "../_core/llm";
import { invokeLLM } from "../_core/llm";
import { executeSearch, searchStellarInfo } from "../_core/mcpSearch";
import { ENV } from "../_core/env";
import type { AgentToolCallWire } from "@shared/appConnectionModel";

const agentTools: Tool[] = [
  {
    type: "function",
    function: {
      name: "search",
      description: "Search the web for information",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "blockchain_lookup",
      description: "Look up Stellar blockchain information",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The blockchain query (e.g., account info, transaction)",
          },
        },
        required: ["query"],
      },
    },
  },
];

function assistantContentToString(
  content: string | Array<TextContent | { type: string }> | undefined
): string {
  if (content == null) return "";
  if (typeof content === "string") return content;
  const parts = content
    .filter((c): c is TextContent => typeof c === "object" && c !== null && "type" in c)
    .filter((c) => c.type === "text")
    .map((c) => c.text);
  return parts.join("\n");
}

export const agentRouter = router({
  capabilities: publicProcedure.query(() => ({
    llmConfigured: Boolean(ENV.forgeApiKey && ENV.forgeApiKey.trim().length > 0),
    searchMode: "mock" as const,
    paymentMiddleware: true as const,
  })),

  chat: publicProcedure
    .input(
      z.object({
        message: z.string(),
        conversationHistory: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          })
        ),
        walletPublicKey: z.string().optional(),
        reputationContext: z.string().max(1200).optional(),
        stellarContext: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const repBlock = input.reputationContext
        ? `\nSession trust summary (behavioral, from local app history — not identity): ${input.reputationContext}\nIf trust is weak or demo-heavy, prefer cautious language, cite verification steps, and avoid implying certainty you do not have. If trust is strong and evidence is multi-source, you may answer more directly while still encouraging on-chain verification for balances and sequence.`
        : "";

      const stellarBlock = input.stellarContext
        ? `\nLive UI / wallet context (from the app, not a chain proof): ${input.stellarContext}\nUse this to choose tools and to say clearly whether you are on testnet or mainnet. If the wallet is missing or Horizon data is stale, say so in plain language before using tools.`
        : "";

      const systemPrompt = `You are a Stellar blockchain AI agent. You have access to tools:
1. search — search curated Stellar / web documentation (results may be demo data).
2. blockchain_lookup — Stellar-focused lookup (demo data until live MCP is connected).

When the user asks to search or find docs, call search. When they ask about on-chain data, accounts, or transactions, call blockchain_lookup.
${input.walletPublicKey ? `The user's Stellar wallet public key is: ${input.walletPublicKey}` : "No wallet is connected; explain when signing or account-specific actions need Freighter."}
${stellarBlock}
${repBlock}

Payments: The client may use per-request (x402-style) quotes, prepaid credits, or session/streaming settlement. x402 on Stellar expects Soroban auth-entry signing; Freighter browser extension supports it — say clearly if the wallet cannot sign auth entries (e.g. some mobile wallets). Mention when an action looks unpaid, pending authorization, or settled only if the user’s message or context implies it; do not invent transaction IDs.

After tools run, answer concisely and reference what you learned.`;

      if (!ENV.forgeApiKey || ENV.forgeApiKey.trim().length === 0) {
        return {
          message:
            "The agent service has no LLM API key configured. Set BUILT_IN_FORGE_API_KEY in the server environment to enable chat responses.",
          toolCalls: [] as AgentToolCallWire[],
          llmConfigured: false,
          searchMode: "mock" as const,
        };
      }

      const recordedTools: AgentToolCallWire[] = [];

      let messages: Message[] = [
        { role: "system", content: systemPrompt },
        ...input.conversationHistory.map(
          (msg): Message => ({
            role: msg.role,
            content: msg.content,
          })
        ),
        { role: "user", content: input.message },
      ];

      const maxRounds = 5;

      for (let round = 0; round < maxRounds; round++) {
        let response;
        try {
          response = await invokeLLM({
            messages,
            tools: agentTools,
            toolChoice: "auto",
          });
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error);
          console.error("[agent.chat] invokeLLM failed", detail);
          return {
            message:
              "The agent service hit an error talking to the LLM. Check BUILT_IN_FORGE_API_KEY and network access.",
            toolCalls: recordedTools,
            llmConfigured: true,
            searchMode: "mock" as const,
            errorCode: "llm_invoke_failed",
            developerDetail: detail,
          };
        }

        const choice = response.choices[0];
        const msg = choice?.message;
        if (!msg) {
          return {
            message: "The model returned an empty message.",
            toolCalls: recordedTools,
            llmConfigured: true,
            searchMode: "mock" as const,
          };
        }

        const toolCalls = msg.tool_calls;
        if (toolCalls && toolCalls.length > 0) {
          const assistantText = assistantContentToString(msg.content);
          messages.push({
            role: "assistant",
            content: assistantText,
            tool_calls: toolCalls,
          });

          for (const tc of toolCalls) {
            const wire = await runToolCall(tc, recordedTools);
            messages.push({
              role: "tool",
              tool_call_id: tc.id,
              content: wire.payload,
            });
          }
          continue;
        }

        const text = assistantContentToString(msg.content);
        return {
          message: text || "I couldn't generate a response.",
          toolCalls: recordedTools,
          llmConfigured: true,
          searchMode: "mock" as const,
        };
      }

      return {
        message: "Stopped after the maximum number of tool rounds.",
        toolCalls: recordedTools,
        llmConfigured: true,
        searchMode: "mock" as const,
      };
    }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
        searchType: z.enum(["general", "stellar", "blockchain"]).default("general"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        if (input.searchType === "stellar") {
          return await searchStellarInfo(input.query);
        }
        return await executeSearch(input.query);
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        console.error("[agent.search]", detail);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Search failed: ${detail}`,
          cause: error instanceof Error ? error : undefined,
        });
      }
    }),

  blockchainLookup: publicProcedure
    .input(z.object({ query: z.string(), publicKey: z.string().optional() }))
    .mutation(async ({ input }) => {
      try {
        const response = await searchStellarInfo(input.query);
        return {
          query: input.query,
          results: response.results,
          totalResults: response.totalResults,
          searchMode: response.searchMode,
        };
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        console.error("[agent.blockchainLookup]", detail);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Blockchain lookup failed: ${detail}`,
          cause: error instanceof Error ? error : undefined,
        });
      }
    }),
});

async function runToolCall(
  tc: LLMToolCall,
  recordedTools: AgentToolCallWire[]
): Promise<{ payload: string }> {
  const fn = tc.function.name;
  let args: Record<string, unknown>;
  try {
    args = JSON.parse(tc.function.arguments || "{}") as Record<string, unknown>;
  } catch {
    const err = "Invalid JSON in tool arguments";
    const failed: AgentToolCallWire = {
      id: tc.id,
      type: fn === "search" ? "search" : fn === "blockchain_lookup" ? "blockchain_lookup" : "balance_check",
      name: fn,
      input: {},
      status: "failed",
      error: err,
    };
    recordedTools.push(failed);
    return { payload: JSON.stringify({ error: err }) };
  }

  const base: AgentToolCallWire = {
    id: tc.id,
    type: fn === "search" ? "search" : fn === "blockchain_lookup" ? "blockchain_lookup" : "balance_check",
    name: fn,
    input: args,
    status: "pending",
  };

  try {
    if (fn === "search") {
      const q = String(args.query ?? "");
      const r = await executeSearch(q);
      recordedTools.push({
        ...base,
        name: `search: ${q}`,
        status: "completed",
        result: r,
      });
      return { payload: JSON.stringify(r) };
    }

    if (fn === "blockchain_lookup") {
      const q = String(args.query ?? "");
      const r = await searchStellarInfo(q);
      recordedTools.push({
        ...base,
        name: `blockchain_lookup: ${q}`,
        status: "completed",
        result: r,
      });
      return { payload: JSON.stringify(r) };
    }

    const err = `Unknown tool: ${fn}`;
    recordedTools.push({ ...base, status: "failed", error: err });
    return { payload: JSON.stringify({ error: err }) };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    recordedTools.push({ ...base, status: "failed", error: err });
    return { payload: JSON.stringify({ error: err }) };
  }
}
