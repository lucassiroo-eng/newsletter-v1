import { useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { FileDown, Eye } from 'lucide-react';
import Papa from 'papaparse';

export default function ExportPage() {
  const { agents, campaigns, planningCells } = useAppStore();

  const exportRows = useMemo(() => {
    const rows: { Agente: string; AgentID: string; Campaña: string; CampaignID: string; Horas: number }[] = [];
    for (const cell of planningCells) {
      if (cell.horas <= 0) continue;
      const agent = agents.find((a) => a.id === cell.agent_id);
      const campaign = campaigns.find((c) => c.id === cell.campaign_id);
      if (!agent || !campaign) continue;
      rows.push({
        Agente: agent.nombre,
        AgentID: agent.id,
        Campaña: campaign.nombre,
        CampaignID: campaign.id,
        Horas: cell.horas,
      });
    }
    return rows.sort((a, b) => a.Campaña.localeCompare(b.Campaña) || a.Agente.localeCompare(b.Agente));
  }, [agents, campaigns, planningCells]);

  const handleExport = () => {
    // CRM format: flat list with columns matching Suite CRM import
    const crmRows = exportRows.map((r) => ({
      'Contract Name': r.Campaña,
      'Subject': r.Campaña,
      'Assigned User Name': r.AgentID,
      'Duration hours': r.Horas,
      'Duration minutes': 0,
    }));
    const csv = Papa.unparse(crmRows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suite_crm_import_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalHoras = exportRows.reduce((s, r) => s + r.Horas, 0);
  const uniqueAgents = new Set(exportRows.map((r) => r.AgentID)).size;
  const uniqueCampaigns = new Set(exportRows.map((r) => r.CampaignID)).size;

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Exportar para Suite CRM</h1>
          <p className="text-sm text-muted-foreground">Genera el archivo CSV con el formato exacto para importar tareas en Suite CRM.</p>
        </div>
        <Button onClick={handleExport} disabled={exportRows.length === 0} className="gap-2">
          <FileDown className="w-4 h-4" /> Generar CSV para CRM
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-xs text-muted-foreground font-medium uppercase">Tareas a Exportar</div>
          <div className="text-2xl font-bold font-mono-nums mt-1">{exportRows.length}</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-xs text-muted-foreground font-medium uppercase">Horas Totales</div>
          <div className="text-2xl font-bold font-mono-nums mt-1">{totalHoras}h</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-xs text-muted-foreground font-medium uppercase">Agentes / Campañas</div>
          <div className="text-2xl font-bold font-mono-nums mt-1">{uniqueAgents} / {uniqueCampaigns}</div>
        </div>
      </div>

      {exportRows.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">
          No hay asignaciones en el Puzzle. Ve al Tab 4 y asigna horas primero.
        </div>
      ) : (
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <div className="p-3 bg-muted/30 border-b flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Vista previa del CSV</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-semibold">Contract Name</th>
                <th className="text-left p-3 font-semibold">Assigned User</th>
                <th className="text-center p-3 font-semibold">Duration Hours</th>
              </tr>
            </thead>
            <tbody>
              {exportRows.map((r, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-3 font-medium">{r.Campaña}</td>
                  <td className="p-3">{r.Agente} <span className="text-muted-foreground text-xs">({r.AgentID})</span></td>
                  <td className="p-3 text-center font-mono-nums font-semibold">{r.Horas}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
