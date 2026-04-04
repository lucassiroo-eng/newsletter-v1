import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import { autoAssign } from '@/lib/autoAssign';
import { SEED_DATA } from '@/data/seedData';
import { Button } from '@/components/ui/button';
import { Zap, Download, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';

export default function PlanningPage() {
  const { agents, campaigns, skills, weeklyData, planningCells, setPlanningCells, updatePlanningCell, loadSeed } = useAppStore();
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const balances = useMemo(() => {
    const map = new Map<string, { objetivo: number; realizado: number; planificado: number; asignado: number; balance: number }>();
    campaigns.forEach((c) => {
      const wd = weeklyData.find((w) => w.campaign_id === c.id);
      const realizado = wd?.horas_realizadas || 0;
      const planificado = wd?.horas_planificadas || 0;
      const asignado = planningCells.filter((p) => p.campaign_id === c.id).reduce((s, p) => s + p.horas, 0);
      map.set(c.id, { objetivo: c.objetivo_horas, realizado, planificado, asignado, balance: c.objetivo_horas - realizado - planificado });
    });
    return map;
  }, [campaigns, weeklyData, planningCells]);

  const agentTotals = useMemo(() => {
    const map = new Map<string, number>();
    agents.forEach((a) => {
      const total = planningCells.filter((p) => p.agent_id === a.id).reduce((s, p) => s + p.horas, 0);
      map.set(a.id, total);
    });
    return map;
  }, [agents, planningCells]);

  const getCellHours = (cId: string, aId: string) => planningCells.find((p) => p.campaign_id === cId && p.agent_id === aId)?.horas || 0;
  const cellKey = (cId: string, aId: string) => `${cId}::${aId}`;

  const handleAutoAssign = () => {
    const result = autoAssign({ agents, campaigns, skills, weeklyData });
    setPlanningCells(result);
  };

  const handleExport = () => {
    const rows = campaigns.map((c) => {
      const row: Record<string, string | number> = { Campaña: c.nombre };
      agents.forEach((a) => { row[a.nombre] = getCellHours(c.id, a.id); });
      return row;
    });
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planificacion_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startEdit = (cId: string, aId: string) => {
    setEditingCell(cellKey(cId, aId));
    setEditValue(String(getCellHours(cId, aId) || ''));
  };

  const commitEdit = (cId: string, aId: string) => {
    const val = parseFloat(editValue) || 0;
    updatePlanningCell({ campaign_id: cId, agent_id: aId, horas: val });
    setEditingCell(null);
  };

  // Filter agents that have at least one skill
  const relevantAgents = agents.filter((a) => skills.some((s) => s.agent_id === a.id));
  const displayAgents = relevantAgents.length > 0 ? relevantAgents : agents;

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Planificación</h1>
          <p className="text-sm text-muted-foreground">Asigna horas por agente y campaña. Haz clic en una celda para editar.</p>
        </div>
        <div className="flex gap-2">
          {campaigns.length === 0 && (
            <Button variant="outline" onClick={() => loadSeed(SEED_DATA)} className="gap-2">
              <Database className="w-4 h-4" /> Cargar Datos Excel
            </Button>
          )}
          <Button onClick={handleAutoAssign} className="gap-2">
            <Zap className="w-4 h-4" /> Auto-Asignar
          </Button>
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">Crea campañas y agentes para empezar a planificar.</div>
      ) : (
        <div className="bg-card rounded-lg border shadow-sm overflow-auto">
          <table className="text-sm border-collapse w-full">
            <thead>
              <tr>
                <th className="p-2 text-left font-semibold border-b border-r bg-muted/50 sticky left-0 z-20 min-w-[180px]">Campaña</th>
                <th className="p-2 text-center font-semibold border-b border-r bg-muted/50 min-w-[70px]">Objetivo</th>
                <th className="p-2 text-center font-semibold border-b border-r bg-muted/50 min-w-[70px]">Balance</th>
                {displayAgents.map((a) => (
                  <th key={a.id} className="p-2 text-center font-semibold border-b bg-muted/50 min-w-[80px]">
                    <div className="text-xs leading-tight">{a.nombre}</div>
                    <div className={cn("text-[10px] font-mono-nums mt-0.5", (agentTotals.get(a.id) || 0) > a.horas_maximas_semanales ? "text-destructive" : "text-muted-foreground")}>
                      {agentTotals.get(a.id) || 0}/{a.horas_maximas_semanales}h
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const b = balances.get(c.id)!;
                const assigned = b.asignado;
                const remaining = b.balance - assigned;
                return (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-2 font-medium border-r sticky left-0 bg-card z-10">
                      {c.nombre}
                      {c.es_sc4l && <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded bg-warning text-warning-foreground font-semibold">SC4L</span>}
                    </td>
                    <td className="p-2 text-center border-r font-mono-nums">{b.objetivo}h</td>
                    <td className={cn("p-2 text-center border-r font-mono-nums font-semibold", remaining > 0 ? "text-destructive" : remaining === 0 ? "text-success" : "text-muted-foreground")}>
                      {remaining > 0 ? `${remaining}h` : remaining === 0 ? '✓' : `+${Math.abs(remaining)}h`}
                    </td>
                    {displayAgents.map((a) => {
                      const hours = getCellHours(c.id, a.id);
                      const isEditing = editingCell === cellKey(c.id, a.id);
                      const hasSkill = skills.some((s) => s.agent_id === a.id && s.campaign_id === c.id);

                      return (
                        <td key={a.id} className={cn("p-0.5 text-center", !hasSkill && "bg-muted/30")}>
                          {isEditing ? (
                            <input
                              type="number"
                              className="w-full h-8 text-center text-sm font-mono-nums bg-background border rounded focus:ring-2 focus:ring-ring outline-none"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => commitEdit(c.id, a.id)}
                              onKeyDown={(e) => e.key === 'Enter' && commitEdit(c.id, a.id)}
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => startEdit(c.id, a.id)}
                              className={cn(
                                "w-full h-8 rounded text-sm font-mono-nums transition-colors",
                                hours > 0 ? "bg-primary/15 text-primary font-semibold hover:bg-primary/25" : "hover:bg-muted/50 text-muted-foreground"
                              )}
                            >
                              {hours > 0 ? hours : ''}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
