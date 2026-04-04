import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import type { Agent, TimeBlock, DayOfWeek, ExperienceLevel } from '@/types/models';
import { ALL_DAYS, ALL_TIME_BLOCKS, DAY_LABELS, TIME_BLOCK_LABELS, TIME_BLOCK_HOURS, calcWeeklyHours, createDefaultSchedule } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search, X, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

function ScheduleEditor({ horario, onChange }: { horario: Record<DayOfWeek, TimeBlock[]>; onChange: (h: Record<DayOfWeek, TimeBlock[]>) => void }) {
  const toggle = (day: DayOfWeek, block: TimeBlock) => {
    const current = horario[day] || [];
    let updated: TimeBlock[];
    if (current.includes(block)) {
      updated = current.filter(b => b !== block);
    } else {
      // If it's afternoon, remove the other afternoon block
      if (block === '15-17' || block === '15-18') {
        updated = [...current.filter(b => b !== '15-17' && b !== '15-18'), block];
      } else {
        updated = [...current, block];
      }
    }
    onChange({ ...horario, [day]: updated });
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-muted/50">
            <th className="p-1.5 text-left font-medium">Bloque</th>
            {ALL_DAYS.map(d => <th key={d} className="p-1.5 text-center font-medium">{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {ALL_TIME_BLOCKS.map(block => (
            <tr key={block} className="border-t">
              <td className="p-1.5 font-medium text-muted-foreground">{TIME_BLOCK_LABELS[block]}</td>
              {ALL_DAYS.map(day => {
                const active = (horario[day] || []).includes(block);
                return (
                  <td key={day} className="p-0.5 text-center">
                    <button onClick={() => toggle(day, block)}
                      className={cn("w-8 h-6 rounded text-[10px] font-bold transition-colors",
                        active ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted")}>
                      {active ? TIME_BLOCK_HOURS[block] + 'h' : '—'}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AgentForm({ agent, onSave, onCancel }: { agent?: Agent; onSave: (a: Agent) => void; onCancel: () => void }) {
  const [nombre, setNombre] = useState(agent?.nombre || '');
  const [horario, setHorario] = useState<Record<DayOfWeek, TimeBlock[]>>(agent?.horario || createDefaultSchedule(['9-14']));
  const [idiomas, setIdiomas] = useState(agent?.idiomas.join(', ') || 'Español');
  const [nivel, setNivel] = useState<ExperienceLevel>(agent?.nivel || 'senior');

  const weeklyHours = calcWeeklyHours(horario);

  const handleSubmit = () => {
    if (!nombre.trim()) return;
    onSave({
      id: agent?.id || crypto.randomUUID(),
      nombre: nombre.trim(),
      horario,
      horas_maximas_semanales: weeklyHours,
      idiomas: idiomas.split(',').map(s => s.trim()).filter(Boolean),
      nivel,
    });
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Nombre</label>
          <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del agente" />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Nivel</label>
          <Select value={nivel} onValueChange={v => setNivel(v as ExperienceLevel)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="junior">Junior</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground">Idiomas (separados por coma)</label>
        <Input value={idiomas} onChange={e => setIdiomas(e.target.value)} placeholder="Español, Inglés, Francés" />
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">
          Horario semanal — <span className="text-primary font-bold">{weeklyHours}h/semana</span>
        </label>
        <ScheduleEditor horario={horario} onChange={setHorario} />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSubmit}>{agent ? 'Guardar' : 'Crear'}</Button>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const { agents, skills, planningCells, addAgent, updateAgent, deleteAgent } = useAppStore();
  const [editing, setEditing] = useState<Agent | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return agents;
    const q = search.toLowerCase();
    return agents.filter(a => a.nombre.toLowerCase().includes(q) || a.id.toLowerCase().includes(q));
  }, [agents, search]);

  const getAgentStats = (agentId: string) => {
    const agentSkills = skills.filter(s => s.agent_id === agentId);
    return {
      coordCampaigns: agentSkills.filter(s => s.rol === 'Coordinadora').length,
      totalCampaigns: agentSkills.length,
      assignedHours: planningCells.filter(p => p.agent_id === agentId).reduce((s, p) => s + p.horas, 0),
    };
  };

  const totalCapacity = agents.reduce((s, a) => s + a.horas_maximas_semanales, 0);

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Agentes</h1>
          <p className="text-sm text-muted-foreground">{agents.length} agentes · {totalCapacity}h capacidad semanal</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="w-4 h-4" /> Nuevo Agente</Button>
      </div>

      <div className="relative max-w-[300px] mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar agente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-2.5"><X className="h-4 w-4 text-muted-foreground" /></button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map(a => {
          const stats = getAgentStats(a.id);
          return (
            <div key={a.id} className="bg-card border rounded-lg p-3 hover:shadow-md group transition-all">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold text-sm">{a.nombre}</div>
                  <div className="flex gap-1 mt-0.5">
                    <span className={cn("text-[9px] px-1 py-0.5 rounded font-medium",
                      a.nivel === 'senior' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                      {a.nivel}
                    </span>
                    {a.idiomas.map(i => (
                      <span key={i} className="text-[9px] px-1 py-0.5 rounded bg-accent text-accent-foreground">{i}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditing(a)} className="p-1 rounded hover:bg-muted"><Pencil className="w-3 h-3" /></button>
                  <button onClick={() => deleteAgent(a.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>

              <div className="text-xs font-mono-nums text-muted-foreground mb-1">
                <span className="font-bold text-foreground">{a.horas_maximas_semanales}h</span>/semana
              </div>

              <div className="flex gap-2 text-[10px]">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="w-3 h-3" /> {stats.totalCampaigns} camp.
                </div>
                {stats.coordCampaigns > 0 && (
                  <div className="flex items-center gap-0.5 text-warning">👑 {stats.coordCampaigns} coord.</div>
                )}
              </div>

              {/* Mini schedule */}
              <div className="flex gap-0.5 mt-2">
                {ALL_DAYS.map(d => {
                  const blocks = a.horario[d] || [];
                  const hours = blocks.reduce((s, b) => s + TIME_BLOCK_HOURS[b], 0);
                  return (
                    <div key={d} className="text-center">
                      <div className="text-[8px] text-muted-foreground">{d}</div>
                      <div className={cn("text-[9px] font-mono-nums font-bold px-1 rounded",
                        hours > 0 ? "bg-primary/10 text-primary" : "text-muted-foreground/30")}>{hours || '—'}</div>
                    </div>
                  );
                })}
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Editar Agente' : 'Nuevo Agente'}</DialogTitle></DialogHeader>
          <AgentForm agent={editing || undefined}
            onSave={a => { editing ? updateAgent(a) : addAgent(a); setCreating(false); setEditing(null); }}
            onCancel={() => { setCreating(false); setEditing(null); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
