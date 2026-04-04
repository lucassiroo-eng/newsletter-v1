import { useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import { getWeekMonday, getWeekFriday, formatDateShort, getWeekNumber } from '@/lib/weekUtils';
import { Button } from '@/components/ui/button';
import { FileDown, Eye } from 'lucide-react';
import Papa from 'papaparse';

export default function ExportPage() {
  const { agents, campaigns, planningCells, selectedWeek } = useAppStore();

  const exportRows = useMemo(() => {
    return planningCells
      .filter(p => p.week === selectedWeek && p.horas > 0)
      .map(p => {
        const agent = agents.find(a => a.id === p.agent_id);
        const campaign = campaigns.find(c => c.id === p.campaign_id);
        if (!agent || !campaign) return null;
        const monday = getWeekMonday(selectedWeek);
        const friday = getWeekFriday(selectedWeek);
        return {
          Agente: agent.nombre,
          Campaña: campaign.nombre,
          NumContrato: campaign.numero_contrato,
          FechaInicio: formatDateShort(monday),
          FechaFin: formatDateShort(friday),
          Horas: p.horas,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.Campaña.localeCompare(b!.Campaña));
  }, [agents, campaigns, planningCells, selectedWeek]);

  const handleExport = () => {
    const csv = Papa.unparse(exportRows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suite_crm_S${getWeekNumber(selectedWeek)}_${selectedWeek}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalHoras = exportRows.reduce((s, r) => s + (r?.Horas || 0), 0);

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Exportar para Suite CRM</h1>
          <p className="text-sm text-muted-foreground">Semana S{getWeekNumber(selectedWeek)} — {formatDateShort(getWeekMonday(selectedWeek))} a {formatDateShort(getWeekFriday(selectedWeek))}</p>
        </div>
        <Button onClick={handleExport} disabled={exportRows.length === 0} className="gap-2">
          <FileDown className="w-4 h-4" /> Descargar CSV
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-xs text-muted-foreground font-medium uppercase">Tareas</div>
          <div className="text-2xl font-bold font-mono-nums mt-1">{exportRows.length}</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-xs text-muted-foreground font-medium uppercase">Horas Totales</div>
          <div className="text-2xl font-bold font-mono-nums mt-1">{totalHoras}h</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-xs text-muted-foreground font-medium uppercase">Agentes / Campañas</div>
          <div className="text-2xl font-bold font-mono-nums mt-1">
            {new Set(exportRows.map(r => r?.Agente)).size} / {new Set(exportRows.map(r => r?.Campaña)).size}
          </div>
        </div>
      </div>

      {exportRows.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">No hay asignaciones para esta semana. Ve al Puzzle y asigna horas primero.</div>
      ) : (
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <div className="p-3 bg-muted/30 border-b flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Vista previa del CSV</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-semibold">Campaña</th>
                <th className="text-left p-3 font-semibold">Agente</th>
                <th className="text-center p-3 font-semibold">Periodo</th>
                <th className="text-center p-3 font-semibold">Horas</th>
              </tr>
            </thead>
            <tbody>
              {exportRows.map((r, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-3 font-medium text-xs">{r?.Campaña}</td>
                  <td className="p-3 text-xs">{r?.Agente}</td>
                  <td className="p-3 text-center text-xs text-muted-foreground">{r?.FechaInicio} — {r?.FechaFin}</td>
                  <td className="p-3 text-center font-mono-nums font-semibold">{r?.Horas}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
