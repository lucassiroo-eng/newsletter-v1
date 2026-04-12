import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import type { Agent, DayOfWeek, AfternoonBlock } from "@/types/models";
import { DAYS, DAY_LABELS, calcWeeklyHours, defaultSchedule } from "@/types/models";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";

export function AgentsPage() {
  const { agents, campaigns, addAgent, updateAgent, deleteAgent } = useAppStore();
  const [editing, setEditing] = useState<Agent | null>(null);
  const [showForm, setShowForm] = useState(false);

  const emptyAgent = (): Agent => ({
    id: `agent-${Date.now()}`,
    nombre: "",
    horario: defaultSchedule(),
    horasSemanales: 25,
    idiomas: ["Español"],
    campanasFormado: [],
    campanasCoordina: [],
    nivel: "junior",
  });

  const [form, setForm] = useState<Agent>(emptyAgent());

  const openNew = () => { setForm(emptyAgent()); setEditing(null); setShowForm(true); };
  const openEdit = (a: Agent) => { setForm({ ...a, horario: JSON.parse(JSON.stringify(a.horario)) }); setEditing(a); setShowForm(true); };

  const save = () => {
    const updated = { ...form, horasSemanales: calcWeeklyHours(form.horario) };
    if (editing) {
      updateAgent(editing.id, updated);
    } else {
      addAgent(updated);
    }
    setShowForm(false);
  };

  const toggleMorning = (day: DayOfWeek) => {
    setForm((f) => ({
      ...f,
      horario: { ...f.horario, [day]: { ...f.horario[day], morning: !f.horario[day].morning } },
    }));
  };

  const setAfternoon = (day: DayOfWeek, val: AfternoonBlock) => {
    setForm((f) => ({
      ...f,
      horario: { ...f.horario, [day]: { ...f.horario[day], afternoon: val } },
    }));
  };

  const getCampName = (id: string) => campaigns.find((c) => c.id === id)?.nombre ?? id;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-950">Agentes</h1>
          <p className="text-sm text-surface-300 mt-1">{agents.length} agentes registrados</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium"
        >
          <Plus size={16} /> Nuevo Agente
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-50 text-left">
              <th className="px-4 py-3 font-medium text-brand-900">Nombre</th>
              <th className="px-4 py-3 font-medium text-brand-900">Nivel</th>
              <th className="px-4 py-3 font-medium text-brand-900">Horas/sem</th>
              <th className="px-4 py-3 font-medium text-brand-900">Idiomas</th>
              <th className="px-4 py-3 font-medium text-brand-900">Campañas formado</th>
              <th className="px-4 py-3 font-medium text-brand-900">Coordina</th>
              <th className="px-4 py-3 font-medium text-brand-900 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.id} className="border-t border-surface-100 hover:bg-surface-50">
                <td className="px-4 py-3 font-medium">{a.nombre}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${a.nivel === "senior" ? "bg-brand-100 text-brand-700" : "bg-surface-100 text-surface-300"}`}>
                    {a.nivel}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono">{a.horasSemanales}h</td>
                <td className="px-4 py-3 text-xs">{a.idiomas.join(", ")}</td>
                <td className="px-4 py-3 text-xs">{a.campanasFormado.length} camp.</td>
                <td className="px-4 py-3 text-xs">{a.campanasCoordina.map(getCampName).join(", ") || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(a)} className="p-1.5 hover:bg-surface-100 rounded"><Pencil size={14} /></button>
                    <button onClick={() => deleteAgent(a.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {agents.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-surface-300">No hay agentes. Añade uno o carga datos de ejemplo.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">{editing ? "Editar Agente" : "Nuevo Agente"}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-surface-100 rounded"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              {/* Name & Level */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Nombre</label>
                  <input
                    value={form.nombre}
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="Nombre del agente"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Nivel</label>
                  <select
                    value={form.nivel}
                    onChange={(e) => setForm((f) => ({ ...f, nivel: e.target.value as "junior" | "senior" }))}
                    className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="junior">Junior</option>
                    <option value="senior">Senior</option>
                  </select>
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-xs font-medium mb-1">Idiomas (separados por coma)</label>
                <input
                  value={form.idiomas.join(", ")}
                  onChange={(e) => setForm((f) => ({ ...f, idiomas: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))}
                  className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Español, Inglés, Francés"
                />
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-xs font-medium mb-2">Horario semanal ({calcWeeklyHours(form.horario)}h)</label>
                <div className="grid grid-cols-5 gap-2">
                  {DAYS.map((day) => (
                    <div key={day} className="border border-surface-200 rounded-lg p-2">
                      <div className="text-xs font-medium text-center mb-2">{DAY_LABELS[day]}</div>
                      <label className="flex items-center gap-1.5 text-xs mb-1.5 cursor-pointer">
                        <input type="checkbox" checked={form.horario[day].morning} onChange={() => toggleMorning(day)} className="rounded" />
                        9–14h
                      </label>
                      <select
                        value={form.horario[day].afternoon ?? ""}
                        onChange={(e) => setAfternoon(day, (e.target.value || null) as AfternoonBlock)}
                        className="w-full text-xs border border-surface-200 rounded px-1 py-1"
                      >
                        <option value="">Sin tarde</option>
                        <option value="15-17">15–17h</option>
                        <option value="15-18">15–18h</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Campaigns trained */}
              <div>
                <label className="block text-xs font-medium mb-1">Campañas formado/a</label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto border border-surface-200 rounded-lg p-2">
                  {useAppStore.getState().campaigns.map((c) => (
                    <label key={c.id} className="flex items-center gap-1 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.campanasFormado.includes(c.id)}
                        onChange={(e) => {
                          setForm((f) => ({
                            ...f,
                            campanasFormado: e.target.checked
                              ? [...f.campanasFormado, c.id]
                              : f.campanasFormado.filter((id) => id !== c.id),
                          }));
                        }}
                        className="rounded"
                      />
                      {c.nombre}
                    </label>
                  ))}
                </div>
              </div>

              {/* Campaigns coordinating */}
              <div>
                <label className="block text-xs font-medium mb-1">Campañas que coordina</label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto border border-surface-200 rounded-lg p-2">
                  {useAppStore.getState().campaigns.map((c) => (
                    <label key={c.id} className="flex items-center gap-1 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.campanasCoordina.includes(c.id)}
                        onChange={(e) => {
                          setForm((f) => ({
                            ...f,
                            campanasCoordina: e.target.checked
                              ? [...f.campanasCoordina, c.id]
                              : f.campanasCoordina.filter((id) => id !== c.id),
                          }));
                        }}
                        className="rounded"
                      />
                      {c.nombre}
                    </label>
                  ))}
                </div>
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
