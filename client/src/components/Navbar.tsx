import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useLocation } from "wouter";

interface NavbarProps {
  walletConnected: boolean;
  onWalletToggle: (connected: boolean) => void;
}

export default function Navbar({ walletConnected, onWalletToggle }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Search", href: "/search" },
    { label: "Services", href: "/services" },
    { label: "Docs", href: "/docs" },
    { label: "Settings", href: "/settings" },
  ];

  const isActive = (href: string) => location === href;

  return (
    <>
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 h-1 bg-gradient-to-r from-pink-500 via-cyan-400 to-pink-600 z-50" />

      <nav className="sticky top-0 z-40 w-full border-b border-pink-500/20 bg-background/80 backdrop-blur-md shadow-lg shadow-pink-500/10">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <a href="/" onClick={() => setLocation("/")} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="text-2xl font-bold text-accent">⚡ StellarHacks</div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  setLocation(item.href);
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? "bg-accent/20 text-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => onWalletToggle(!walletConnected)}
              className={walletConnected ? "bg-green-600 hover:bg-green-700" : "bg-accent hover:bg-accent/90"}
            >
              {walletConnected ? "✓ Connected" : "Connect Wallet"}
            </Button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-accent/10 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur-md">
            <div className="container py-4 space-y-2">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    setLocation(item.href);
                    setMobileMenuOpen(false);
                  }}
                  className={`block px-4 py-2 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? "bg-accent/20 text-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
