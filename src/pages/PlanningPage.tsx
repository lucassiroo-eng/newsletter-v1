import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import { autoAssign } from '@/lib/autoAssign';
import { getCurrentWeek, getWeekNumber, formatWeekShort, getWeekMonday, getWeekFriday, formatDateShort } from '@/lib/weekUtils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';

export default function PlanningPage() {
  const store = useAppStore();
  const { agents, campaigns, skills, weeklyPlan, planningCells, exceptions, selectedWeek, setSelectedWeek, updatePlanningCell, setPlanningCellsForWeek } = store;
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const currentWeek = getCurrentWeek();
  const weekNum = getWeekNumber(selectedWeek);

  // Campaigns needing hours this week
  const weekCampaigns = useMemo(() => {
    const targets = new Map<string, number>();
    weeklyPlan.filter(w => w.week === selectedWeek).forEach(w => targets.set(w.campaign_id, w.horas));
    return campaigns
      .filter(c => (targets.get(c.id) || 0) > 0 || planningCells.some(p => p.campaign_id === c.id && p.week === selectedWeek && p.horas > 0))
      .map(c => ({ ...c, target: targets.get(c.id) || 0 }))
      .sort((a, b) => b.target - a.target);
  }, [campaigns, weeklyPlan, planningCells, selectedWeek]);

  // Relevant agents (those with at least one skill for the week's campaigns)
  const weekCampaignIds = new Set(weekCampaigns.map(c => c.id));
  const relevantAgents = useMemo(() => {
    return agents.filter(a => skills.some(s => s.agent_id === a.id && weekCampaignIds.has(s.campaign_id)));
  }, [agents, skills, weekCampaignIds]);
  const displayAgents = relevantAgents.length > 0 ? relevantAgents : agents;

  // Agent totals for this week
  const agentTotals = useMemo(() => {
    const m = new Map<string, number>();
    agents.forEach(a => {
      const total = planningCells.filter(p => p.agent_id === a.id && p.week === selectedWeek).reduce((s, p) => s + p.horas, 0);
      m.set(a.id, total);
    });
    return m;
  }, [agents, planningCells, selectedWeek]);

  const getAgentCapacity = (aId: string) => {
    const a = agents.find(x => x.id === aId);
    if (!a) return 0;
    const exc = exceptions.find(e => e.agent_id === aId && e.semana === selectedWeek);
    return exc ? exc.horas_disponibles : a.horas_maximas_semanales;
  };

  const getCellHours = (cId: string, aId: string) =>
    planningCells.find(p => p.campaign_id === cId && p.agent_id === aId && p.week === selectedWeek)?.horas || 0;

  const getCampaignAssigned = (cId: string) =>
    planningCells.filter(p => p.campaign_id === cId && p.week === selectedWeek).reduce((s, p) => s + p.horas, 0);

  const cellKey = (cId: string, aId: string) => `${cId}::${aId}`;

  const startEdit = (cId: string, aId: string) => { setEditingCell(cellKey(cId, aId)); setEditValue(String(getCellHours(cId, aId) || '')); };
  const commitEdit = (cId: string, aId: string) => {
    updatePlanningCell({ campaign_id: cId, agent_id: aId, week: selectedWeek, horas: parseFloat(editValue) || 0 });
    setEditingCell(null);
  };

  const handleAutoAssign = () => {
    const result = autoAssign({ agents, campaigns, skills, weeklyPlan, exceptions, selectedWeek });
    setPlanningCellsForWeek(selectedWeek, result);
  };

  const handleExport = () => {
    const monday = getWeekMonday(selectedWeek);
    const friday = getWeekFriday(selectedWeek);
    const rows = planningCells
      .filter(p => p.week === selectedWeek && p.horas > 0)
      .map(p => {
        const agent = agents.find(a => a.id === p.agent_id);
        const campaign = campaigns.find(c => c.id === p.campaign_id);
        return {
          Agente: agent?.nombre || p.agent_id,
          Campaña: campaign?.nombre || p.campaign_id,
          'Fecha Inicio': formatDateShort(monday),
          'Fecha Fin': formatDateShort(friday),
          Horas: p.horas,
        };
      });
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `puzzle_S${weekNum}_${selectedWeek}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Agent campaign count
  const agentCampaignCount = useMemo(() => {
    const m = new Map<string, number>();
    displayAgents.forEach(a => {
      m.set(a.id, new Set(planningCells.filter(p => p.agent_id === a.id && p.week === selectedWeek && p.horas > 0).map(p => p.campaign_id)).size);
    });
    return m;
  }, [displayAgents, planningCells, selectedWeek]);

  // Week options (current + next 8 weeks)
  const weekOptions = useMemo(() => {
    const wks: string[] = [];
    const cNum = getWeekNumber(currentWeek);
    const yr = parseInt(currentWeek.split('-W')[0]);
    for (let i = -2; i <= 8; i++) {
      const n = cNum + i;
      if (n > 0 && n <= 52) wks.push(`${yr}-W${String(n).padStart(2, '0')}`);
    }
    return wks;
  }, [currentWeek]);

  return (
    <div className="flex-1 p-4 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold">🧩 El Puzzle — Asignación Semanal</h1>
          <p className="text-xs text-muted-foreground">Asigna agentes a campañas. Solo se muestran celdas donde el agente está formado.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={selectedWeek} onValueChange={setSelectedWeek}>
            <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {weekOptions.map(w => (
                <SelectItem key={w} value={w} className="text-xs">
                  S{getWeekNumber(w)} — {formatWeekShort(w)} {w === currentWeek ? '(actual)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleAutoAssign} className="gap-1"><Zap className="w-3 h-3" /> Auto-Asignar</Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1"><Download className="w-3 h-3" /> CSV</Button>
        </div>
      </div>

      {weekCampaigns.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          No hay campañas planificadas para la semana S{weekNum}. Planifica horas en la Vista Anual primero.
        </div>
      ) : (
        <div className="flex-1 overflow-auto border rounded-lg bg-card">
          <table className="text-[11px] border-collapse">
            <thead className="sticky top-0 z-20">
              <tr>
                <th className="p-1.5 text-left font-semibold border-b border-r bg-muted sticky left-0 z-30 min-w-[140px]">Campaña</th>
                <th className="p-1 text-center font-semibold border-b border-r bg-muted min-w-[50px]">Plan</th>
                <th className="p-1 text-center font-semibold border-b border-r bg-muted min-w-[50px]">Asign.</th>
                <th className="p-1 text-center font-semibold border-b border-r bg-muted min-w-[50px]">Balance</th>
                {displayAgents.map(a => {
                  const cap = getAgentCapacity(a.id);
                  const used = agentTotals.get(a.id) || 0;
                  const free = cap - used;
                  const campCount = agentCampaignCount.get(a.id) || 0;
                  return (
                    <th key={a.id} className="p-1 text-center font-semibold border-b bg-muted min-w-[60px]">
                      <div className="text-[10px] leading-tight">{a.nombre}</div>
                      <div className={cn("text-[9px] font-mono-nums", free < 0 ? "text-destructive" : free === 0 ? "text-muted-foreground" : "text-success")}>
                        {used}/{cap}h
                      </div>
                      <div className="text-[8px] text-muted-foreground">{campCount} camp.</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {weekCampaigns.map(c => {
                const assigned = getCampaignAssigned(c.id);
                const balance = c.target - assigned;
                const coordSkill = skills.find(s => s.campaign_id === c.id && s.rol === 'Coordinadora');
                return (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/10">
                    <td className="p-1 font-medium border-r sticky left-0 bg-card z-10 truncate max-w-[140px]" title={c.nombre}>
                      {c.nombre.length > 18 ? c.nombre.slice(0, 18) + '…' : c.nombre}
                      {c.es_sc4l && <span className="ml-1 text-[8px] px-0.5 rounded bg-warning/20 text-warning font-bold">SC4L</span>}
                    </td>
                    <td className="p-1 text-center border-r font-mono-nums font-semibold">{c.target}h</td>
                    <td className="p-1 text-center border-r font-mono-nums">{assigned}h</td>
                    <td className={cn("p-1 text-center border-r font-mono-nums font-bold",
                      balance > 0 ? "text-destructive" : balance === 0 ? "text-success" : "text-warning")}>
                      {balance > 0 ? `${balance}h` : balance === 0 ? '✓' : `+${Math.abs(balance)}h`}
                    </td>
                    {displayAgents.map(a => {
                      const hours = getCellHours(c.id, a.id);
                      const isEditing = editingCell === cellKey(c.id, a.id);
                      const hasSkill = skills.some(s => s.agent_id === a.id && s.campaign_id === c.id);
                      const isCoord = coordSkill?.agent_id === a.id;

                      if (!hasSkill) {
                        return <td key={a.id} className="p-0 text-center bg-muted/40"><div className="w-full h-6" /></td>;
                      }

                      return (
                        <td key={a.id} className={cn("p-0 text-center", isCoord && "ring-1 ring-inset ring-warning/40")}>
                          {isEditing ? (
                            <input type="number" className="w-full h-6 text-center text-[11px] font-mono-nums bg-background border rounded focus:ring-1 focus:ring-ring outline-none"
                              value={editValue} onChange={e => setEditValue(e.target.value)}
                              onBlur={() => commitEdit(c.id, a.id)}
                              onKeyDown={e => e.key === 'Enter' && commitEdit(c.id, a.id)}
                              autoFocus />
                          ) : (
                            <button onClick={() => startEdit(c.id, a.id)}
                              className={cn("w-full h-6 text-[11px] font-mono-nums transition-colors",
                                hours > 0 ? "bg-primary/10 text-primary font-semibold hover:bg-primary/20" : "hover:bg-muted/30 text-muted-foreground/30",
                                isCoord && hours > 0 && "bg-warning/10 text-warning")}>
                              {isCoord && '👑'}{hours > 0 ? hours : ''}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {/* Summary row */}
              <tr className="bg-muted/30 font-semibold">
                <td className="p-1 border-r sticky left-0 bg-muted/30 z-10">TOTAL</td>
                <td className="p-1 text-center border-r font-mono-nums">{weekCampaigns.reduce((s, c) => s + c.target, 0)}h</td>
                <td className="p-1 text-center border-r font-mono-nums">{weekCampaigns.reduce((s, c) => s + getCampaignAssigned(c.id), 0)}h</td>
                <td className="p-1 text-center border-r"></td>
                {displayAgents.map(a => {
                  const cap = getAgentCapacity(a.id);
                  const used = agentTotals.get(a.id) || 0;
                  const free = cap - used;
                  return (
                    <td key={a.id} className={cn("p-1 text-center font-mono-nums font-bold",
                      free > 0 ? "text-success" : free < 0 ? "text-destructive" : "text-muted-foreground")}>
                      {free}h
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
