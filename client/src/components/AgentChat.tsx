import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Search, Database, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolCalls?: Array<{
    id: string;
    type: "search" | "blockchain_lookup" | "balance_check";
    name: string;
    status: "pending" | "completed" | "failed";
  }>;
}

export function AgentChat({ walletPublicKey }: { walletPublicKey?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.agent.chat.useMutation();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatMutation.mutateAsync({
        message: input,
        conversationHistory: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        walletPublicKey,
      });

      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: "assistant",
        content: typeof response.message === "string" ? response.message : JSON.stringify(response.message),
        timestamp: new Date(),
        toolCalls: response.toolCalls,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-slate-950 border-purple-500/50 h-full flex flex-col">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-purple-500/30 p-4">
        <h2 className="text-purple-400 font-semibold">Stellar AI Agent</h2>
        <p className="text-xs text-gray-400 mt-1">Chat with AI-powered Stellar agent</p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">Start a conversation with the Stellar AI agent</p>
              <p className="text-xs mt-2">Ask about blockchain data, search the web, or check balances</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === "user"
                    ? "bg-cyan-600/20 border border-cyan-500/50 text-cyan-100"
                    : "bg-purple-600/20 border border-purple-500/50 text-purple-100"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {message.toolCalls && message.toolCalls.length > 0 && (
                  <div className="mt-2 space-y-1 border-t border-purple-500/30 pt-2">
                    {message.toolCalls.map((tool) => (
                      <div key={tool.id} className="flex items-center gap-2 text-xs">
                        {tool.type === "search" && <Search className="w-3 h-3 text-cyan-400" />}
                        {tool.type === "blockchain_lookup" && (
                          <Database className="w-3 h-3 text-purple-400" />
                        )}
                        <span className="text-gray-300">{tool.name}</span>
                        {tool.status === "pending" && (
                          <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-purple-600/20 border border-purple-500/50 px-4 py-2 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-purple-500/30 p-4 bg-slate-900/50">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask the agent anything..."
            disabled={isLoading}
            className="bg-slate-800 border-cyan-500/30 text-cyan-100 placeholder:text-gray-500"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
