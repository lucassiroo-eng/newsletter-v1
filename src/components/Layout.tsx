import { NavLink, Outlet } from "react-router-dom";
import {
  Users, Target, CalendarDays, Puzzle, Upload, Download, Database,
} from "lucide-react";
import { useAppStore } from "@/store/appStore";

const navItems = [
  { to: "/plan-anual", label: "Vista Anual", icon: CalendarDays },
  { to: "/puzzle", label: "El Puzzle", icon: Puzzle },
  { to: "/agentes", label: "Agentes", icon: Users },
  { to: "/campanas", label: "Campañas", icon: Target },
  { to: "/importar", label: "Importar CRM", icon: Upload },
  { to: "/exportar", label: "Exportar CSV", icon: Download },
];

export function Layout() {
  const { agents, campaigns } = useAppStore();
  const loadSeedData = useAppStore((s) => s.loadSeedData);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-60 bg-brand-950 text-white flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-brand-800">
          <h1 className="text-lg font-bold tracking-tight">ShiftPlan</h1>
          <p className="text-xs text-brand-300 mt-0.5">Pivote Marketing</p>
        </div>

        <nav className="flex-1 py-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-brand-800 text-white font-medium"
                    : "text-brand-300 hover:text-white hover:bg-brand-900"
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-brand-800 text-xs text-brand-400">
          <div className="flex items-center gap-2 mb-2">
            <Database size={14} />
            <span>{agents.length} agentes · {campaigns.length} campañas</span>
          </div>
          {agents.length === 0 && (
            <button
              onClick={loadSeedData}
              className="w-full py-2 bg-brand-700 hover:bg-brand-600 text-white rounded text-xs font-medium transition-colors"
            >
              Cargar datos de ejemplo
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-surface-50">
        <Outlet />
      </main>
    </div>
  );
}
