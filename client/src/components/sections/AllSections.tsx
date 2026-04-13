// This file contains all section components
// They will be split into individual files for organization

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { ChevronDown, Copy, Check } from "lucide-react";
import {
  mockServiceCatalog,
  mockPaymentChallenge,
  mockContractState,
  mockTransactionFeed,
  mockPricingModels,
  mockFAQ,
  mockRoadmap,
  mockInstallationSteps,
  mockTechSpecs,
  mockAgentWorkflow,
  mockResources,
  mockWalletState,
} from "@/lib/mockData";

// ValuePropositionSection
export function ValuePropositionSection() {
  const benefits = [
    {
      title: "Real-Time Information",
      description: "Access live web search results instantly through AI agents",
      icon: "🌐",
    },
    {
      title: "Micropayments",
      description: "Pay only 0.001 USDC per query with instant settlement",
      icon: "💳",
    },
    {
      title: "Transparent Execution",
      description: "Every request, payment, and result is auditable on-chain",
      icon: "🔍",
    },
    {
      title: "Agent-Native",
      description: "Built for Claude, MCP servers, and autonomous workflows",
      icon: "🤖",
    },
  ];

  return (
    <section id="value" className="py-20 bg-gradient-to-b from-background to-card/20">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Why StellarHacks Agents?</h2>
          <p className="text-lg text-muted-foreground">
            The first production-ready system for monetized agentic search on Stellar. Pay per query, settle instantly, audit everything.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="glass-panel p-8 hover:border-blue-500/50 transition-all duration-300">
              <div className="text-5xl mb-4">{benefit.icon}</div>
              <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-16">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-400 mb-2">0.001</div>
            <p className="text-sm text-muted-foreground">USDC per query</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-cyan-400 mb-2">&lt;500ms</div>
            <p className="text-sm text-muted-foreground">Average latency</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-400 mb-2">100%</div>
            <p className="text-sm text-muted-foreground">On-chain auditable</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-cyan-400 mb-2">∞</div>
            <p className="text-sm text-muted-foreground">Scalable queries</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// SearchDemoSection
export function SearchDemoSection() {
  const [query, setQuery] = useState("What are the latest developments in Stellar?");
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="demo" className="py-20 bg-background">
      <div className="container max-w-4xl">
        <h2 className="text-4xl font-bold mb-12 text-center">Live Search Demo</h2>

        <div className="glass-panel p-8 stellar-glow">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">Enter a search query:</label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-input border border-border rounded-lg p-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="What would you like to search for?"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card/50 border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-2">Estimated Cost</p>
                <p className="text-2xl font-bold text-cyan-400">0.001 USDC</p>
              </div>
              <div className="bg-card/50 border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-2">Settlement Time</p>
                <p className="text-2xl font-bold text-blue-400">&lt;500ms</p>
              </div>
            </div>

            <Button
              onClick={() => setSubmitted(!submitted)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {submitted ? "Reset Demo" : "Execute Search"}
            </Button>

            {submitted && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-sm text-green-400">✓ Query submitted and payment approved</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Transaction: 0x1234567890abcdef...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// WalletSection
export function WalletSection({ connected, onConnect }: { connected: boolean; onConnect: (v: boolean) => void }) {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-blue-950/10">
      <div className="container max-w-4xl">
        <h2 className="text-4xl font-bold mb-12 text-center">Wallet Connection</h2>

        {!connected ? (
          <div className="glass-panel p-8 text-center">
            <div className="text-5xl mb-4">👛</div>
            <h3 className="text-2xl font-bold mb-4">Connect Your Wallet</h3>
            <p className="text-muted-foreground mb-6">
              Connect a Stellar wallet to start making payments and executing queries
            </p>
            <Button
              onClick={() => onConnect(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              Connect Wallet
            </Button>
          </div>
        ) : (
          <div className="glass-panel p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Wallet Address</p>
                <p className="font-mono text-sm break-all">{mockWalletState.address}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Network</p>
                <p className="font-bold">{mockWalletState.network}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Balance</p>
                <p className="text-2xl font-bold text-cyan-400">{mockWalletState.balance} USDC</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Status</p>
                <p className="text-green-400 font-bold">✓ Connected</p>
              </div>
            </div>
            <Button
              onClick={() => onConnect(false)}
              variant="outline"
              className="w-full mt-6"
            >
              Disconnect Wallet
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

// ServiceCatalogSection
export function ServiceCatalogSection() {
  return (
    <section id="services" className="py-20 bg-background">
      <div className="container">
        <h2 className="text-4xl font-bold mb-12 text-center">Service Catalog</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockServiceCatalog.map((service) => (
            <div key={service.id} className="glass-panel p-6 hover:border-cyan-500/50 transition-all duration-300">
              <div className="text-4xl mb-3">{service.icon}</div>
              <h3 className="text-xl font-bold mb-2">{service.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Price:</span>{" "}
                  <span className="font-bold text-cyan-400">{service.pricePerQuery} {service.currency}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Rate Limit:</span>{" "}
                  <span className="font-bold">{service.rateLimit}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <span className="font-bold text-green-400">● {service.status}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// PaymentChallengeSection
export function PaymentChallengeSection() {
  return (
    <section id="value" className="py-20 bg-gradient-to-b from-background to-card/20">
      <div className="container max-w-4xl">
        <h2 className="text-4xl font-bold mb-12 text-center">Payment Challenge Flow</h2>

        <div className="glass-panel p-8">
          <div className="space-y-6">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Query</p>
              <p className="text-lg font-semibold">{mockPaymentChallenge.query}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card/50 border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-2">Cost</p>
                <p className="text-xl font-bold text-cyan-400">{mockPaymentChallenge.estimatedCost} USDC</p>
              </div>
              <div className="bg-card/50 border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-2">Daily Limit</p>
                <p className="text-xl font-bold">{mockPaymentChallenge.dailyLimit} USDC</p>
              </div>
              <div className="bg-card/50 border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-2">Daily Used</p>
                <p className="text-xl font-bold text-amber-400">{mockPaymentChallenge.dailyUsed} USDC</p>
              </div>
              <div className="bg-card/50 border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-2">Status</p>
                <p className="text-xl font-bold text-yellow-400">Pending</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white">Approve</Button>
              <Button variant="outline" className="flex-1">Deny</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ContractInspectorSection
export function ContractInspectorSection() {
  const [copied, setCopied] = useState(false);

  return (
    <section id="section" className="py-20 bg-background">
      <div className="container max-w-4xl">
        <h2 className="text-4xl font-bold mb-12 text-center">Contract Inspector</h2>

        <div className="glass-panel p-8 space-y-6">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Contract ID</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm flex-1 break-all">{mockContractState.contractId}</p>
              <button
                onClick={() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="p-2 hover:bg-secondary rounded transition-colors"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Daily Limit</p>
              <p className="font-bold">{mockContractState.dailyLimit} USDC</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Per-Query Limit</p>
              <p className="font-bold">{mockContractState.perQueryLimit} USDC</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Approval Mode</p>
              <p className="font-bold text-blue-400">{mockContractState.approvalMode}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Total Spent</p>
              <p className="font-bold text-cyan-400">{mockContractState.totalSpent} USDC</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Requests</p>
              <p className="font-bold">{mockContractState.requestsProcessed}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Status</p>
              <p className="font-bold text-green-400">Active</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// AgentWorkflowSection
export function AgentWorkflowSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-blue-950/10">
      <div className="container">
        <h2 className="text-4xl font-bold mb-12 text-center">Agent Workflow</h2>

        <div className="space-y-4">
          {mockAgentWorkflow.map((step) => (
            <div key={step.step} className="glass-panel p-6 flex items-start gap-6">
              <div className="text-4xl flex-shrink-0">{step.icon}</div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">
                  Step {step.step}: {step.title}
                </h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// TransactionFeedSection
export function TransactionFeedSection() {
  return (
    <section id="section" className="py-20 bg-background">
      <div className="container max-w-4xl">
        <h2 className="text-4xl font-bold mb-12 text-center">Transaction Feed</h2>

        <div className="space-y-4">
          {mockTransactionFeed.map((tx) => (
            <div key={tx.id} className="glass-panel p-6 border-l-4 border-blue-500">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold capitalize">{tx.type.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.timestamp).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    tx.status === "confirmed"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {tx.status}
                </span>
              </div>
              {tx.query && <p className="text-sm text-muted-foreground mb-2">{tx.query}</p>}
              {tx.amount > 0 && (
                <p className="text-sm font-bold text-cyan-400">
                  {tx.amount} {tx.currency}
                </p>
              )}
              {tx.reason && <p className="text-xs text-red-400 mt-2">{tx.reason}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// PricingSection
export function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-gradient-to-b from-background to-card/20">
      <div className="container">
        <h2 className="text-4xl font-bold mb-12 text-center">Pricing Models</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {mockPricingModels.map((model) => (
            <div
              key={model.id}
              className={`glass-panel p-8 relative ${
                model.recommended ? "ring-2 ring-cyan-500" : ""
              }`}
            >
              {model.recommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-cyan-500 text-background px-4 py-1 rounded-full text-xs font-bold">
                  Recommended
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{model.name}</h3>
              <p className="text-muted-foreground text-sm mb-6">{model.description}</p>

              <div className="mb-6">
                {model.pricePerQuery && (
                  <p className="text-3xl font-bold text-cyan-400">
                    {model.pricePerQuery} <span className="text-lg">{model.currency}</span>
                  </p>
                )}
                {model.monthlyPrice && (
                  <p className="text-3xl font-bold text-blue-400">
                    {model.monthlyPrice} <span className="text-lg">{model.currency}</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {model.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-cyan-400">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button className="w-full" variant={model.recommended ? "default" : "outline"}>
                Get Started
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// HowItWorksSection
export function HowItWorksSection() {
  return (
    <section id="section" className="py-20 bg-background">
      <div className="container max-w-4xl">
        <h2 className="text-4xl font-bold mb-12 text-center">How It Works</h2>

        <div className="space-y-8">
          <div className="glass-panel p-8">
            <h3 className="text-2xl font-bold mb-4">For Users</h3>
            <ol className="space-y-4 list-decimal list-inside">
              <li className="text-muted-foreground">
                Connect your Stellar wallet with USDC balance
              </li>
              <li className="text-muted-foreground">
                Enter a search query or let your AI agent request one
              </li>
              <li className="text-muted-foreground">
                Review the payment amount (0.001 USDC per query)
              </li>
              <li className="text-muted-foreground">
                Approve the payment through your wallet
              </li>
              <li className="text-muted-foreground">
                Receive results instantly with on-chain confirmation
              </li>
            </ol>
          </div>

          <div className="glass-panel p-8">
            <h3 className="text-2xl font-bold mb-4">For Developers</h3>
            <ol className="space-y-4 list-decimal list-inside">
              <li className="text-muted-foreground">
                Install the x402-web-search-mcp package
              </li>
              <li className="text-muted-foreground">
                Configure your Stellar wallet and network
              </li>
              <li className="text-muted-foreground">
                Initialize the MCP server in your agent
              </li>
              <li className="text-muted-foreground">
                Call the search tool from your AI agent
              </li>
              <li className="text-muted-foreground">
                Monitor transactions and logs in real-time
              </li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

// TechSpecsSection
export function TechSpecsSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-blue-950/10">
      <div className="container max-w-4xl">
        <h2 className="text-4xl font-bold mb-12 text-center">Technical Specifications</h2>

        <div className="glass-panel p-8 space-y-6">
          {Object.entries(mockTechSpecs).map(([key, value]) => (
            <div key={key}>
              <p className="text-sm text-muted-foreground mb-2 capitalize">
                {key.replace(/([A-Z])/g, " $1")}
              </p>
              {Array.isArray(value) ? (
                <div className="flex flex-wrap gap-2">
                  {value.map((item, idx) => (
                    <span key={idx} className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm">
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-bold text-lg">{value}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// InstallationSection
export function InstallationSection() {
  const [copied, setCopied] = useState<number | null>(null);

  return (
    <section id="install" className="py-20 bg-background">
      <div className="container max-w-4xl">
        <h2 className="text-4xl font-bold mb-12 text-center">Installation & Setup</h2>

        <div className="space-y-6">
          {mockInstallationSteps.map((step) => (
            <div key={step.step} className="glass-panel p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold flex-shrink-0">
                  {step.step}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>

              <div className="relative bg-card/50 border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => {
                    setCopied(step.step);
                    setTimeout(() => setCopied(null), 2000);
                  }}
                  className="absolute top-3 right-3 p-2 hover:bg-secondary rounded transition-colors"
                >
                  {copied === step.step ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <pre className="p-4 font-mono text-sm text-foreground overflow-x-auto">
                  <code>{step.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// FAQSection
export function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 bg-gradient-to-b from-background to-card/20">
      <div className="container max-w-4xl">
        <h2 className="text-4xl font-bold mb-12 text-center">Frequently Asked Questions</h2>

        <div className="space-y-4">
          {mockFAQ.map((item, idx) => (
            <div key={idx} className="glass-panel overflow-hidden">
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full p-6 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              >
                <h3 className="font-bold text-left">{item.question}</h3>
                <ChevronDown
                  size={20}
                  className={`flex-shrink-0 transition-transform ${
                    openIdx === idx ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIdx === idx && (
                <div className="px-6 pb-6 text-muted-foreground border-t border-border/50">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// RoadmapSection
export function RoadmapSection() {
  return (
    <section id="roadmap" className="py-20 bg-background">
      <div className="container max-w-4xl">
        <h2 className="text-4xl font-bold mb-12 text-center">Product Roadmap</h2>

        <div className="space-y-8">
          {mockRoadmap.map((roadmapItem, idx) => (
            <div key={idx} className="glass-panel p-8 border-l-4 border-blue-500">
              <h3 className="text-2xl font-bold mb-4">{roadmapItem.quarter}</h3>
              <ul className="space-y-2">
                {roadmapItem.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-center gap-3 text-muted-foreground">
                    <span className="text-cyan-400">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-4 capitalize">
                Status: {roadmapItem.status}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ResourcesSection
export function ResourcesSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-blue-950/10">
      <div className="container max-w-4xl">
        <h2 className="text-4xl font-bold mb-12 text-center">Resources & Links</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockResources.map((resource, idx) => (
            <a
              key={idx}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-panel p-6 hover:border-cyan-500/50 transition-all duration-300 group"
            >
              <h3 className="font-bold mb-2 group-hover:text-cyan-400 transition-colors">
                {resource.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{resource.description}</p>
              <p className="text-xs text-blue-400">→ Visit Resource</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// FooterSection
export function FooterSection() {
  return (
    <footer className="py-12 bg-card/50 border-t border-border/40">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Developers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">GitHub</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Community</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Discord</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2026 StellarHacks Agents. Built on Stellar with x402 payments.</p>
        </div>
      </div>
    </footer>
  );
}
