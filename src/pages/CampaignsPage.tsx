import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import type { Campaign, CampaignObjectiveType, CampaignStatus } from '@/types/models';
import { CAMPAIGN_STATUS_LABELS } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Plus, Pencil, Trash2, Search, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

function CampaignForm({ campaign, onSave, onCancel }: { campaign?: Campaign; onSave: (c: Campaign) => void; onCancel: () => void }) {
  const agents = useAppStore(s => s.agents);
  const [nombre, setNombre] = useState(campaign?.nombre || '');
  const [contrato, setContrato] = useState(campaign?.numero_contrato || '');
  const [tipo, setTipo] = useState<CampaignObjectiveType>(campaign?.tipo_objetivo || 'Mensual');
  const [objetivoTotal, setObjetivoTotal] = useState(campaign?.objetivo_total || 0);
  const [objetivoMensual, setObjetivoMensual] = useState(campaign?.objetivo_mensual || 0);
  const [fechaInicio, setFechaInicio] = useState(campaign?.fecha_inicio || '');
  const [fechaFin, setFechaFin] = useState(campaign?.fecha_fin || '');
  const [estado, setEstado] = useState<CampaignStatus>(campaign?.estado || 'en_ejecucion');
  const [coordId, setCoordId] = useState(campaign?.coordinadora_id || '');
  const [idiomas, setIdiomas] = useState(campaign?.idiomas_requeridos.join(', ') || 'Español');
  const [esSc4l, setEsSc4l] = useState(campaign?.es_sc4l || false);

  const handleSubmit = () => {
    if (!nombre.trim()) return;
    onSave({
      id: campaign?.id || crypto.randomUUID(),
      nombre: nombre.trim(),
      numero_contrato: contrato.trim() || nombre.trim(),
      tipo_objetivo: tipo,
      objetivo_total: objetivoTotal,
      objetivo_mensual: objetivoMensual,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      estado,
      coordinadora_id: coordId || null,
      idiomas_requeridos: idiomas.split(',').map(s => s.trim()).filter(Boolean),
      es_sc4l: esSc4l,
      horas_realizadas_total: campaign?.horas_realizadas_total || 0,
      horas_planificadas_total: campaign?.horas_planificadas_total || 0,
      horas_realizadas_mes: campaign?.horas_realizadas_mes || 0,
      horas_planificadas_mes: campaign?.horas_planificadas_mes || 0,
    });
  };

  return (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto">
      <div>
        <label className="text-sm font-medium text-muted-foreground">Nombre</label>
        <Input value={nombre} onChange={e => setNombre(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Nº Contrato (Suite)</label>
          <Input value={contrato} onChange={e => setContrato(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Estado</label>
          <Select value={estado} onValueChange={v => setEstado(v as CampaignStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CAMPAIGN_STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Tipo Objetivo</label>
          <Select value={tipo} onValueChange={v => setTipo(v as CampaignObjectiveType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Mensual">Mensual</SelectItem>
              <SelectItem value="Total">Paquete Total</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Obj. Total (h)</label>
          <Input type="number" value={objetivoTotal} onChange={e => setObjetivoTotal(Number(e.target.value))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Obj. Mensual (h)</label>
          <Input type="number" value={objetivoMensual} onChange={e => setObjetivoMensual(Number(e.target.value))} />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Coordinadora</label>
          <Select value={coordId || "none"} onValueChange={v => setCoordId(v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Ninguna</SelectItem>
              {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Fecha Inicio</label>
          <Input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Fecha Fin</label>
          <Input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground">Idiomas requeridos</label>
        <Input value={idiomas} onChange={e => setIdiomas(e.target.value)} placeholder="Español, Inglés" />
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={esSc4l} onCheckedChange={setEsSc4l} />
        <label className="text-sm font-medium">Es SC4L</label>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSubmit}>{campaign ? 'Guardar' : 'Crear'}</Button>
      </div>
    </div>
  );
}

type SortKey = 'nombre' | 'objetivo_total' | 'progreso' | 'estado';

export default function CampaignsPage() {
  const { campaigns, agents, skills, addCampaign, updateCampaign, deleteCampaign } = useAppStore();
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('nombre');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getCoordName = (cId: string) => {
    const cs = skills.find(s => s.campaign_id === cId && s.rol === 'Coordinadora');
    return cs ? agents.find(a => a.id === cs.agent_id)?.nombre || null : null;
  };

  const getProgress = (c: Campaign) => c.objetivo_total <= 0 ? 0 :
    Math.round(((c.horas_realizadas_total + c.horas_planificadas_total) / c.objetivo_total) * 100);

  const filtered = useMemo(() => {
    let result = campaigns;
    if (search) { const q = search.toLowerCase(); result = result.filter(c => c.nombre.toLowerCase().includes(q) || c.numero_contrato.toLowerCase().includes(q)); }
    if (statusFilter !== 'all') result = result.filter(c => c.estado === statusFilter);
    return [...result].sort((a, b) => {
      if (sortKey === 'nombre') return a.nombre.localeCompare(b.nombre);
      if (sortKey === 'objetivo_total') return b.objetivo_total - a.objetivo_total;
      if (sortKey === 'progreso') return getProgress(b) - getProgress(a);
      if (sortKey === 'estado') return a.estado.localeCompare(b.estado);
      return 0;
    });
  }, [campaigns, search, statusFilter, sortKey]);

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Campañas</h1>
          <p className="text-sm text-muted-foreground">{campaigns.length} campañas</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="w-4 h-4" /> Nueva Campaña</Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 max-w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar campaña o contrato..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-2.5"><X className="h-4 w-4 text-muted-foreground" /></button>}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(CAMPAIGN_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortKey} onValueChange={v => setSortKey(v as SortKey)}>
          <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="nombre">Nombre</SelectItem>
            <SelectItem value="objetivo_total">Obj. Total</SelectItem>
            <SelectItem value="progreso">Progreso</SelectItem>
            <SelectItem value="estado">Estado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-2.5 font-semibold">Campaña</th>
              <th className="text-center p-2.5 font-semibold w-[80px]">Estado</th>
              <th className="text-center p-2.5 font-semibold w-[80px]">Obj. Total</th>
              <th className="text-center p-2.5 font-semibold w-[170px]">Progreso</th>
              <th className="text-center p-2.5 font-semibold w-[70px]">Obj. Mes</th>
              <th className="text-left p-2.5 font-semibold w-[90px]">Coord.</th>
              <th className="text-right p-2.5 font-semibold w-[50px]"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const pct = getProgress(c);
              const coordName = getCoordName(c.id);
              return (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-2.5">
                    <div className="font-medium text-xs">{c.nombre}</div>
                    <div className="text-[10px] text-muted-foreground">{c.numero_contrato !== c.nombre ? c.numero_contrato : ''}</div>
                    <div className="flex gap-1 mt-0.5">
                      {c.es_sc4l && <span className="text-[9px] px-1 py-0.5 rounded bg-warning/20 text-warning font-semibold">SC4L</span>}
                      {c.idiomas_requeridos.map(i => <span key={i} className="text-[9px] px-1 py-0.5 rounded bg-accent text-accent-foreground">{i}</span>)}
                    </div>
                  </td>
                  <td className="p-2.5 text-center">
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium",
                      c.estado === 'en_ejecucion' ? "bg-success/15 text-success" :
                      c.estado === 'pre_planificada' ? "bg-warning/15 text-warning" :
                      c.estado === 'pipeline' ? "bg-primary/15 text-primary" :
                      "bg-muted text-muted-foreground")}>
                      {CAMPAIGN_STATUS_LABELS[c.estado]}
                    </span>
                  </td>
                  <td className="p-2.5 text-center font-mono-nums text-xs">{c.objetivo_total > 0 ? `${c.objetivo_total}h` : '—'}</td>
                  <td className="p-2.5">
                    {c.objetivo_total > 0 ? (
                      <div className="flex items-center gap-2">
                        <Progress value={Math.min(pct, 100)} className="h-2 flex-1" />
                        <span className={cn("text-[10px] font-mono-nums font-bold w-8 text-right", pct >= 100 ? "text-success" : "text-foreground")}>{pct}%</span>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="p-2.5 text-center font-mono-nums text-xs">{c.objetivo_mensual > 0 ? `${c.objetivo_mensual}h` : '—'}</td>
                  <td className="p-2.5 text-xs">{coordName ? <span>👑 {coordName}</span> : <span className="text-muted-foreground">—</span>}</td>
                  <td className="p-2.5 text-right">
                    <button onClick={() => setEditing(c)} className="p-1 rounded hover:bg-muted"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteCampaign(c.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive ml-0.5"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No hay campañas.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={creating || !!editing} onOpenChange={() => { setCreating(false); setEditing(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Editar Campaña' : 'Nueva Campaña'}</DialogTitle></DialogHeader>
          <CampaignForm campaign={editing || undefined}
            onSave={c => { if (editing) updateCampaign(c); else addCampaign(c); setCreating(false); setEditing(null); }}
            onCancel={() => { setCreating(false); setEditing(null); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
