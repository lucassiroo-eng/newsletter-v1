import { useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

export default function AgentCapacityPage() {
  const { agents, planningCells, exceptions, skills, campaigns } = useAppStore();

  const currentWeek = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + 1);
    return start.toISOString().slice(0, 10);
  }, []);

  const data = useMemo(() => {
    return agents.map((a) => {
      const exception = exceptions.find((e) => e.agent_id === a.id && e.semana === currentWeek);
      const capacidadBase = a.horas_maximas_semanales;
      const capacidadReal = exception ? exception.horas_disponibles : capacidadBase;
      const asignado = planningCells
        .filter((p) => p.agent_id === a.id)
        .reduce((s, p) => s + p.horas, 0);
      const libre = capacidadReal - asignado;
      const numCampanas = new Set(planningCells.filter((p) => p.agent_id === a.id && p.horas > 0).map((p) => p.campaign_id)).size;
      const numSkills = skills.filter((s) => s.agent_id === a.id).length;

      return {
        agent: a,
        capacidadBase,
        capacidadReal,
        excepcion: exception?.motivo || null,
        asignado,
        libre,
        numCampanas,
        numSkills,
        bloques: a.bloques_horarios.join(', '),
      };
    });
  }, [agents, planningCells, exceptions, skills, currentWeek]);

  const totalCapacidad = data.reduce((s, d) => s + d.capacidadReal, 0);
  const totalAsignado = data.reduce((s, d) => s + d.asignado, 0);
  const totalLibre = data.reduce((s, d) => s + d.libre, 0);

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Capacidad de Agentes</h1>
        <p className="text-sm text-muted-foreground">Horas disponibles por agente para la semana actual. Refleja excepciones (vacaciones, permisos).</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-xs text-muted-foreground font-medium uppercase">Capacidad Total</div>
          <div className="text-2xl font-bold font-mono-nums mt-1">{totalCapacidad}h</div>
          <div className="text-xs text-muted-foreground">{agents.length} agentes activos</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-xs text-muted-foreground font-medium uppercase">Horas Asignadas</div>
          <div className="text-2xl font-bold font-mono-nums mt-1">{totalAsignado}h</div>
          <div className="text-xs text-muted-foreground">{totalCapacidad > 0 ? `${Math.round((totalAsignado / totalCapacidad) * 100)}% ocupación` : '—'}</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-xs text-muted-foreground font-medium uppercase">Horas Libres</div>
          <div className={cn("text-2xl font-bold font-mono-nums mt-1", totalLibre > 0 ? "text-success" : "text-destructive")}>{totalLibre}h</div>
        </div>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-semibold">Agente</th>
              <th className="text-center p-3 font-semibold">Bloques</th>
              <th className="text-center p-3 font-semibold">Cap. Base</th>
              <th className="text-center p-3 font-semibold">Cap. Real</th>
              <th className="text-center p-3 font-semibold">Asignado</th>
              <th className="text-center p-3 font-semibold">Libre</th>
              <th className="text-center p-3 font-semibold">Campañas</th>
              <th className="text-center p-3 font-semibold">Skills</th>
              <th className="text-left p-3 font-semibold">Excepción</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.agent.id} className={cn("border-b last:border-0 hover:bg-muted/20", d.libre < 0 && "bg-destructive/5")}>
                <td className="p-3 font-medium">{d.agent.nombre}</td>
                <td className="p-3 text-center">
                  <div className="flex gap-1 justify-center">
                    {d.agent.bloques_horarios.map((b) => (
                      <span key={b} className="px-1.5 py-0.5 rounded bg-accent text-accent-foreground text-[10px] font-medium">{b}</span>
                    ))}
                  </div>
                </td>
                <td className="p-3 text-center font-mono-nums">{d.capacidadBase}h</td>
                <td className={cn("p-3 text-center font-mono-nums font-semibold", d.excepcion && "text-warning")}>{d.capacidadReal}h</td>
                <td className={cn("p-3 text-center font-mono-nums", d.asignado > d.capacidadReal && "text-destructive font-semibold")}>{d.asignado}h</td>
                <td className={cn("p-3 text-center font-mono-nums font-semibold", d.libre > 0 ? "text-success" : d.libre === 0 ? "text-muted-foreground" : "text-destructive")}>
                  {d.libre}h
                </td>
                <td className="p-3 text-center font-mono-nums">{d.numCampanas}</td>
                <td className="p-3 text-center font-mono-nums">{d.numSkills}</td>
                <td className="p-3 text-sm text-muted-foreground">{d.excepcion || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
