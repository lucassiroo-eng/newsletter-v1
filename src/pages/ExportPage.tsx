import { useState, useMemo } from "react";
import { useAppStore } from "@/store/appStore";
import { getCurrentWeekKey, getWeeksOfYear } from "@/lib/weekUtils";
import { Download, FileSpreadsheet } from "lucide-react";
import Papa from "papaparse";
import { startOfISOWeek, endOfISOWeek, format, addDays } from "date-fns";

export function ExportPage() {
  const { agents, campaigns, assignments } = useAppStore();
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekKey());

  const year = new Date().getFullYear();
  const weeks = useMemo(() => getWeeksOfYear(year).filter((w) => !w.isPast), [year]);

  const weekAssignments = useMemo(
    () => assignments.filter((a) => a.weekKey === selectedWeek && a.hours > 0),
    [assignments, selectedWeek]
  );

  const weekInfo = weeks.find((w) => w.key === selectedWeek);

  const exportCsv = () => {
    if (!weekInfo) return;

    const rows = weekAssignments.map((a) => {
      const agent = agents.find((ag) => ag.id === a.agentId);
      const camp = campaigns.find((c) => c.id === a.campaignId);
      return {
        agente: agent?.nombre ?? "",
        campana: camp?.nombre ?? "",
        numero_contrato: camp?.numeroContrato ?? "",
        fecha_inicio_semana: format(weekInfo.startDate, "yyyy-MM-dd"),
        fecha_fin_semana: format(weekInfo.endDate, "yyyy-MM-dd"),
        horas: a.hours,
      };
    });

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `planificacion_${selectedWeek}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-brand-950 mb-2">Exportar CSV para Suite CRM</h1>
      <p className="text-sm text-surface-300 mb-6">
        Genera un CSV con las asignaciones de la semana seleccionada para importar en el CRM.
      </p>

      <div className="bg-white rounded-xl border border-surface-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="border border-surface-200 rounded-lg px-3 py-2 text-sm"
          >
            {weeks.map((w) => (
              <option key={w.key} value={w.key}>S{w.weekNum} — {w.label}</option>
            ))}
          </select>
          <button
            onClick={exportCsv}
            disabled={weekAssignments.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium disabled:opacity-50"
          >
            <Download size={16} /> Descargar CSV
          </button>
        </div>

        <div className="text-sm text-surface-300 mb-4">
          {weekAssignments.length} asignaciones para la semana {selectedWeek}
        </div>

        {weekAssignments.length > 0 && (
          <div className="border border-surface-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50">
                  <th className="px-4 py-2 text-left font-medium">Agente</th>
                  <th className="px-4 py-2 text-left font-medium">Campaña</th>
                  <th className="px-4 py-2 text-left font-medium">Contrato</th>
                  <th className="px-4 py-2 text-right font-medium">Horas</th>
                </tr>
              </thead>
              <tbody>
                {weekAssignments.map((a, i) => {
                  const agent = agents.find((ag) => ag.id === a.agentId);
                  const camp = campaigns.find((c) => c.id === a.campaignId);
                  return (
                    <tr key={i} className="border-t border-surface-100">
                      <td className="px-4 py-2">{agent?.nombre}</td>
                      <td className="px-4 py-2">{camp?.nombre}</td>
                      <td className="px-4 py-2 font-mono text-xs">{camp?.numeroContrato}</td>
                      <td className="px-4 py-2 text-right font-mono">{a.hours}h</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
