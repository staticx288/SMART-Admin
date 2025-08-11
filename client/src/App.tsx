import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import Dashboard from "@/pages/dashboard";
import Modules from "@/pages/modules";
import Nodes from "@/pages/nodes";
import Deployments from "@/pages/deployments";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/modules" component={Modules} />
      <Route path="/nodes" component={Nodes} />
      <Route path="/deployments" component={Deployments} />
      <Route path="/monitoring" component={() => <div className="p-6">Monitoring page - Coming soon</div>} />
      <Route path="/logs" component={() => <div className="p-6">Logs page - Coming soon</div>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="pulse-ui-theme">
        <TooltipProvider>
          <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
            <Sidebar />
            <Router />
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
