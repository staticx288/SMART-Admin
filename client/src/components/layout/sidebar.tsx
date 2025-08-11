import { Link, useLocation } from "wouter";
import { 
  Gauge, 
  Box, 
  Server, 
  Rocket, 
  TrendingUp, 
  FileText, 
  User,
  Zap
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navigation = [
  { name: "Dashboard", href: "/", icon: Gauge },
  { name: "Module Library", href: "/modules", icon: Box },
  { name: "Node Management", href: "/nodes", icon: Server },
  { name: "Deployments", href: "/deployments", icon: Rocket },
  { name: "Monitoring", href: "/monitoring", icon: TrendingUp },
  { name: "Logs", href: "/logs", icon: FileText },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">PulseBusiness</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Deployment Admin</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Menu */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center">
            <User className="text-slate-600 dark:text-slate-300 text-sm" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900 dark:text-white">Admin User</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">admin@pulse.local</p>
          </div>
        </div>
      </div>
    </div>
  );
}
