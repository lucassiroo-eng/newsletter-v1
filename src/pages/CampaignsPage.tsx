import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import type { Campaign, CampaignStatus, CampaignObjectiveType } from "@/types/models";
import { STATUS_LABELS, STATUS_COLORS } from "@/types/models";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";

export function CampaignsPage() {
  const { campaigns, agents, addCampaign, updateCampaign, deleteCampaign } = useAppStore();
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<CampaignStatus | "todas">("todas");

  const emptyCampaign = (): Campaign => ({
    id: `camp-${Date.now()}`,
    nombre: "",
    numeroContrato: "",
    tipoObjetivo: "Mensual",
    objetivoMensual: 0,
    objetivoTotal: 0,
    fechaInicio: new Date().toISOString().split("T")[0]!,
    fechaFin: "",
    estado: "pipeline",
    coordinadoraId: "",
    idiomasRequeridos: ["Español"],
    horasRealizadasTotal: 0,
    horasPlanificadasTotal: 0,
    horasRealizadasMes: 0,
    horasPlanificadasMes: 0,
  });

  const [form, setForm] = useState<Campaign>(emptyCampaign());

  const openNew = () => { setForm(emptyCampaign()); setEditing(null); setShowForm(true); };
  const openEdit = (c: Campaign) => { setForm({ ...c }); setEditing(c); setShowForm(true); };

  const save = () => {
    if (editing) {
      updateCampaign(editing.id, form);
    } else {
      addCampaign(form);
    }
    setShowForm(false);
  };

  const filtered = filterStatus === "todas" ? campaigns : campaigns.filter((c) => c.estado === filterStatus);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">Campañas</h1>
          <p className="text-sm text-surface-300 mt-1">{campaigns.length} campañas</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium">
          <Plus size={16} /> Nueva Campaña
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(["todas", "en_ejecucion", "pre_planificada", "pipeline", "finalizada"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              filterStatus === s ? "bg-brand-600 text-white border-brand-600" : "border-surface-200 hover:bg-surface-50"
            }`}
          >
            {s === "todas" ? "Todas" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-surface-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-50 text-left">
              <th className="px-4 py-3 font-medium text-brand-900">Campaña</th>
              <th className="px-4 py-3 font-medium text-brand-900">Contrato</th>
              <th className="px-4 py-3 font-medium text-brand-900">Estado</th>
              <th className="px-4 py-3 font-medium text-brand-900">Tipo</th>
              <th className="px-4 py-3 font-medium text-brand-900">Obj. Total</th>
              <th className="px-4 py-3 font-medium text-brand-900">Obj. Mes</th>
              <th className="px-4 py-3 font-medium text-brand-900">Coordinadora</th>
              <th className="px-4 py-3 font-medium text-brand-900 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const coord = agents.find((a) => a.id === c.coordinadoraId);
              return (
                <tr key={c.id} className="border-t border-surface-100 hover:bg-surface-50">
                  <td className="px-4 py-3 font-medium">{c.nombre}</td>
                  <td className="px-4 py-3 font-mono text-xs">{c.numeroContrato}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full text-white ${STATUS_COLORS[c.estado]}`}>
                      {STATUS_LABELS[c.estado]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{c.tipoObjetivo}</td>
                  <td className="px-4 py-3 font-mono">{c.objetivoTotal}h</td>
                  <td className="px-4 py-3 font-mono">{c.objetivoMensual > 0 ? `${c.objetivoMensual}h` : "—"}</td>
                  <td className="px-4 py-3 text-xs">{coord?.nombre ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-surface-100 rounded"><Pencil size={14} /></button>
                      <button onClick={() => deleteCampaign(c.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-surface-300">No hay campañas.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">{editing ? "Editar Campaña" : "Nueva Campaña"}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-surface-100 rounded"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Nombre</label>
                  <input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Nº Contrato</label>
                  <input value={form.numeroContrato} onChange={(e) => setForm((f) => ({ ...f, numeroContrato: e.target.value }))}
                    className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Estado</label>
                  <select value={form.estado} onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value as CampaignStatus }))}
                    className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm">
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Tipo Objetivo</label>
                  <select value={form.tipoObjetivo} onChange={(e) => setForm((f) => ({ ...f, tipoObjetivo: e.target.value as CampaignObjectiveType }))}
                    className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm">
                    <option value="Mensual">Mensual</option>
                    <option value="Total">Total (paquete)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Objetivo Total (h)</label>
                  <input type="number" value={form.objetivoTotal} onChange={(e) => setForm((f) => ({ ...f, objetivoTotal: +e.target.value }))}
                    className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Objetivo Mensual (h)</label>
                  <input type="number" value={form.objetivoMensual} onChange={(e) => setForm((f) => ({ ...f, objetivoMensual: +e.target.value }))}
                    disabled={form.tipoObjetivo === "Total"}
                    className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm font-mono disabled:opacity-50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Fecha Inicio</label>
                  <input type="date" value={form.fechaInicio} onChange={(e) => setForm((f) => ({ ...f, fechaInicio: e.target.value }))}
                    className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Fecha Fin</label>
                  <input type="date" value={form.fechaFin} onChange={(e) => setForm((f) => ({ ...f, fechaFin: e.target.value }))}
                    className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Coordinadora</label>
                <select value={form.coordinadoraId} onChange={(e) => setForm((f) => ({ ...f, coordinadoraId: e.target.value }))}
                  className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">— Sin asignar —</option>
                  {agents.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Idiomas requeridos (separados por coma)</label>
                <input value={form.idiomasRequeridos.join(", ")}
                  onChange={(e) => setForm((f) => ({ ...f, idiomasRequeridos: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))}
                  className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-100">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-surface-200 rounded-lg hover:bg-surface-50">Cancelar</button>
              <button onClick={save} disabled={!form.nombre} className="flex items-center gap-2 px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50">
                <Check size={16} /> {editing ? "Guardar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
