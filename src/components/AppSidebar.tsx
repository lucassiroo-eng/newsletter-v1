import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Users, Target, Grid3X3, Upload, LayoutDashboard, ChevronLeft, ChevronRight, Calendar, FileDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const sections = [
  {
    label: 'Setup',
    links: [
      { to: '/agentes', label: 'Agentes', icon: Users },
      { to: '/campanas', label: 'Campañas', icon: Target },
      { to: '/skills', label: 'Skills & Roles', icon: Grid3X3 },
    ],
  },
  {
    label: 'Planificación',
    links: [
      { to: '/', label: 'Vista Anual', icon: Calendar },
      { to: '/importar', label: 'Carga CRM', icon: Upload },
      { to: '/puzzle', label: 'El Puzzle', icon: LayoutDashboard },
      { to: '/exportar', label: 'Exportar CRM', icon: FileDown },
    ],
  },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside className={cn(
      "flex flex-col h-screen bg-nav-bg text-nav-fg transition-all duration-200 shrink-0",
      collapsed ? "w-16" : "w-56"
    )}>
      <div className="flex items-center justify-between px-4 h-14 border-b border-nav-hover">
        {!collapsed && (
          <div>
            <span className="font-bold text-nav-active text-base tracking-tight">ShiftPlan</span>
            <span className="block text-[9px] text-nav-fg/60 -mt-0.5">Pivote Marketing</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded hover:bg-nav-hover transition-colors ml-auto">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {sections.map(section => (
          <div key={section.label} className="mb-4">
            {!collapsed && (
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-nav-fg/50">
                {section.label}
              </div>
            )}
            <div className="space-y-0.5">
              {section.links.map(l => (
                <NavLink key={l.to} to={l.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    location.pathname === l.to
                      ? "bg-nav-active/15 text-nav-active"
                      : "text-nav-fg hover:bg-nav-hover hover:text-nav-active"
                  )}>
                  <l.icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{l.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
