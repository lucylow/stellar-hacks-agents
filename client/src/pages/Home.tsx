import { useState } from "react";
import { useStellarWallet } from "@/_core/hooks/useStellarWallet";
import { WalletConnect } from "@/components/WalletConnect";
import { AgentChat } from "@/components/AgentChat";
import { AccountDashboard } from "@/components/AccountDashboard";
import { AgentTaskPanel } from "@/components/AgentTaskPanel";
import { Zap, Wallet, MessageSquare, Activity } from "lucide-react";

export default function Home() {
  const { isConnected, account } = useStellarWallet();
  const [activeTab, setActiveTab] = useState<"chat" | "dashboard" | "tasks">("chat");

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
