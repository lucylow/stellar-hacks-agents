import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-pink-950/5 pt-20">
      {/* Animated neon background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container relative z-10 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-pink-500/10 border border-pink-500/40 rounded-full">
            <span className="text-sm font-medium text-cyan-300">Pay-Per-Query Web Search MCP on Stellar</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="neon-text animate-neon-pulse">Stellar Hacks</span>
            <br />
            <span className="text-white">AI Agents. Blockchain. x402 Protocol.</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Deploy autonomous AI agents that search the web, pay per query via x402 on Stellar, and settle transactions instantly with full transparency.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-500/50">
              Launch Agent <ArrowRight className="ml-2" size={20} />
            </Button>
            <Button size="lg" variant="outline" className="border-cyan-500/50 hover:bg-cyan-500/10">
              View Whitepaper
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="glass-panel p-6 text-left border-cyan-500/30 hover:border-cyan-500/60 transition-all">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-bold mb-2 text-cyan-300">Instant Settlement</h3>
              <p className="text-sm text-muted-foreground">Stellar blockchain confirms payments in seconds</p>
            </div>
            <div className="glass-panel p-6 text-left border-pink-500/30 hover:border-pink-500/60 transition-all">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="font-bold mb-2 text-pink-300">MCP Protocol</h3>
              <p className="text-sm text-muted-foreground">Works with Claude, GPT, and any AI agent</p>
            </div>
            <div className="glass-panel p-6 text-left border-cyan-400/30 hover:border-cyan-400/60 transition-all">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-bold mb-2 text-cyan-300">Full Transparency</h3>
              <p className="text-sm text-muted-foreground">Complete audit trail on Stellar ledger</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
