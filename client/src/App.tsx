import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StellarWalletProvider } from "@/_core/context/StellarWalletContext";
import { ReputationProvider } from "@/_core/context/ReputationContext";
import { AgentWorkflowProvider } from "@/_core/context/AgentWorkflowContext";
import { StellarAgentProvider } from "@/contexts/StellarAgentContext";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Search from "./pages/Search";
import Services from "./pages/Services";
import Documentation from "./pages/Documentation";
import Settings from "./pages/Settings";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/search"} component={Search} />
      <Route path={"/services"} component={Services} />
      <Route path={"/docs"} component={Documentation} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Toaster />
          <StellarWalletProvider>
            <ReputationProvider>
              <AgentWorkflowProvider>
                <StellarAgentProvider>
                  <Router />
                </StellarAgentProvider>
              </AgentWorkflowProvider>
            </ReputationProvider>
          </StellarWalletProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
