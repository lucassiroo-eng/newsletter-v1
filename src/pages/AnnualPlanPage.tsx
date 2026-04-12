import { useState, useMemo, useCallback } from "react";
import { useAppStore } from "@/store/appStore";
import { getWeeksOfYear } from "@/lib/weekUtils";
import { Eye, EyeOff } from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();

export function AnnualPlanPage() {
  const { campaigns, agents, weeklyPlan, setWeeklyPlanHours } = useAppStore();
  const [showPast, setShowPast] = useState(false);
  const [year] = useState(CURRENT_YEAR);

  const allWeeks = useMemo(() => getWeeksOfYear(year), [year]);
  const weeks = useMemo(
    () => (showPast ? allWeeks : allWeeks.filter((w) => !w.isPast)),
    [allWeeks, showPast]
  );

  const activeCampaigns = campaigns.filter(
    (c) => c.estado === "en_ejecucion" || c.estado === "pre_planificada"
  );

  const getHours = useCallback(
    (campId: string, weekKey: string) =>
      weeklyPlan.find((w) => w.campaignId === campId && w.weekKey === weekKey)?.hours ?? 0,
    [weeklyPlan]
  );

  // Totals per week
  const weekTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const w of weeks) {
      let sum = 0;
      for (const c of activeCampaigns) {
        sum += getHours(c.id, w.key);
      }
      totals[w.key] = sum;
    }
    return totals;
  }, [weeks, activeCampaigns, getHours]);

  const agentHoursPerWeek = useMemo(() => {
    return agents.reduce((sum, a) => sum + a.horasSemanales, 0);
  }, [agents]);

  // Per-campaign: sum of all future planned weeks
  const campaignFuturePlanned = useCallback(
    (campId: string) => {
      return allWeeks
        .filter((w) => !w.isPast)
        .reduce((sum, w) => sum + getHours(campId, w.key), 0);
    },
    [allWeeks, getHours]
  );

  // Current month weeks
  const currentMonth = new Date().getMonth();
  const currentMonthWeeks = useMemo(
    () => allWeeks.filter((w) => w.month === currentMonth),
    [allWeeks, currentMonth]
  );

  const campaignMonthPlanned = useCallback(
    (campId: string) => {
      return currentMonthWeeks.reduce((sum, w) => sum + getHours(campId, w.key), 0);
    },
    [currentMonthWeeks, getHours]
  );

  const balanceClass = (val: number) => {
    if (val > 5) return "text-status-orange font-semibold";
    if (val < -5) return "text-status-red font-semibold";
    if (Math.abs(val) <= 5) return "text-status-green font-semibold";
    return "";
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">Vista Anual {year}</h1>
          <p className="text-sm text-surface-300">{activeCampaigns.length} campañas activas · {agents.length} agentes</p>
        </div>
        <button
          onClick={() => setShowPast(!showPast)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs border border-surface-200 rounded-lg hover:bg-surface-50"
        >
          {showPast ? <EyeOff size={14} /> : <Eye size={14} />}
          {showPast ? "Ocultar pasadas" : "Mostrar pasadas"}
        </button>
      </div>

      <div className="flex-1 overflow-auto border border-surface-200 rounded-xl bg-white">
        <table className="text-xs border-collapse">
          <thead className="sticky-header">
            <tr>
              <th className="sticky left-0 z-20 bg-white px-3 py-2 text-left min-w-[180px] border-b border-r border-surface-200">Campaña</th>
              <th className="sticky left-[180px] z-20 bg-surface-50 px-2 py-2 text-center min-w-[70px] border-b border-r border-surface-200">Realiz.+Plan Total</th>
              <th className="sticky left-[250px] z-20 bg-surface-50 px-2 py-2 text-center min-w-[70px] border-b border-r border-surface-200">Obj. Total</th>
              <th className="sticky left-[320px] z-20 bg-surface-50 px-2 py-2 text-center min-w-[70px] border-b border-r border-surface-200">Balance Total</th>
              <th className="sticky left-[390px] z-20 bg-surface-50 px-2 py-2 text-center min-w-[60px] border-b border-r border-surface-200">R+P Mes</th>
              <th className="sticky left-[450px] z-20 bg-surface-50 px-2 py-2 text-center min-w-[60px] border-b border-r border-surface-200">Obj. Mes</th>
              <th className="sticky left-[510px] z-20 bg-surface-50 px-2 py-2 text-center min-w-[70px] border-b border-r border-surface-200 font-bold">Bal. Mes</th>
              {weeks.map((w) => (
                <th key={w.key} className="px-1 py-2 text-center min-w-[52px] border-b border-r border-surface-200">
                  <div className="font-semibold">S{w.weekNum}</div>
                  <div className="text-[10px] text-surface-300 font-normal">{w.label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Available hours row */}
            <tr className="bg-brand-50">
              <td className="sticky left-0 z-10 bg-brand-50 px-3 py-1.5 font-semibold border-r border-surface-200">📊 Horas disponibles</td>
              <td colSpan={6} className="sticky left-[180px] z-10 bg-brand-50 border-r border-surface-200"></td>
              {weeks.map((w) => (
                <td key={w.key} className="px-1 py-1.5 text-center font-mono font-semibold text-brand-700 border-r border-surface-200">
                  {agentHoursPerWeek}
                </td>
              ))}
            </tr>

            {/* Needed hours row */}
            <tr className="bg-surface-50">
              <td className="sticky left-0 z-10 bg-surface-50 px-3 py-1.5 font-semibold border-r border-surface-200">📋 Horas necesarias</td>
              <td colSpan={6} className="sticky left-[180px] z-10 bg-surface-50 border-r border-surface-200"></td>
              {weeks.map((w) => (
                <td key={w.key} className="px-1 py-1.5 text-center font-mono font-medium border-r border-surface-200">
                  {weekTotals[w.key] ?? 0}
                </td>
              ))}
            </tr>

            {/* Balance row */}
            <tr className="bg-surface-100 border-b-2 border-brand-200">
              <td className="sticky left-0 z-10 bg-surface-100 px-3 py-1.5 font-bold border-r border-surface-200">⚖️ Balance</td>
              <td colSpan={6} className="sticky left-[180px] z-10 bg-surface-100 border-r border-surface-200"></td>
              {weeks.map((w) => {
                const balance = agentHoursPerWeek - (weekTotals[w.key] ?? 0);
                return (
                  <td key={w.key} className={`px-1 py-1.5 text-center font-mono font-bold border-r border-surface-200 ${balanceClass(balance)}`}>
                    {balance > 0 ? "+" : ""}{balance}
                  </td>
                );
              })}
            </tr>

            {/* Campaign rows */}
            {activeCampaigns.map((camp) => {
              const rpTotal = camp.horasRealizadasTotal + camp.horasPlanificadasTotal;
              const balTotal = camp.objetivoTotal - rpTotal - campaignFuturePlanned(camp.id);
              const rpMes = camp.horasRealizadasMes + camp.horasPlanificadasMes;
              const objMes = camp.tipoObjetivo === "Mensual" ? camp.objetivoMensual : 0;
              const balMes = objMes > 0 ? objMes - rpMes - campaignMonthPlanned(camp.id) : 0;

              return (
                <tr key={camp.id} className="hover:bg-blue-50/30 border-t border-surface-100">
                  <td className="sticky left-0 z-10 bg-white px-3 py-1.5 font-medium truncate max-w-[180px] border-r border-surface-200" title={camp.nombre}>
                    {camp.nombre}
                  </td>
                  <td className="sticky left-[180px] z-10 bg-white px-2 py-1.5 text-center font-mono border-r border-surface-200">{rpTotal}</td>
                  <td className="sticky left-[250px] z-10 bg-white px-2 py-1.5 text-center font-mono border-r border-surface-200">{camp.objetivoTotal}</td>
                  <td className={`sticky left-[320px] z-10 bg-white px-2 py-1.5 text-center font-mono border-r border-surface-200 ${balanceClass(balTotal)}`}>
                    {balTotal > 0 ? "+" : ""}{balTotal}
                  </td>
                  <td className="sticky left-[390px] z-10 bg-white px-2 py-1.5 text-center font-mono border-r border-surface-200">{rpMes}</td>
                  <td className="sticky left-[450px] z-10 bg-white px-2 py-1.5 text-center font-mono border-r border-surface-200">{objMes || "—"}</td>
                  <td className={`sticky left-[510px] z-10 bg-white px-2 py-1.5 text-center font-mono border-r border-surface-200 ${objMes > 0 ? balanceClass(balMes) : ""}`}>
                    {objMes > 0 ? (balMes > 0 ? "+" : "") + balMes : "—"}
                  </td>
                  {weeks.map((w) => (
                    <EditableCell
                      key={w.key}
                      value={getHours(camp.id, w.key)}
                      onChange={(val) => setWeeklyPlanHours(camp.id, w.key, val)}
                    />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditableCell({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState("");

  const startEdit = () => {
    setTemp(value > 0 ? String(value) : "");
    setEditing(true);
  };

  const commit = () => {
    const num = parseFloat(temp) || 0;
    onChange(Math.max(0, num));
    setEditing(false);
  };

  if (editing) {
    return (
      <td className="px-0 py-0 border-r border-surface-200">
        <input
          autoFocus
          value={temp}
          onChange={(e) => setTemp(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          className="w-full h-full px-1 py-1.5 text-center font-mono text-xs outline-none bg-blue-50 border-2 border-brand-400"
          style={{ minWidth: 52 }}
        />
      </td>
    );
  }

  return (
    <td
      onClick={startEdit}
      className="px-1 py-1.5 text-center font-mono cursor-pointer hover:bg-brand-50 border-r border-surface-200"
    >
      {value > 0 ? value : <span className="text-surface-200">·</span>}
    </td>
  );
}
