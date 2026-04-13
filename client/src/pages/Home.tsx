import { useState } from "react";
import { useStellarWallet } from "@/_core/hooks/useStellarWallet";
import { WalletConnect } from "@/components/WalletConnect";
import { AgentChat } from "@/components/AgentChat";
import { AccountDashboard } from "@/components/AccountDashboard";
import { AgentTaskPanel } from "@/components/AgentTaskPanel";
import { Zap, Wallet, MessageSquare, Activity, ArrowRight, Sparkles, Cpu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { isConnected, account, connectWallet } = useStellarWallet();
  const [activeTab, setActiveTab] = useState<"chat" | "dashboard" | "tasks">("chat");
  const [showApp, setShowApp] = useState(isConnected);

  if (!isConnected && !showApp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        </div>

        {/* Header */}
        <header className="relative z-10 border-b border-cyan-500/20 bg-slate-950/40 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/50">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400">
                  Stellar AI Agent
                </h1>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Stellar Testnet</p>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="relative z-10 container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Main Title */}
            <div className="space-y-4">
              <h2 className="text-5xl md:text-6xl font-bold">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-300">
                  Blockchain AI
                </span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Meets Intelligence
                </span>
              </h2>
              <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
                Harness the power of Stellar blockchain with AI-driven agents. Connect your wallet, chat with intelligent agents, and execute blockchain operations in real-time.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-12">
              <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-500/30 hover:border-cyan-500/60 rounded-xl p-6 transition-all hover:shadow-lg hover:shadow-cyan-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/5 group-hover:to-cyan-500/5 rounded-xl transition-all"></div>
                <div className="relative z-10">
                  <Wallet className="w-8 h-8 text-cyan-400 mb-3" />
                  <h3 className="text-lg font-semibold text-cyan-300 mb-2">Wallet Connect</h3>
                  <p className="text-sm text-gray-400">Seamlessly connect your Freighter wallet and manage your Stellar account</p>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-purple-500/30 hover:border-purple-500/60 rounded-xl p-6 transition-all hover:shadow-lg hover:shadow-purple-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:to-purple-500/5 rounded-xl transition-all"></div>
                <div className="relative z-10">
                  <Cpu className="w-8 h-8 text-purple-400 mb-3" />
                  <h3 className="text-lg font-semibold text-purple-300 mb-2">AI Agents</h3>
                  <p className="text-sm text-gray-400">Interact with intelligent agents powered by advanced LLM technology</p>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-pink-500/30 hover:border-pink-500/60 rounded-xl p-6 transition-all hover:shadow-lg hover:shadow-pink-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-pink-500/0 group-hover:from-pink-500/5 group-hover:to-pink-500/5 rounded-xl transition-all"></div>
                <div className="relative z-10">
                  <Search className="w-8 h-8 text-pink-400 mb-3" />
                  <h3 className="text-lg font-semibold text-pink-300 mb-2">Web Search</h3>
                  <p className="text-sm text-gray-400">Real-time web search and blockchain data lookup via MCP</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button
                onClick={() => {
                  connectWallet();
                  setShowApp(true);
                }}
                className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-black font-semibold px-8 py-6 text-lg rounded-lg shadow-lg shadow-cyan-500/50 transition-all hover:shadow-cyan-500/70 flex items-center gap-2"
              >
                <Wallet className="w-5 h-5" />
                Connect Wallet & Launch
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => setShowApp(true)}
                variant="outline"
                className="border-purple-500/50 text-purple-300 hover:bg-purple-950/50 px-8 py-6 text-lg rounded-lg transition-all"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Explore Demo
              </Button>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-4 pt-16 border-t border-gray-700/50">
              <div className="text-center">
                <p className="text-3xl font-bold text-cyan-400">100%</p>
                <p className="text-sm text-gray-400 mt-1">Decentralized</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-400">&lt;1s</p>
                <p className="text-sm text-gray-400 mt-1">Response Time</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-pink-400">∞</p>
                <p className="text-sm text-gray-400 mt-1">Possibilities</p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-gray-700/50 bg-slate-950/40 backdrop-blur-md mt-20">
          <div className="container mx-auto px-4 py-8">
            <p className="text-center text-sm text-gray-500">
              DoraHacks Stellar Agents x402 Stripe MPP | Powered by Stellar & AI
            </p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                  Stellar AI Agent
                </h1>
                <p className="text-xs text-gray-400">Blockchain-powered AI assistant</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-400">Stellar Testnet</p>
              {isConnected && account && (
                <p className="text-sm text-cyan-400 font-mono">
                  {account.publicKey.substring(0, 8)}...
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Wallet & Info */}
          <div className="lg:col-span-1 space-y-4">
            <WalletConnect />

            {isConnected && account && (
              <div className="space-y-2">
                <div className="bg-slate-950 border border-purple-500/30 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-2">Quick Stats</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Balance:</span>
                      <span className="text-cyan-300 font-mono">
                        {parseFloat(account.balance).toFixed(2)} XLM
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Sequence:</span>
                      <span className="text-purple-300 font-mono text-xs">
                        {account.sequenceNumber}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {!isConnected ? (
              <div className="bg-slate-950 border border-cyan-500/30 rounded-lg p-8 text-center">
                <Wallet className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-cyan-400 mb-2">
                  Connect Your Stellar Wallet
                </h2>
                <p className="text-gray-400 mb-4">
                  To get started with the Stellar AI Agent, connect your Freighter wallet to access
                  blockchain features and agent capabilities.
                </p>
                <p className="text-xs text-gray-500">
                  Make sure you have the Freighter wallet extension installed in your browser.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Tab Navigation */}
                <div className="flex gap-2 bg-slate-950 border border-purple-500/30 rounded-lg p-2">
                  <button
                    onClick={() => setActiveTab("chat")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded transition ${
                      activeTab === "chat"
                        ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white"
                        : "text-gray-400 hover:text-purple-400"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm">Chat</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded transition ${
                      activeTab === "dashboard"
                        ? "bg-gradient-to-r from-cyan-600 to-cyan-500 text-white"
                        : "text-gray-400 hover:text-cyan-400"
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span className="text-sm">Dashboard</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("tasks")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded transition ${
                      activeTab === "tasks"
                        ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white"
                        : "text-gray-400 hover:text-purple-400"
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span className="text-sm">Tasks</span>
                  </button>
                </div>

                {/* Tab Content */}
                <div className="h-96 lg:h-[600px]">
                  {activeTab === "chat" && account && (
                    <AgentChat walletPublicKey={account.publicKey} />
                  )}
                  {activeTab === "dashboard" && account && (
                    <AccountDashboard publicKey={account.publicKey} />
                  )}
                  {activeTab === "tasks" && <AgentTaskPanel />}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-cyan-500/20 bg-slate-950/80 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <h3 className="text-cyan-400 font-semibold mb-2">About</h3>
              <p className="text-sm text-gray-400">
                Stellar AI Agent combines blockchain technology with AI to create intelligent,
                autonomous agents on the Stellar network.
              </p>
            </div>
            <div>
              <h3 className="text-purple-400 font-semibold mb-2">Features</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Real-time wallet integration</li>
                <li>• AI-powered search and lookup</li>
                <li>• Blockchain transaction tracking</li>
                <li>• Live agent task monitoring</li>
              </ul>
            </div>
            <div>
              <h3 className="text-cyan-400 font-semibold mb-2">Resources</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>
                  <a
                    href="https://developers.stellar.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-cyan-400 transition"
                  >
                    Stellar Docs
                  </a>
                </li>
                <li>
                  <a
                    href="https://freighter.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-cyan-400 transition"
                  >
                    Freighter Wallet
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-4 text-center text-xs text-gray-500">
            <p>Stellar AI Agent © 2026 | DoraHacks Stellar Agents x402 Stripe MPP</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
