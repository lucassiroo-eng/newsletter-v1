import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import type { Agent, TimeBlock } from '@/types/models';
import { ALL_TIME_BLOCKS } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search, X, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

function AgentForm({ agent, onSave, onCancel }: { agent?: Agent; onSave: (a: Agent) => void; onCancel: () => void }) {
  const [nombre, setNombre] = useState(agent?.nombre || '');
  const [horas, setHoras] = useState(agent?.horas_maximas_semanales || 40);
  const [bloques, setBloques] = useState<TimeBlock[]>(agent?.bloques_horarios || []);

  const toggle = (b: TimeBlock) => setBloques((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]);

  const handleSubmit = () => {
    if (!nombre.trim()) return;
    onSave({
      id: agent?.id || crypto.randomUUID(),
      nombre: nombre.trim(),
      horas_maximas_semanales: horas,
      bloques_horarios: bloques,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground">Nombre</label>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del agente" />
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground">Horas Máx. Semanales</label>
        <Input type="number" value={horas} onChange={(e) => setHoras(Number(e.target.value))} />
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">Bloques Horarios</label>
        <div className="flex gap-2">
          {ALL_TIME_BLOCKS.map((b) => (
            <button
              key={b}
              onClick={() => toggle(b)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium border transition-colors",
                bloques.includes(b)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-border hover:border-primary"
              )}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSubmit}>{agent ? 'Guardar' : 'Crear'}</Button>
      </div>
    </div>
  );
}

const BLOCK_COLORS: Record<string, string> = {
  '9 a 2': 'bg-primary/15 text-primary border-primary/30',
  '3 a 5': 'bg-warning/15 text-warning border-warning/30',
  '3 a 6': 'bg-success/15 text-success border-success/30',
};

export default function AgentsPage() {
  const { agents, skills, planningCells, addAgent, updateAgent, deleteAgent } = useAppStore();
  const [editing, setEditing] = useState<Agent | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return agents;
    const q = search.toLowerCase();
    return agents.filter((a) => a.nombre.toLowerCase().includes(q) || a.id.toLowerCase().includes(q));
  }, [agents, search]);

  const getAgentStats = (agentId: string) => {
    const agentSkills = skills.filter((s) => s.agent_id === agentId);
    const coordCampaigns = agentSkills.filter((s) => s.rol === 'Coordinadora').length;
    const totalCampaigns = agentSkills.length;
    const assignedHours = planningCells.filter((p) => p.agent_id === agentId).reduce((s, p) => s + p.horas, 0);
    return { coordCampaigns, totalCampaigns, assignedHours };
  };

  const totalCapacity = agents.reduce((s, a) => s + a.horas_maximas_semanales, 0);
  const totalAssigned = planningCells.reduce((s, p) => s + p.horas, 0);

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Agentes</h1>
          <p className="text-sm text-muted-foreground">{agents.length} agentes · {totalCapacity}h capacidad total · {totalAssigned}h asignadas</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="w-4 h-4" /> Nuevo Agente</Button>
      </div>

      {/* Search */}
      <div className="relative max-w-[300px] mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar agente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-2.5"><X className="h-4 w-4 text-muted-foreground" /></button>}
      </div>

      {/* Agent cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((a) => {
          const stats = getAgentStats(a.id);
          const usagePct = a.horas_maximas_semanales > 0 ? Math.round((stats.assignedHours / a.horas_maximas_semanales) * 100) : 0;
          const isOverloaded = usagePct > 100;
          const isFull = usagePct >= 90 && usagePct <= 100;
          return (
            <div key={a.id} className={cn(
              "bg-card border rounded-lg p-3 transition-all hover:shadow-md group",
              isOverloaded && "border-destructive/50 bg-destructive/5",
              isFull && "border-success/50 bg-success/5"
            )}>
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold text-sm">{a.nombre}</div>
                  <div className="text-[10px] text-muted-foreground font-mono-nums">{a.id}</div>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditing(a)} className="p-1 rounded hover:bg-muted"><Pencil className="w-3 h-3" /></button>
                  <button onClick={() => deleteAgent(a.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>

              {/* Capacity bar */}
              <div className="mb-2">
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-muted-foreground">Capacidad</span>
                  <span className={cn("font-mono-nums font-bold", isOverloaded ? "text-destructive" : isFull ? "text-success" : "text-foreground")}>
                    {stats.assignedHours}h / {a.horas_maximas_semanales}h
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", isOverloaded ? "bg-destructive" : isFull ? "bg-success" : "bg-primary")}
                    style={{ width: `${Math.min(usagePct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Stats row */}
              <div className="flex gap-2 text-[10px]">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="w-3 h-3" />
                  {stats.totalCampaigns} camp.
                </div>
                {stats.coordCampaigns > 0 && (
                  <div className="flex items-center gap-0.5 text-warning">
                    👑 {stats.coordCampaigns} coord.
                  </div>
                )}
              </div>

              {/* Time blocks */}
              <div className="flex gap-1 mt-2">
                {a.bloques_horarios.map((b) => (
                  <span key={b} className={cn("px-1.5 py-0.5 rounded text-[9px] font-medium border", BLOCK_COLORS[b] || "bg-muted text-muted-foreground border-border")}>
                    {b}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-muted-foreground py-16">
          {search ? 'No se encontraron agentes.' : 'No hay agentes. Crea el primero.'}
        </div>
      )}

      <Dialog open={creating || !!editing} onOpenChange={() => { setCreating(false); setEditing(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar Agente' : 'Nuevo Agente'}</DialogTitle></DialogHeader>
          <AgentForm
            agent={editing || undefined}
            onSave={(a) => { editing ? updateAgent(a) : addAgent(a); setCreating(false); setEditing(null); }}
            onCancel={() => { setCreating(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
