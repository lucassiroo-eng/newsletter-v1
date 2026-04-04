import { useState, useMemo, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { getYearWeeks, getCurrentWeek, formatWeekShort, getWeekNumber, getWeekMonth } from '@/lib/weekUtils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Database, Eye, EyeOff } from 'lucide-react';
import { SEED_DATA } from '@/data/seedData';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function AnnualPlanPage() {
  const { agents, campaigns, weeklyPlan, exceptions, setWeeklyPlanHours, loadSeed } = useAppStore();
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [hidePast, setHidePast] = useState(true);
  const currentWeekRef = useRef<HTMLTableCellElement>(null);

  const currentWeek = getCurrentWeek();
  const allWeeks = useMemo(() => getYearWeeks(year), [year]);
  const weeks = useMemo(() => hidePast ? allWeeks.filter(w => w >= currentWeek) : allWeeks, [allWeeks, hidePast, currentWeek]);

  const activeCampaigns = useMemo(() =>
    campaigns.filter(c => c.estado === 'en_ejecucion' || c.estado === 'pre_planificada')
      .sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [campaigns]);

  const getHours = (cId: string, week: string) =>
    weeklyPlan.find(w => w.campaign_id === cId && w.week === week)?.horas || 0;

  // Capacity per week
  const weekCap = useMemo(() => {
    const m = new Map<string, number>();
    for (const w of weeks) {
      let t = 0;
      for (const a of agents) {
        const exc = exceptions.find(e => e.agent_id === a.id && e.semana === w);
        t += exc ? exc.horas_disponibles : a.horas_maximas_semanales;
      }
      m.set(w, t);
    }
    return m;
  }, [agents, weeks, exceptions]);

  // Needed per week
  const weekNeeded = useMemo(() => {
    const m = new Map<string, number>();
    for (const w of weeks) {
      let t = 0;
      for (const c of activeCampaigns) t += getHours(c.id, w);
      m.set(w, t);
    }
    return m;
  }, [activeCampaigns, weeklyPlan, weeks]);

  // Balances per campaign
  const getBalances = (c: typeof campaigns[0]) => {
    const futureSum = weeklyPlan.filter(w => w.campaign_id === c.id && w.week >= currentWeek).reduce((s, w) => s + w.horas, 0);
    const curMonth = new Date().getMonth();
    const monthSum = weeklyPlan.filter(w => w.campaign_id === c.id && getWeekMonth(w.week) === curMonth).reduce((s, w) => s + w.horas, 0);
    return {
      rpTotal: c.horas_realizadas_total + c.horas_planificadas_total,
      rpMes: c.horas_realizadas_mes + c.horas_planificadas_mes,
      balTotal: c.objetivo_total > 0 ? c.objetivo_total - c.horas_realizadas_total - c.horas_planificadas_total - futureSum : 0,
      balMes: c.objetivo_mensual > 0 ? c.objetivo_mensual - c.horas_realizadas_mes - c.horas_planificadas_mes - monthSum : 0,
    };
  };

  const ck = (cId: string, w: string) => `${cId}::${w}`;
  const startEdit = (cId: string, w: string) => { setEditingCell(ck(cId, w)); setEditValue(String(getHours(cId, w) || '')); };
  const commitEdit = (cId: string, w: string) => { setWeeklyPlanHours(cId, w, parseFloat(editValue) || 0); setEditingCell(null); };

  const balColor = (v: number) => v > 5 ? 'text-destructive' : v < -5 ? 'text-warning' : 'text-success';

  useEffect(() => {
    currentWeekRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  }, [weeks]);

  // Group weeks by month for header
  const monthGroups = useMemo(() => {
    const groups: { month: number; weeks: string[] }[] = [];
    let cur = -1;
    for (const w of weeks) {
      const m = getWeekMonth(w);
      if (m !== cur) { groups.push({ month: m, weeks: [w] }); cur = m; }
      else groups[groups.length - 1].weeks.push(w);
    }
    return groups;
  }, [weeks]);

  if (campaigns.length === 0) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No hay campañas. Carga los datos de ejemplo para empezar.</p>
        <Button onClick={() => loadSeed(SEED_DATA)} className="gap-2"><Database className="w-4 h-4" /> Cargar Datos de Ejemplo</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold">Vista Anual — Planificación Semanal</h1>
          <p className="text-xs text-muted-foreground">{activeCampaigns.length} campañas activas · {agents.length} agentes · Semana actual: S{getWeekNumber(currentWeek)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setYear(y => y - 1)}>{year - 1}</Button>
          <Button variant="secondary" size="sm">{year}</Button>
          <Button variant="outline" size="sm" onClick={() => setYear(y => y + 1)}>{year + 1}</Button>
          <Button variant="outline" size="sm" onClick={() => setHidePast(!hidePast)} className="gap-1">
            {hidePast ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {hidePast ? 'Ver pasadas' : 'Ocultar pasadas'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto border rounded-lg bg-card">
        <table className="text-[11px] border-collapse">
          <thead className="sticky top-0 z-30">
            {/* Month headers */}
            <tr>
              <th colSpan={7} className="bg-muted border-b border-r sticky left-0 z-40"></th>
              {monthGroups.map((g, i) => (
                <th key={i} colSpan={g.weeks.length} className="bg-muted border-b text-center font-bold py-1">
                  {MONTHS[g.month]}
                </th>
              ))}
            </tr>
            {/* Week number headers */}
            <tr>
              <th className="p-1.5 text-left font-semibold border-b border-r bg-muted sticky left-0 z-40 min-w-[160px]">Campaña</th>
              <th className="p-1 text-center font-semibold border-b border-r bg-muted min-w-[60px]">R+P Tot</th>
              <th className="p-1 text-center font-semibold border-b border-r bg-muted min-w-[55px]">R+P Mes</th>
              <th className="p-1 text-center font-semibold border-b border-r bg-muted min-w-[55px]">Obj Tot</th>
              <th className="p-1 text-center font-semibold border-b border-r bg-muted min-w-[50px]">Obj Mes</th>
              <th className="p-1 text-center font-semibold border-b border-r bg-muted min-w-[55px]">Bal Tot</th>
              <th className="p-1 text-center font-semibold border-b border-r bg-muted min-w-[55px]">Bal Mes</th>
              {weeks.map(w => (
                <th key={w} ref={w === currentWeek ? currentWeekRef : undefined}
                  className={cn("p-1 text-center font-semibold border-b bg-muted min-w-[44px]",
                    w === currentWeek && "bg-primary/20 text-primary")}>
                  <div>S{getWeekNumber(w)}</div>
                  <div className="font-normal text-[9px] text-muted-foreground">{formatWeekShort(w)}</div>
                </th>
              ))}
            </tr>
            {/* Summary rows */}
            <tr className="bg-accent/30">
              <td className="p-1 font-semibold border-b border-r sticky left-0 z-20 bg-accent/30">💼 Capacidad agentes</td>
              <td colSpan={6} className="border-b border-r"></td>
              {weeks.map(w => (
                <td key={w} className={cn("p-1 text-center font-mono-nums border-b", w === currentWeek && "bg-primary/10")}>
                  {weekCap.get(w) || 0}
                </td>
              ))}
            </tr>
            <tr className="bg-accent/20">
              <td className="p-1 font-semibold border-b border-r sticky left-0 z-20 bg-accent/20">📋 Horas planificadas</td>
              <td colSpan={6} className="border-b border-r"></td>
              {weeks.map(w => (
                <td key={w} className={cn("p-1 text-center font-mono-nums border-b", w === currentWeek && "bg-primary/10")}>
                  {weekNeeded.get(w) || 0}
                </td>
              ))}
            </tr>
            <tr className="bg-accent/10">
              <td className="p-1 font-semibold border-b border-r sticky left-0 z-20 bg-accent/10">⚖️ Balance</td>
              <td colSpan={6} className="border-b border-r"></td>
              {weeks.map(w => {
                const bal = (weekCap.get(w) || 0) - (weekNeeded.get(w) || 0);
                return (
                  <td key={w} className={cn("p-1 text-center font-mono-nums font-bold border-b",
                    bal > 0 ? "text-success" : bal < 0 ? "text-destructive" : "text-muted-foreground",
                    w === currentWeek && "bg-primary/10")}>
                    {bal > 0 ? `+${bal}` : bal}
                  </td>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {activeCampaigns.map(c => {
              const b = getBalances(c);
              return (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/10">
                  <td className="p-1 font-medium border-r sticky left-0 bg-card z-10 truncate max-w-[160px]" title={c.nombre}>
                    {c.nombre.length > 22 ? c.nombre.slice(0, 22) + '…' : c.nombre}
                    {c.es_sc4l && <span className="ml-1 text-[8px] px-0.5 rounded bg-warning/20 text-warning font-bold">SC4L</span>}
                  </td>
                  <td className="p-1 text-center border-r font-mono-nums">{b.rpTotal}</td>
                  <td className="p-1 text-center border-r font-mono-nums">{b.rpMes}</td>
                  <td className="p-1 text-center border-r font-mono-nums">{c.objetivo_total || '—'}</td>
                  <td className="p-1 text-center border-r font-mono-nums">{c.objetivo_mensual || '—'}</td>
                  <td className={cn("p-1 text-center border-r font-mono-nums font-bold", balColor(b.balTotal))}>
                    {c.objetivo_total > 0 ? b.balTotal : '—'}
                  </td>
                  <td className={cn("p-1 text-center border-r font-mono-nums font-bold", balColor(b.balMes))}>
                    {c.objetivo_mensual > 0 ? b.balMes : '—'}
                  </td>
                  {weeks.map(w => {
                    const h = getHours(c.id, w);
                    const isEditing = editingCell === ck(c.id, w);
                    const isPast = w < currentWeek;
                    return (
                      <td key={w} className={cn("p-0 text-center",
                        w === currentWeek && "bg-primary/5",
                        isPast && "bg-muted/20")}>
                        {isEditing ? (
                          <input type="number" className="w-full h-6 text-center text-[11px] font-mono-nums bg-background border rounded focus:ring-1 focus:ring-ring outline-none"
                            value={editValue} onChange={e => setEditValue(e.target.value)}
                            onBlur={() => commitEdit(c.id, w)}
                            onKeyDown={e => e.key === 'Enter' && commitEdit(c.id, w)}
                            autoFocus />
                        ) : (
                          <button onClick={() => startEdit(c.id, w)}
                            className={cn("w-full h-6 text-[11px] font-mono-nums transition-colors",
                              h > 0 ? "bg-primary/10 text-primary font-semibold hover:bg-primary/20" : "hover:bg-muted/30 text-muted-foreground/50")}>
                            {h > 0 ? h : ''}
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
    </div>
  );
}
