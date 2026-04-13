import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { executeSearch, searchStellarInfo } from "../_core/mcpSearch";

export interface ToolCall {
  id: string;
  type: "search" | "blockchain_lookup" | "balance_check";
  name: string;
  input: Record<string, unknown>;
  status: "pending" | "completed" | "failed";
  result?: unknown;
  error?: string;
}

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  timestamp: Date;
}

export const agentRouter = router({
  // Chat with AI agent
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
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Build system prompt with Stellar context
        const systemPrompt = `You are a Stellar blockchain AI agent. You have access to the following tools:
1. search - Search the web for information
2. blockchain_lookup - Look up Stellar blockchain information
3. balance_check - Check XLM balance for a Stellar account

When the user asks you to search, use the search tool. When they ask about blockchain data, use the blockchain_lookup tool.
${input.walletPublicKey ? `The user's Stellar wallet public key is: ${input.walletPublicKey}` : ""}

Respond with clear, helpful information. When using tools, explain what you're doing.`;

        // Prepare messages for LLM
        const messages = [
          { role: "system" as const, content: systemPrompt },
          ...input.conversationHistory.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })),
          { role: "user" as const, content: input.message },
        ];

        // Call LLM with tool definitions
        const response = await invokeLLM({
          messages,
          tools: [
            {
              type: "function",
              function: {
                name: "search",
                description: "Search the web for information",
                parameters: {
                  type: "object",
                  properties: {
                    query: {
                      type: "string",
                      description: "The search query",
                    },
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
          ],
        });

        const assistantMessage =
          response.choices[0]?.message?.content || "I couldn't generate a response.";

        return {
          message: assistantMessage,
          toolCalls: [],
        };
      } catch (error) {
        throw new Error(`Failed to process agent chat: ${error}`);
      }
    }),

  // Search the web using MCP
  search: publicProcedure
    .input(z.object({ query: z.string(), searchType: z.enum(["general", "stellar", "blockchain"]).default("general") }))
    .mutation(async ({ input }) => {
      try {
        let response;
        if (input.searchType === "stellar") {
          response = await searchStellarInfo(input.query);
        } else {
          response = await executeSearch(input.query);
        }
        return response;
      } catch (error) {
        throw new Error(`Failed to search: ${error}`);
      }
    }),

  // Lookup blockchain information
  blockchainLookup: publicProcedure
    .input(z.object({ query: z.string(), publicKey: z.string().optional() }))
    .mutation(async ({ input }) => {
      try {
        // Search for blockchain information using MCP
        const response = await searchStellarInfo(input.query);
        return {
          query: input.query,
          results: response.results,
          totalResults: response.totalResults,
        };
      } catch (error) {
        throw new Error(`Failed to lookup blockchain: ${error}`);
      }
    }),
});
