import { Link, useLocation, Switch, Route } from "wouter";
import { 
  LayoutDashboard,
  ShieldCheck,
  Boxes,
  Package,
  Server,
  Package as Package2,
  HardDrive,
  FileText,
  Zap,
  LogOut,
  User,
  TestTube
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import OverviewDashboard from "./overview-dashboard";
import SmartModulesManager from "./smart-modules-manager";
import SmartDomainEcosystems from "./smart-domain-ecosystems";
import SmartNodesManager from "./smart-nodes-manager";
import ConfigurableEquipmentManager from "./smart-equipment-manager";
import SmartLedgerViewer from "./smart-ledger-viewer";

const infrastructureTabs = [
  { name: "Overview", href: "/", icon: LayoutDashboard, color: "text-yellow-500" },
  { name: "Nodes/Hubs", href: "/nodes", icon: Server, color: "text-orange-500" },
  { name: "Modules", href: "/modules", icon: Boxes, color: "text-purple-500" },
  { name: "Domain Ecosystems", href: "/domain-ecosystems", icon: Package, color: "text-red-500" },
  { name: "Equipment", href: "/equipment", icon: HardDrive, color: "text-blue-500" },
  { name: "Ledger", href: "/ledger", icon: FileText, color: "text-emerald-500" },
];

export function InfrastructureLayout() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-slate-950">
      <div className="flex-1 flex flex-col">
        {/* Main Header */}
        <header className="bg-slate-900 border-b border-slate-700">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Zap className="text-white text-sm" />
                </div>
                <h1 className="text-xl font-bold text-white">Command & Control Center</h1>
              </div>
              <div className="flex items-center space-x-4">
                {user && (
                  <div className="flex items-center space-x-3 text-sm text-slate-300">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{user.username}</span>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        {user.role}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={logout}
                      className="text-slate-300 hover:text-white"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                )}
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Infrastructure Navigation Tabs */}
        <nav className="bg-slate-950 px-6 py-4">
          <div className="flex justify-between items-center bg-card backdrop-blur-sm rounded-full p-1 border border-border w-full">
            {infrastructureTabs.map((tab) => {
              const isActive = location === tab.href;
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={cn(
                    "flex items-center space-x-1 px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap flex-1 justify-center",
                    isActive
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                  )}
                >
                  <tab.icon className={cn("w-4 h-4", isActive ? "text-white" : tab.color)} />
                  <span>{tab.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Content Area with Router */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <div className="p-6 pb-12">
            <Switch>
              <Route path="/" component={OverviewDashboard} />
              <Route path="/nodes" component={SmartNodesManager} />              
              <Route path="/modules" component={SmartModulesManager} />
              <Route path="/domain-ecosystems" component={SmartDomainEcosystems} />
              <Route path="/equipment" component={ConfigurableEquipmentManager} />
              <Route path="/ledger" component={SmartLedgerViewer} />
            </Switch>
          </div>
        </main>
      </div>
    </div>
  );
}
