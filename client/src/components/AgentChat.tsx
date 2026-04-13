import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Send, Search, Database, Loader2, Bot, Wrench } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAgentWorkflow } from "@/_core/context/AgentWorkflowContext";
import type { AgentToolCallWire } from "@shared/appConnectionModel";
import { isSearchResponseWire, type SearchResponseWire } from "@shared/searchContract";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  timestamp: Date;
  toolCalls?: AgentToolCallWire[];
  demoLabel?: string;
};

function mapChatError(err: unknown): { title: string; body: string; dev?: string } {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("OPENAI") || msg.includes("API_KEY") || msg.includes("LLM")) {
    return {
      title: "Agent service unavailable",
      body: "The agent could not reach the LLM. Check BUILT_IN_FORGE_API_KEY on the server.",
      dev: msg,
    };
  }
  return {
    title: "Message failed",
    body: "Something went wrong sending your message. Try again in a moment.",
    dev: msg,
  };
}

export function AgentChat({ walletPublicKey }: { walletPublicKey?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const chatMutation = trpc.agent.chat.useMutation();
  const caps = trpc.agent.capabilities.useQuery();

  const { beginTurn, recordToolCalls, finishTurn } = useAgentWorkflow();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    beginTurn(text);

    try {
      const response = await chatMutation.mutateAsync({
        message: text,
        conversationHistory: messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: m.content })),
        walletPublicKey,
      });

      const toolCalls = (response.toolCalls ?? []) as AgentToolCallWire[];
      if (toolCalls.length) recordToolCalls(toolCalls);

      const searchMode = response.searchMode ?? "mock";
      const llmOk = response.llmConfigured !== false;

      const toolCards: ChatMessage[] = [];
      for (const tc of toolCalls) {
        if (tc.status === "completed" && tc.result && isSearchResponseWire(tc.result)) {
          toolCards.push({
            id: `t_${tc.id}`,
            role: "tool",
            content:
              tc.type === "search"
                ? "Agent search results"
                : "Agent blockchain / Stellar lookup results",
            timestamp: new Date(),
            toolCalls: [tc],
            demoLabel: searchMode === "mock" ? "Demo result" : "Live",
          });
        } else if (tc.status === "failed") {
          toolCards.push({
            id: `t_${tc.id}`,
            role: "system",
            content: tc.error ?? "Tool failed",
            timestamp: new Date(),
          });
        }
      }

      const assistantMessage: ChatMessage = {
        id: `a_${Date.now()}`,
        role: "assistant",
        content: typeof response.message === "string" ? response.message : JSON.stringify(response.message),
        timestamp: new Date(),
        toolCalls: toolCalls.length ? toolCalls : undefined,
        demoLabel: !llmOk ? "LLM offline" : searchMode === "mock" ? "Search mock" : undefined,
      };

      setMessages((prev) => [...prev, ...toolCards, assistantMessage]);
      finishTurn({ ok: true, summary: "Assistant reply ready" });

      if (response.developerDetail) {
        console.warn("[AgentChat] server detail:", response.developerDetail);
      }
    } catch (error) {
      console.error("[AgentChat]", error);
      const mapped = mapChatError(error);
      setMessages((prev) => [
        ...prev,
        {
          id: `e_${Date.now()}`,
          role: "system",
          content: `${mapped.title}: ${mapped.body}`,
          timestamp: new Date(),
        },
      ]);
      if (mapped.dev) console.error(mapped.dev);
      finishTurn({ ok: false, error: mapped.body });
    } finally {
      setIsLoading(false);
      requestAnimationFrame(() => composerRef.current?.focus());
    }
  }, [
    input,
    isLoading,
    messages,
    walletPublicKey,
    chatMutation,
    beginTurn,
    recordToolCalls,
    finishTurn,
  ]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const llmConfigured = caps.data?.llmConfigured ?? true;
  const searchMock = caps.data?.searchMode === "mock";

  return (
    <Card className="border border-purple-500/25 bg-slate-950/90 h-full flex flex-col shadow-md shadow-purple-950/20">
      <div className="border-b border-purple-500/20 bg-slate-900/50 px-4 py-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-purple-400 font-semibold flex items-center gap-2">
            <Bot className="w-4 h-4" aria-hidden />
            Stellar AI agent
          </h2>
          <Badge
            variant="outline"
            className={`text-[10px] uppercase ${llmConfigured ? "border-emerald-500/40 text-emerald-300" : "border-amber-500/40 text-amber-200"}`}
          >
            {llmConfigured ? "LLM connected" : "LLM not configured"}
          </Badge>
          {searchMock && (
            <Badge variant="outline" className="text-[10px] border-amber-500/35 text-amber-200">
              Search mock
            </Badge>
          )}
        </div>
        <p className="text-xs text-slate-400">
          The agent can call search and Stellar lookup tools; tool steps appear as cards below. Shift+Enter adds a new line.
        </p>
      </div>

      <ScrollArea className="flex-1 min-h-0 p-4">
        <div className="space-y-4 pr-2">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 py-10 space-y-2" role="status">
              <p className="text-sm text-slate-400">Ask about Stellar accounts, assets, or documentation.</p>
              <p className="text-xs text-slate-500">
                {!walletPublicKey && "Connect your wallet so the agent knows your public key."}
              </p>
            </div>
          )}

          {messages.map((message) => (
            <article
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              aria-label={`${message.role} message`}
            >
              <div
                className={`max-w-[min(100%,28rem)] rounded-lg border px-3 py-2.5 shadow-sm ${
                  message.role === "user"
                    ? "bg-cyan-600/15 border-cyan-500/35 text-cyan-50"
                    : message.role === "assistant"
                      ? "bg-purple-600/12 border-purple-500/35 text-purple-50"
                      : message.role === "tool"
                        ? "bg-slate-900/80 border-cyan-500/25 text-slate-100"
                        : "bg-amber-950/30 border-amber-500/25 text-amber-100"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {message.demoLabel && (
                    <Badge variant="outline" className="text-[9px] border-slate-500/40 text-slate-300">
                      {message.demoLabel}
                    </Badge>
                  )}
                </div>

                {message.role === "tool" && message.toolCalls?.[0]?.result && isSearchResponseWire(message.toolCalls[0].result) ? (
                  <ToolResultCard
                    title={message.content}
                    data={message.toolCalls[0].result}
                    kind={message.toolCalls[0].type}
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                )}

                {message.role === "assistant" && message.toolCalls && message.toolCalls.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-purple-500/25 pt-2">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 flex items-center gap-1">
                      <Wrench className="w-3 h-3" aria-hidden />
                      Tool trace
                    </p>
                    {message.toolCalls.map((tool) => (
                      <div
                        key={tool.id}
                        className="flex items-start gap-2 text-xs rounded-md bg-slate-950/50 px-2 py-1.5 border border-purple-500/15"
                      >
                        {tool.type === "search" && <Search className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" aria-hidden />}
                        {tool.type === "blockchain_lookup" && (
                          <Database className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" aria-hidden />
                        )}
                        <div className="min-w-0">
                          <p className="text-slate-200 font-medium break-words">{tool.name}</p>
                          <p className="text-slate-500">
                            {tool.status === "pending" && "Running…"}
                            {tool.status === "completed" && "Agent received tool output"}
                            {tool.status === "failed" && (tool.error ?? "Failed")}
                          </p>
                        </div>
                        {tool.status === "pending" && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0 ml-auto" aria-hidden />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <time className="text-[10px] text-slate-500 mt-2 block" dateTime={message.timestamp.toISOString()}>
                  {message.timestamp.toLocaleTimeString()}
                </time>
              </div>
            </article>
          ))}

          {isLoading && (
            <div className="flex justify-start" role="status" aria-live="polite" aria-label="Agent is responding">
              <div className="bg-purple-600/12 border border-purple-500/35 px-4 py-3 rounded-lg flex items-center gap-2 text-sm text-purple-200">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" aria-hidden />
                Agent is thinking…
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-purple-500/20 p-3 bg-slate-900/40">
        {!llmConfigured && (
          <Alert className="mb-2 border-amber-500/35 bg-amber-950/20">
            <AlertTitle className="text-amber-200 text-sm">Demo mode</AlertTitle>
            <AlertDescription className="text-xs text-amber-100/85">
              Set BUILT_IN_FORGE_API_KEY to enable full LLM replies. You can still explore the UI.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex gap-2 items-end">
          <Textarea
            ref={composerRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask the agent anything…"
            disabled={isLoading}
            rows={2}
            className="min-h-[44px] bg-slate-900 border-cyan-500/25 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-500/40 resize-none"
            aria-label="Message to Stellar AI agent"
          />
          <Button
            type="button"
            onClick={() => void send()}
            disabled={isLoading || !input.trim()}
            className="shrink-0 h-11 w-11 p-0 bg-gradient-to-br from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ToolResultCard({
  title,
  data,
  kind,
}: {
  title: string;
  data: SearchResponseWire;
  kind: AgentToolCallWire["type"];
}) {
  const isSearch = kind === "search";
  return (
    <div
      className={`space-y-2 rounded-lg border p-3 ${
        isSearch
          ? "border-cyan-500/35 bg-cyan-950/15"
          : "border-purple-500/40 bg-purple-950/20"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className={`text-sm font-medium ${isSearch ? "text-cyan-200" : "text-purple-200"}`}>{title}</p>
        <Badge variant="outline" className="text-[9px] border-amber-500/35 text-amber-200">
          {data.searchMode === "mock" ? "Demo data" : "Live"}
        </Badge>
        <Badge variant="outline" className="text-[9px] border-slate-500/40 text-slate-400">
          {kind === "search" ? "Search" : "Lookup"}
        </Badge>
      </div>
      <p className="text-[11px] text-slate-500 italic">Q: {data.query}</p>
      <ul className="space-y-2">
        {data.results.slice(0, 5).map((r, i) => (
          <li key={`${r.url}-${i}`} className="rounded-md border border-slate-700/60 bg-slate-950/60 p-2">
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-cyan-300 hover:underline font-medium"
            >
              {r.title}
            </a>
            <p className="text-xs text-slate-400 mt-1 line-clamp-3">{r.snippet}</p>
            {r.source && <p className="text-[10px] text-slate-500 mt-1">Source: {r.source}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
