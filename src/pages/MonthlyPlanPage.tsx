import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export default function MonthlyPlanPage() {
  const { campaigns } = useAppStore();

  const activeCampaigns = campaigns.filter((c) => c.objetivo_horas > 0 || c.objetivo_anual > 0);

  const totalAnual = activeCampaigns.reduce((s, c) => s + c.objetivo_anual, 0);
  const totalRealizadoYTD = activeCampaigns.reduce((s, c) => s + c.horas_realizadas_ytd, 0);
  const totalMensual = activeCampaigns.reduce((s, c) => s + c.objetivo_mensual, 0);
  const totalSemanal = activeCampaigns.reduce((s, c) => s + c.objetivo_horas, 0);

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Plan Mensual y Progreso</h1>
        <p className="text-sm text-muted-foreground">Vista del objetivo anual, progreso YTD y desglose mensual/semanal por campaña.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-xs text-muted-foreground font-medium uppercase">Objetivo Anual Total</div>
          <div className="text-2xl font-bold font-mono-nums mt-1">{totalAnual.toLocaleString()}h</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-xs text-muted-foreground font-medium uppercase">Realizado YTD</div>
          <div className="text-2xl font-bold font-mono-nums mt-1">{totalRealizadoYTD.toLocaleString()}h</div>
          <div className="text-xs text-muted-foreground mt-1">
            {totalAnual > 0 ? `${Math.round((totalRealizadoYTD / totalAnual) * 100)}%` : '—'}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-xs text-muted-foreground font-medium uppercase">Objetivo Mes Actual</div>
          <div className="text-2xl font-bold font-mono-nums mt-1">{totalMensual.toLocaleString()}h</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-xs text-muted-foreground font-medium uppercase">Objetivo Semanal</div>
          <div className="text-2xl font-bold font-mono-nums mt-1">{totalSemanal.toLocaleString()}h</div>
        </div>
      </div>

      {activeCampaigns.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">Carga datos para ver el plan mensual.</div>
      ) : (
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-semibold">Campaña</th>
                <th className="text-center p-3 font-semibold">Obj. Anual</th>
                <th className="text-center p-3 font-semibold">Realizado YTD</th>
                <th className="text-center p-3 font-semibold">% Progreso</th>
                <th className="text-center p-3 font-semibold">Planif. YTD</th>
                <th className="text-center p-3 font-semibold">Restante</th>
                <th className="text-center p-3 font-semibold">Obj. Mes</th>
                <th className="text-center p-3 font-semibold">Obj. Semana</th>
              </tr>
            </thead>
            <tbody>
              {activeCampaigns.map((c) => {
                const restante = Math.max(0, c.objetivo_anual - c.horas_realizadas_ytd - c.horas_planificadas_ytd);
                const pct = c.objetivo_anual > 0 ? Math.round(((c.horas_realizadas_ytd + c.horas_planificadas_ytd) / c.objetivo_anual) * 100) : 0;
                return (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-3 font-medium">
                      {c.nombre}
                      {c.es_sc4l && <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded bg-warning text-warning-foreground font-semibold">SC4L</span>}
                    </td>
                    <td className="p-3 text-center font-mono-nums">{c.objetivo_anual > 0 ? `${c.objetivo_anual}h` : '—'}</td>
                    <td className="p-3 text-center font-mono-nums">{c.horas_realizadas_ytd}h</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Progress value={Math.min(pct, 100)} className="h-2 flex-1" />
                        <span className={cn("text-xs font-mono-nums font-semibold w-10 text-right", pct >= 100 ? "text-success" : pct >= 75 ? "text-foreground" : "text-muted-foreground")}>
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono-nums">{c.horas_planificadas_ytd}h</td>
                    <td className={cn("p-3 text-center font-mono-nums font-semibold", restante > 0 ? "text-destructive" : "text-success")}>
                      {restante > 0 ? `${restante}h` : '✓'}
                    </td>
                    <td className="p-3 text-center font-mono-nums">{c.objetivo_mensual > 0 ? `${c.objetivo_mensual}h` : '—'}</td>
                    <td className="p-3 text-center font-mono-nums font-semibold">{c.objetivo_horas > 0 ? `${c.objetivo_horas}h` : '—'}</td>
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
