import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import type { SkillPriority, AgentRole } from '@/types/models';
import { ALL_AGENT_ROLES } from '@/types/models';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, X } from 'lucide-react';

const PRIORITY_LABELS: Record<number, string> = { 1: 'P1', 2: 'P2', 3: 'P3' };
const PRIORITY_COLORS: Record<number, string> = {
  1: 'bg-priority-high text-primary-foreground',
  2: 'bg-priority-medium text-primary-foreground',
  3: 'bg-priority-low text-primary-foreground',
};
const ROLE_ICONS: Record<string, string> = {
  'Coordinadora': '👑',
  'Agente de Apoyo': '🔧',
  'Agente de Cierre': '🎯',
};

type FilterMode = 'all' | 'assigned' | 'unassigned' | 'coordinadora';

export default function SkillsPage() {
  const { agents, campaigns, skills, setSkill, removeSkill } = useAppStore();
  const [agentSearch, setAgentSearch] = useState('');
  const [campaignSearch, setCampaignSearch] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const getSkill = (aId: string, cId: string) => skills.find((s) => s.agent_id === aId && s.campaign_id === cId);

  const filteredAgents = useMemo(() => {
    let result = agents;
    if (agentSearch) {
      const q = agentSearch.toLowerCase();
      result = result.filter((a) => a.nombre.toLowerCase().includes(q) || a.id.toLowerCase().includes(q));
    }
    if (filterMode === 'coordinadora') {
      const coordAgentIds = new Set(skills.filter((s) => s.rol === 'Coordinadora').map((s) => s.agent_id));
      result = result.filter((a) => coordAgentIds.has(a.id));
    }
    return result;
  }, [agents, agentSearch, filterMode, skills]);

  const filteredCampaigns = useMemo(() => {
    let result = campaigns;
    if (campaignSearch) {
      const q = campaignSearch.toLowerCase();
      result = result.filter((c) => c.nombre.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
    }
    if (filterMode === 'assigned') {
      const assignedCampaignIds = new Set(skills.map((s) => s.campaign_id));
      result = result.filter((c) => assignedCampaignIds.has(c.id));
    } else if (filterMode === 'unassigned') {
      const assignedCampaignIds = new Set(skills.map((s) => s.campaign_id));
      result = result.filter((c) => !assignedCampaignIds.has(c.id));
    }
    return result;
  }, [campaigns, campaignSearch, filterMode, skills]);

  const quickCycle = (aId: string, cId: string) => {
    const current = getSkill(aId, cId);
    if (!current) {
      setSkill({ agent_id: aId, campaign_id: cId, prioridad: 1, rol: 'Agente de Apoyo' });
    } else if (current.prioridad < 3) {
      setSkill({ ...current, prioridad: (current.prioridad + 1) as SkillPriority });
    } else {
      removeSkill(aId, cId);
    }
  };

  // Stats
  const totalAssignments = skills.length;
  const coordCount = skills.filter((s) => s.rol === 'Coordinadora').length;
  const p1Count = skills.filter((s) => s.prioridad === 1).length;
  const p2Count = skills.filter((s) => s.prioridad === 2).length;
  const p3Count = skills.filter((s) => s.prioridad === 3).length;

  if (agents.length === 0 || campaigns.length === 0) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Primero crea agentes y campañas para gestionar la matriz de skills.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Matriz de Skills, Supervisión y Prioridades</h1>
        <p className="text-sm text-muted-foreground">
          Clic izquierdo para cambiar prioridad (P1→P2→P3→×). Shift+clic para cambiar rol.
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs">
        <span className="px-2.5 py-1 rounded-md bg-muted font-medium">{totalAssignments} asignaciones</span>
        <span className="px-2.5 py-1 rounded-md bg-muted font-medium">👑 {coordCount} coord.</span>
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-priority-high/10 text-destructive font-semibold"><span className="w-2 h-2 rounded-full bg-priority-high" /> P1: {p1Count}</span>
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-priority-medium/10 text-warning font-semibold"><span className="w-2 h-2 rounded-full bg-priority-medium" /> P2: {p2Count}</span>
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-priority-low/10 text-primary font-semibold"><span className="w-2 h-2 rounded-full bg-priority-low" /> P3: {p3Count}</span>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar agente..."
            value={agentSearch}
            onChange={(e) => setAgentSearch(e.target.value)}
            className="pl-9 h-9"
          />
          {agentSearch && (
            <button onClick={() => setAgentSearch('')} className="absolute right-2.5 top-2.5">
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar campaña..."
            value={campaignSearch}
            onChange={(e) => setCampaignSearch(e.target.value)}
            className="pl-9 h-9"
          />
          {campaignSearch && (
            <button onClick={() => setCampaignSearch('')} className="absolute right-2.5 top-2.5">
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {([
            ['all', 'Todas'],
            ['assigned', 'Con skill'],
            ['unassigned', 'Sin skill'],
            ['coordinadora', 'Coordinadoras'],
          ] as [FilterMode, string][]).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                filterMode === mode
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-muted-foreground mb-2">
        Mostrando {filteredAgents.length} agentes × {filteredCampaigns.length} campañas
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-auto max-h-[calc(100vh-320px)]">
        <table className="text-sm border-collapse">
          <thead className="sticky top-0 z-20">
            <tr>
              <th className="p-2 text-left font-semibold border-b border-r bg-muted sticky left-0 z-30 min-w-[120px] text-xs">Agente</th>
              {filteredCampaigns.map((c) => (
                <th key={c.id} className="p-1 text-center font-semibold border-b bg-muted min-w-[56px]">
                  <div className="text-[9px] leading-tight truncate max-w-[56px]" title={c.nombre}>
                    {c.nombre.length > 12 ? c.nombre.slice(0, 12) + '…' : c.nombre}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAgents.map((a) => (
              <tr key={a.id} className="border-b last:border-0 hover:bg-muted/10">
                <td className="p-1.5 font-medium border-r sticky left-0 bg-card z-10 text-xs whitespace-nowrap">
                  {a.nombre}
                  <span className="text-muted-foreground ml-1 font-mono-nums text-[10px]">{a.horas_maximas_semanales}h</span>
                </td>
                {filteredCampaigns.map((c) => {
                  const skill = getSkill(a.id, c.id);
                  return (
                    <td key={c.id} className="p-0.5 text-center">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            onClick={(e) => {
                              if (!e.shiftKey) {
                                quickCycle(a.id, c.id);
                                e.preventDefault();
                              }
                            }}
                            className={cn(
                              "w-full py-0.5 px-0.5 rounded text-[10px] font-semibold transition-all leading-tight min-h-[22px]",
                              skill ? PRIORITY_COLORS[skill.prioridad] : "bg-transparent text-muted-foreground/30 hover:bg-muted/50"
                            )}
                          >
                            {skill ? (
                              <span>{ROLE_ICONS[skill.rol]} {PRIORITY_LABELS[skill.prioridad]}</span>
                            ) : '·'}
                          </button>
                        </PopoverTrigger>
                        {skill && (
                          <PopoverContent className="w-48 p-2">
                            <div className="text-xs font-medium mb-2">Rol de {a.nombre}</div>
                            <Select
                              value={skill.rol}
                              onValueChange={(v) => setSkill({ ...skill, rol: v as AgentRole })}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ALL_AGENT_ROLES.map((r) => (
                                  <SelectItem key={r} value={r} className="text-xs">{ROLE_ICONS[r]} {r}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full mt-2 text-xs text-destructive"
                              onClick={() => removeSkill(a.id, c.id)}
                            >
                              Quitar skill
                            </Button>
                          </PopoverContent>
                        )}
                      </Popover>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
