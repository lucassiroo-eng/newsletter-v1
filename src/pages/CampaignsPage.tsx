import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import type { Campaign, CampaignObjectiveType } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Plus, Pencil, Trash2, Star, Search, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

function CampaignForm({ campaign, onSave, onCancel }: { campaign?: Campaign; onSave: (c: Campaign) => void; onCancel: () => void }) {
  const agents = useAppStore((s) => s.agents);
  const [nombre, setNombre] = useState(campaign?.nombre || '');
  const [tipo, setTipo] = useState<CampaignObjectiveType>(campaign?.tipo_objetivo || 'Mensual');
  const [objetivoAnual, setObjetivoAnual] = useState(campaign?.objetivo_anual || 0);
  const [objetivoMensual, setObjetivoMensual] = useState(campaign?.objetivo_mensual || 0);
  const [objetivoSemanal, setObjetivoSemanal] = useState(campaign?.objetivo_horas || 0);
  const [coordId, setCoordId] = useState(campaign?.coordinadora_id || '');
  const [esSc4l, setEsSc4l] = useState(campaign?.es_sc4l || false);

  const handleSubmit = () => {
    if (!nombre.trim()) return;
    onSave({
      id: campaign?.id || crypto.randomUUID(),
      nombre: nombre.trim(),
      tipo_objetivo: tipo,
      objetivo_horas: objetivoSemanal,
      objetivo_anual: objetivoAnual,
      objetivo_mensual: objetivoMensual,
      horas_realizadas_ytd: campaign?.horas_realizadas_ytd || 0,
      horas_planificadas_ytd: campaign?.horas_planificadas_ytd || 0,
      coordinadora_id: coordId || null,
      es_sc4l: esSc4l,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground">Nombre de Campaña</label>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Tipo Objetivo</label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as CampaignObjectiveType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Mensual">Mensual</SelectItem>
              <SelectItem value="Total">Total</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Objetivo Anual (h)</label>
          <Input type="number" value={objetivoAnual} onChange={(e) => setObjetivoAnual(Number(e.target.value))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Objetivo Mensual (h)</label>
          <Input type="number" value={objetivoMensual} onChange={(e) => setObjetivoMensual(Number(e.target.value))} />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Objetivo Semanal (h)</label>
          <Input type="number" value={objetivoSemanal} onChange={(e) => setObjetivoSemanal(Number(e.target.value))} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground">Coordinadora</label>
        <Select value={coordId || "none"} onValueChange={(v) => setCoordId(v === "none" ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Ninguna</SelectItem>
            {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
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

type SortKey = 'nombre' | 'objetivo_anual' | 'progreso' | 'objetivo_horas';

export default function CampaignsPage() {
  const { campaigns, agents, skills, addCampaign, updateCampaign, deleteCampaign } = useAppStore();
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('nombre');
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  const getCoordName = (campaignId: string) => {
    const coordSkill = skills.find((s) => s.campaign_id === campaignId && s.rol === 'Coordinadora');
    if (!coordSkill) return null;
    return agents.find((a) => a.id === coordSkill.agent_id)?.nombre || null;
  };

  const getProgress = (c: Campaign) => {
    if (c.objetivo_anual <= 0) return 0;
    return Math.round(((c.horas_realizadas_ytd + c.horas_planificadas_ytd) / c.objetivo_anual) * 100);
  };

  const getMonthlyPace = (c: Campaign) => {
    // Simple pace indicator: are we on track for annual?
    const now = new Date();
    const monthsPassed = now.getMonth() + (now.getDate() / 30);
    if (c.objetivo_anual <= 0 || monthsPassed === 0) return 'neutral';
    const expectedPct = (monthsPassed / 12) * 100;
    const actualPct = (c.horas_realizadas_ytd / c.objetivo_anual) * 100;
    if (actualPct >= expectedPct - 5) return 'on-track';
    return 'behind';
  };

  const filtered = useMemo(() => {
    let result = campaigns;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.nombre.toLowerCase().includes(q));
    }
    if (showOnlyActive) {
      result = result.filter((c) => c.objetivo_horas > 0 || c.objetivo_anual > 0);
    }
    result = [...result].sort((a, b) => {
      if (sortKey === 'nombre') return a.nombre.localeCompare(b.nombre);
      if (sortKey === 'objetivo_anual') return b.objetivo_anual - a.objetivo_anual;
      if (sortKey === 'progreso') return getProgress(b) - getProgress(a);
      if (sortKey === 'objetivo_horas') return b.objetivo_horas - a.objetivo_horas;
      return 0;
    });
    return result;
  }, [campaigns, search, showOnlyActive, sortKey]);

  const totalAnual = campaigns.reduce((s, c) => s + c.objetivo_anual, 0);
  const totalRealizado = campaigns.reduce((s, c) => s + c.horas_realizadas_ytd, 0);
  const totalSemanal = campaigns.reduce((s, c) => s + c.objetivo_horas, 0);

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Campañas</h1>
          <p className="text-sm text-muted-foreground">{campaigns.length} campañas · {totalSemanal}h/semana</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="w-4 h-4" /> Nueva Campaña</Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-card border rounded-lg p-3">
          <div className="text-[10px] text-muted-foreground font-medium uppercase">Obj. Anual Total</div>
          <div className="text-xl font-bold font-mono-nums">{totalAnual.toLocaleString()}h</div>
        </div>
        <div className="bg-card border rounded-lg p-3">
          <div className="text-[10px] text-muted-foreground font-medium uppercase">Realizado YTD</div>
          <div className="text-xl font-bold font-mono-nums">{totalRealizado.toLocaleString()}h</div>
          <div className="text-xs text-muted-foreground">{totalAnual > 0 ? `${Math.round((totalRealizado / totalAnual) * 100)}%` : '—'} del anual</div>
        </div>
        <div className="bg-card border rounded-lg p-3">
          <div className="text-[10px] text-muted-foreground font-medium uppercase">Obj. Semanal Total</div>
          <div className="text-xl font-bold font-mono-nums">{totalSemanal}h</div>
        </div>
      </div>

      {/* Search & filter */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar campaña..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-2.5"><X className="h-4 w-4 text-muted-foreground" /></button>}
        </div>
        <button
          onClick={() => setShowOnlyActive(!showOnlyActive)}
          className={cn("px-3 py-1.5 rounded-md text-xs font-medium border transition-colors", showOnlyActive ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border")}
        >
          Solo activas
        </button>
        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="nombre">Ordenar: Nombre</SelectItem>
            <SelectItem value="objetivo_anual">Ordenar: Obj. Anual</SelectItem>
            <SelectItem value="progreso">Ordenar: Progreso</SelectItem>
            <SelectItem value="objetivo_horas">Ordenar: Obj. Semanal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-2.5 font-semibold">Campaña</th>
              <th className="text-center p-2.5 font-semibold w-[90px]">Obj. Anual</th>
              <th className="text-center p-2.5 font-semibold w-[180px]">Progreso YTD</th>
              <th className="text-center p-2.5 font-semibold w-[70px]">Obj. Mes</th>
              <th className="text-center p-2.5 font-semibold w-[70px]">Obj. Sem</th>
              <th className="text-center p-2.5 font-semibold w-[50px]">Ritmo</th>
              <th className="text-left p-2.5 font-semibold w-[100px]">Coord.</th>
              <th className="text-right p-2.5 font-semibold w-[60px]"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const pct = getProgress(c);
              const pace = getMonthlyPace(c);
              const coordName = getCoordName(c.id);
              const restante = Math.max(0, c.objetivo_anual - c.horas_realizadas_ytd - c.horas_planificadas_ytd);
              return (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="p-2.5">
                    <div className="font-medium text-xs">{c.nombre}</div>
                    <div className="flex gap-1 mt-0.5">
                      {c.es_sc4l && <span className="text-[9px] px-1 py-0.5 rounded bg-warning/20 text-warning font-semibold">SC4L</span>}
                    </div>
                  </td>
                  <td className="p-2.5 text-center font-mono-nums text-xs">{c.objetivo_anual > 0 ? `${c.objetivo_anual}h` : '—'}</td>
                  <td className="p-2.5">
                    {c.objetivo_anual > 0 ? (
                      <div className="flex items-center gap-2">
                        <Progress value={Math.min(pct, 100)} className="h-2 flex-1" />
                        <div className="flex flex-col items-end">
                          <span className={cn("text-[10px] font-mono-nums font-bold", pct >= 100 ? "text-success" : pct >= 70 ? "text-foreground" : "text-muted-foreground")}>{pct}%</span>
                          <span className="text-[9px] text-muted-foreground font-mono-nums">{c.horas_realizadas_ytd}h</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-2.5 text-center font-mono-nums text-xs">{c.objetivo_mensual > 0 ? `${c.objetivo_mensual}h` : '—'}</td>
                  <td className="p-2.5 text-center font-mono-nums text-xs font-bold">{c.objetivo_horas > 0 ? `${c.objetivo_horas}h` : '—'}</td>
                  <td className="p-2.5 text-center">
                    {c.objetivo_anual > 0 ? (
                      pace === 'on-track' ? <TrendingUp className="w-4 h-4 text-success inline" /> :
                      pace === 'behind' ? <TrendingDown className="w-4 h-4 text-destructive inline" /> :
                      <Minus className="w-4 h-4 text-muted-foreground inline" />
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="p-2.5 text-xs">{coordName ? <span>👑 {coordName}</span> : <span className="text-muted-foreground">—</span>}</td>
                  <td className="p-2.5 text-right">
                    <button onClick={() => setEditing(c)} className="p-1 rounded hover:bg-muted transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteCampaign(c.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors ml-0.5"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No hay campañas que coincidan.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={creating || !!editing} onOpenChange={() => { setCreating(false); setEditing(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Editar Campaña' : 'Nueva Campaña'}</DialogTitle></DialogHeader>
          <CampaignForm
            campaign={editing || undefined}
            onSave={(c) => { editing ? updateCampaign(c) : addCampaign(c); setCreating(false); setEditing(null); }}
            onCancel={() => { setCreating(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
