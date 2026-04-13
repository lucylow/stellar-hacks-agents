import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, TrendingUp, Newspaper, CheckCircle, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Services() {
  const [walletConnected, setWalletConnected] = useState(false);

  // Fetch services from API
  const servicesQuery = trpc.services.list.useQuery();
  const services = servicesQuery.data || [];

  const iconMap: Record<string, any> = {
    "web-search": Globe,
    "market-data": TrendingUp,
    "news-feed": Newspaper,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar walletConnected={walletConnected} onWalletToggle={setWalletConnected} />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Services</h1>
          <p className="text-muted-foreground">Choose from our suite of AI-powered services</p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {servicesQuery.isLoading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">Loading services...</div>
          ) : services.length > 0 ? (
            services.map((service: any) => {
              const Icon = iconMap[service.id] || Globe;
              return (
                <Card key={service.id} className="p-6 bg-card border-border hover:border-accent/50 transition-all hover:shadow-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {service.status}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{service.description}</p>

                  <div className="mb-6 pb-6 border-b border-border">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold text-accent">${service.price}</span>
                      <span className="text-sm text-muted-foreground">per query</span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {service.rateLimit}
                    </p>
                  </div>

                  <div className="mb-6">
                    <p className="text-xs font-semibold text-muted-foreground mb-3">FEATURES</p>
                    <ul className="space-y-2">
                      {service.features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-accent" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    Get Started
                  </Button>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">No services available</div>
          )}
        </div>

        {/* Pricing Comparison */}
        <Card className="p-8 bg-card border-border mb-12">
          <h2 className="text-2xl font-bold mb-8">Pricing Models</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-background rounded-lg border border-border">
              <h3 className="font-bold mb-4">Pay-Per-Query</h3>
              <p className="text-accent font-bold text-2xl mb-4">$0.001</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ No setup fees</li>
                <li>✓ Pay as you go</li>
                <li>✓ Flexible limits</li>
              </ul>
            </div>
            <div className="p-6 bg-background rounded-lg border border-accent/50 relative">
              <div className="absolute -top-3 left-4 bg-accent text-accent-foreground px-3 py-1 text-xs font-bold rounded">
                RECOMMENDED
              </div>
              <h3 className="font-bold mb-4">Subscription</h3>
              <p className="text-accent font-bold text-2xl mb-4">$99/mo</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ 100k queries</li>
                <li>✓ Priority support</li>
                <li>✓ Custom limits</li>
              </ul>
            </div>
            <div className="p-6 bg-background rounded-lg border border-border">
              <h3 className="font-bold mb-4">Enterprise</h3>
              <p className="text-accent font-bold text-2xl mb-4">Custom</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Unlimited queries</li>
                <li>✓ Dedicated support</li>
                <li>✓ Custom SLA</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect your wallet and start using StellarHacks Agents today. First 100 queries are free!
          </p>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-6 text-lg">
            Connect Wallet
          </Button>
        </div>
      </main>
    </div>
  );
}
