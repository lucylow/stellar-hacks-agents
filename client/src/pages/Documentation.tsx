import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, BookOpen, Zap, Copy, Check } from "lucide-react";

export default function Documentation() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const docs = [
    {
      id: 1,
      title: "Getting Started",
      description: "Learn how to set up StellarHacks Agents in your project",
      icon: BookOpen,
    },
    {
      id: 2,
      title: "API Reference",
      description: "Complete API documentation for all endpoints",
      icon: Code,
    },
    {
      id: 3,
      title: "x402 Protocol",
      description: "Understanding micropayments on Stellar",
      icon: Zap,
    },
  ];

  const codeExamples = [
    {
      id: 1,
      title: "Initialize Client",
      language: "javascript",
      code: `import { StellarHacksClient } from '@stellarhacks/client';

const client = new StellarHacksClient({
  apiKey: 'your-api-key',
  network: 'testnet'
});`,
    },
    {
      id: 2,
      title: "Execute Query",
      language: "javascript",
      code: `const result = await client.search({
  query: 'latest AI developments',
  service: 'web-search'
});

console.log(result);`,
    },
    {
      id: 3,
      title: "Connect Wallet",
      language: "javascript",
      code: `const wallet = await client.connectWallet({
  type: 'stellar',
  network: 'testnet'
});

console.log('Connected:', wallet.address);`,
    },
  ];

  const handleCopy = (id: number) => {
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar walletConnected={walletConnected} onWalletToggle={setWalletConnected} />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Documentation</h1>
          <p className="text-muted-foreground">Everything you need to integrate StellarHacks Agents</p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {docs.map((doc) => {
            const Icon = doc.icon;
            return (
              <Card key={doc.id} className="p-6 bg-card border-border hover:border-accent/50 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-bold mb-2">{doc.title}</h3>
                <p className="text-sm text-muted-foreground">{doc.description}</p>
              </Card>
            );
          })}
        </div>

        {/* Code Examples */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Code Examples</h2>
          <div className="space-y-6">
            {codeExamples.map((example) => (
              <Card key={example.id} className="p-6 bg-card border-border overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">{example.title}</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(example.id)}
                    className="gap-2"
                  >
                    {copied === example.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="bg-background p-4 rounded-lg overflow-x-auto text-sm text-muted-foreground">
                  <code>{example.code}</code>
                </pre>
              </Card>
            ))}
          </div>
        </div>

        {/* Installation Guide */}
        <Card className="p-8 bg-card border-border mb-12">
          <h2 className="text-2xl font-bold mb-6">Installation</h2>
          <div className="space-y-6">
            {[
              { step: 1, title: "Install Package", cmd: "npm install @stellarhacks/client" },
              { step: 2, title: "Import Client", cmd: "import { StellarHacksClient } from '@stellarhacks/client';" },
              { step: 3, title: "Initialize", cmd: "const client = new StellarHacksClient({ apiKey: 'your-key' });" },
              { step: 4, title: "Start Using", cmd: "const result = await client.search({ query: 'your query' });" },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent text-accent-foreground font-bold">
                    {item.step}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">{item.title}</h4>
                  <pre className="bg-background p-3 rounded text-sm text-muted-foreground overflow-x-auto">
                    <code>{item.cmd}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="p-6 bg-card border-border">
            <h3 className="font-bold mb-4">External Resources</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-accent hover:underline">→ Stellar Documentation</a>
              </li>
              <li>
                <a href="#" className="text-accent hover:underline">→ x402 Protocol Spec</a>
              </li>
              <li>
                <a href="#" className="text-accent hover:underline">→ GitHub Repository</a>
              </li>
              <li>
                <a href="#" className="text-accent hover:underline">→ Community Discord</a>
              </li>
            </ul>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-accent/20 to-primary/20 border-accent/30">
            <h3 className="font-bold mb-4">Need Help?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Can't find what you're looking for? Check our FAQ or reach out to support.
            </p>
            <Button variant="outline" className="w-full">
              Contact Support
            </Button>
          </Card>
        </div>

        {/* FAQ */}
        <Card className="p-8 bg-card border-border">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "What is x402?", a: "x402 is a micropayment protocol that enables pay-per-query functionality on Stellar." },
              { q: "How do I get an API key?", a: "Sign up on our platform and generate an API key from your dashboard." },
              { q: "What networks are supported?", a: "We support both Stellar testnet and mainnet." },
              { q: "Can I use this in production?", a: "Yes, StellarHacks is production-ready and audited." },
            ].map((item, idx) => (
              <details key={idx} className="group border-b border-border pb-4 last:border-0">
                <summary className="cursor-pointer font-semibold hover:text-accent transition-colors">
                  {item.q}
                </summary>
                <p className="text-muted-foreground mt-2">{item.a}</p>
              </details>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
