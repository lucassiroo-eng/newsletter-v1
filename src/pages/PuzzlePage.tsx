import { useState, useMemo } from "react";
import { useAppStore } from "@/store/appStore";
import { getCurrentWeekKey, getWeeksOfYear } from "@/lib/weekUtils";
import { autoAssign } from "@/lib/autoAssign";
import { Wand2, RotateCcw, Star } from "lucide-react";

export function PuzzlePage() {
  const { agents, campaigns, weeklyPlan, assignments, setAssignment, clearWeekAssignments } = useAppStore();
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekKey());

  const year = new Date().getFullYear();
  const weeks = useMemo(() => getWeeksOfYear(year).filter((w) => !w.isPast), [year]);

  // Campaigns that have planned hours for this week
  const activeCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const planned = weeklyPlan.find((w) => w.campaignId === c.id && w.weekKey === selectedWeek);
      return planned && planned.hours > 0;
    });
  }, [campaigns, weeklyPlan, selectedWeek]);

  // Week assignments
  const weekAssignments = useMemo(
    () => assignments.filter((a) => a.weekKey === selectedWeek),
    [assignments, selectedWeek]
  );

  const getAssignHours = (agentId: string, campId: string) => {
    return weekAssignments.find((a) => a.agentId === agentId && a.campaignId === campId)?.hours ?? 0;
  };

  const agentTotalAssigned = (agentId: string) =>
    weekAssignments.filter((a) => a.agentId === agentId).reduce((s, a) => s + a.hours, 0);

  const campaignTotalAssigned = (campId: string) =>
    weekAssignments.filter((a) => a.campaignId === campId).reduce((s, a) => s + a.hours, 0);

  const campaignPlanned = (campId: string) =>
    weeklyPlan.find((w) => w.campaignId === campId && w.weekKey === selectedWeek)?.hours ?? 0;

  const agentCampaignCount = (agentId: string) =>
    weekAssignments.filter((a) => a.agentId === agentId && a.hours > 0).length;

  const handleAutoAssign = () => {
    const getPlanned = (campId: string) => campaignPlanned(campId);
    const result = autoAssign(campaigns, agents, selectedWeek, getPlanned, assignments);
    // Clear existing and set new
    clearWeekAssignments(selectedWeek);
    result.assignments.forEach((a) => {
      setAssignment(a.agentId, a.campaignId, a.weekKey, a.hours);
    });
    if (result.unassignedHours.length > 0) {
      const msgs = result.unassignedHours.map((u) => {
        const c = campaigns.find((c) => c.id === u.campaignId);
        return `${c?.nombre}: ${u.remaining}h sin cubrir`;
      });
      alert("⚠️ Horas sin cubrir:\n" + msgs.join("\n"));
    }
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">El Puzzle</h1>
          <p className="text-sm text-surface-300">Asignación agentes-campañas</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="border border-surface-200 rounded-lg px-3 py-1.5 text-sm"
          >
            {weeks.map((w) => (
              <option key={w.key} value={w.key}>S{w.weekNum} — {w.label}</option>
            ))}
          </select>
          <button
            onClick={() => clearWeekAssignments(selectedWeek)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-surface-200 rounded-lg hover:bg-surface-50"
          >
            <RotateCcw size={14} /> Limpiar
          </button>
          <button
            onClick={handleAutoAssign}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium"
          >
            <Wand2 size={16} /> Auto-Asignar
          </button>
        </div>
      </div>

      {activeCampaigns.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-surface-300">
          <div className="text-center">
            <p className="text-lg font-medium mb-1">No hay campañas planificadas para esta semana</p>
            <p className="text-sm">Ve a la Vista Anual y asigna horas a las campañas para la semana seleccionada</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto border border-surface-200 rounded-xl bg-white">
          <table className="text-xs border-collapse">
            <thead className="sticky-header">
              <tr>
                <th className="sticky left-0 z-20 bg-white px-3 py-2 text-left min-w-[160px] border-b border-r border-surface-200">Campaña</th>
                <th className="sticky left-[160px] z-20 bg-surface-50 px-2 py-2 text-center min-w-[55px] border-b border-r border-surface-200">Plan</th>
                <th className="sticky left-[215px] z-20 bg-surface-50 px-2 py-2 text-center min-w-[55px] border-b border-r border-surface-200">Asign.</th>
                <th className="sticky left-[270px] z-20 bg-surface-50 px-2 py-2 text-center min-w-[55px] border-b border-r border-surface-200 font-bold">Bal.</th>
                {agents.map((a) => (
                  <th key={a.id} className="px-1 py-2 text-center min-w-[60px] border-b border-r border-surface-200">
                    <div className="font-semibold truncate" title={a.nombre}>{a.nombre.split(" ")[0]}</div>
                    <div className="text-[10px] text-surface-300 font-normal">{a.horasSemanales}h</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Agent totals row */}
              <tr className="bg-brand-50">
                <td className="sticky left-0 z-10 bg-brand-50 px-3 py-1.5 font-semibold border-r border-surface-200">Disponible</td>
                <td colSpan={3} className="sticky left-[160px] z-10 bg-brand-50 border-r border-surface-200"></td>
                {agents.map((a) => (
                  <td key={a.id} className="px-1 py-1.5 text-center font-mono font-semibold text-brand-700 border-r border-surface-200">
                    {a.horasSemanales}
                  </td>
                ))}
              </tr>
              <tr className="bg-surface-50">
                <td className="sticky left-0 z-10 bg-surface-50 px-3 py-1.5 font-semibold border-r border-surface-200">Asignadas</td>
                <td colSpan={3} className="sticky left-[160px] z-10 bg-surface-50 border-r border-surface-200"></td>
                {agents.map((a) => {
                  const total = agentTotalAssigned(a.id);
                  return (
                    <td key={a.id} className="px-1 py-1.5 text-center font-mono border-r border-surface-200">
                      {total > 0 ? total : "·"}
                    </td>
                  );
                })}
              </tr>
              <tr className="bg-surface-100 border-b-2 border-brand-200">
                <td className="sticky left-0 z-10 bg-surface-100 px-3 py-1.5 font-bold border-r border-surface-200">Libres</td>
                <td colSpan={3} className="sticky left-[160px] z-10 bg-surface-100 border-r border-surface-200"></td>
                {agents.map((a) => {
                  const free = a.horasSemanales - agentTotalAssigned(a.id);
                  return (
                    <td key={a.id} className={`px-1 py-1.5 text-center font-mono font-bold border-r border-surface-200 ${free < 0 ? "text-status-red" : free === 0 ? "text-surface-300" : "text-status-green"}`}>
                      {free}
                    </td>
                  );
                })}
              </tr>
              {/* # campaigns per agent */}
              <tr className="border-b border-brand-200">
                <td className="sticky left-0 z-10 bg-white px-3 py-1 text-[10px] text-surface-300 border-r border-surface-200">Nº camp.</td>
                <td colSpan={3} className="sticky left-[160px] z-10 bg-white border-r border-surface-200"></td>
                {agents.map((a) => (
                  <td key={a.id} className="px-1 py-1 text-center text-[10px] text-surface-300 border-r border-surface-200">
                    {agentCampaignCount(a.id)}
                  </td>
                ))}
              </tr>

              {/* Campaign rows */}
              {activeCampaigns.map((camp) => {
                const planned = campaignPlanned(camp.id);
                const assigned = campaignTotalAssigned(camp.id);
                const balance = planned - assigned;
                const coord = agents.find((a) => a.id === camp.coordinadoraId);

                return (
                  <tr key={camp.id} className="hover:bg-blue-50/30 border-t border-surface-100">
                    <td className="sticky left-0 z-10 bg-white px-3 py-1.5 border-r border-surface-200">
                      <div className="font-medium truncate max-w-[150px]" title={camp.nombre}>{camp.nombre}</div>
                      {coord && (
                        <div className="text-[10px] text-brand-500 flex items-center gap-0.5">
                          <Star size={8} className="fill-brand-400" /> {coord.nombre.split(" ")[0]}
                        </div>
                      )}
                    </td>
                    <td className="sticky left-[160px] z-10 bg-white px-2 py-1.5 text-center font-mono border-r border-surface-200">{planned}</td>
                    <td className="sticky left-[215px] z-10 bg-white px-2 py-1.5 text-center font-mono border-r border-surface-200">{assigned}</td>
                    <td className={`sticky left-[270px] z-10 bg-white px-2 py-1.5 text-center font-mono font-bold border-r border-surface-200 ${balance > 0 ? "text-status-red" : balance === 0 ? "text-status-green" : "text-status-orange"}`}>
                      {balance > 0 ? `-${balance}` : balance === 0 ? "✓" : `+${Math.abs(balance)}`}
                    </td>
                    {agents.map((a) => {
                      const isTrained = a.campanasFormado.includes(camp.id);
                      const isCoord = a.campanasCoordina.includes(camp.id);
                      if (!isTrained) {
                        return <td key={a.id} className="bg-surface-100 border-r border-surface-200"></td>;
                      }
                      return (
                        <PuzzleCell
                          key={a.id}
                          value={getAssignHours(a.id, camp.id)}
                          isCoord={isCoord}
                          onChange={(val) => setAssignment(a.id, camp.id, selectedWeek, val)}
                        />
                      );
                    })}
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

function PuzzleCell({ value, isCoord, onChange }: { value: number; isCoord: boolean; onChange: (v: number) => void }) {
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
          style={{ minWidth: 60 }}
        />
      </td>
    );
  }

  return (
    <td
      onClick={startEdit}
      className={`px-1 py-1.5 text-center font-mono cursor-pointer hover:bg-brand-50 border-r border-surface-200 ${isCoord ? "bg-yellow-50" : ""}`}
    >
      {value > 0 ? value : <span className="text-surface-200">·</span>}
    </td>
  );
}
