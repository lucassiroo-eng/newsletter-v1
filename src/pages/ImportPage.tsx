import { useCallback, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

export default function ImportPage() {
  const { campaigns, updateCampaignCRM } = useAppStore();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [unmatched, setUnmatched] = useState<string[]>([]);

  const handleFile = useCallback((file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          let matched = 0;
          const notFound: string[] = [];
          for (const row of results.data as Record<string, string>[]) {
            const contrato = row['Número Contrato'] || row['numero_contrato'] || row['Contract'] || '';
            const nombre = row['Campaña'] || row['Campaign'] || row['campaña'] || row['Nombre'] || '';
            const hrTotal = parseFloat(row['Horas Realizadas Total'] || row['horas_realizadas_total'] || '0');
            const hpTotal = parseFloat(row['Horas Planificadas Total'] || row['horas_planificadas_total'] || '0');
            const hrMes = parseFloat(row['Horas Realizadas Mes'] || row['horas_realizadas_mes'] || '0');
            const hpMes = parseFloat(row['Horas Planificadas Mes'] || row['horas_planificadas_mes'] || '0');

            const campaign = campaigns.find(c =>
              c.numero_contrato.toLowerCase() === contrato.toLowerCase() ||
              c.nombre.toLowerCase() === (contrato || nombre).toLowerCase()
            );
            if (campaign) {
              updateCampaignCRM(campaign.id, {
                horas_realizadas_total: hrTotal,
                horas_planificadas_total: hpTotal,
                horas_realizadas_mes: hrMes,
                horas_planificadas_mes: hpMes,
              });
              matched++;
            } else if (contrato || nombre) {
              notFound.push(contrato || nombre);
            }
          }
          setUnmatched(notFound);
          setStatus('success');
          setMessage(`${matched} campañas actualizadas.${notFound.length > 0 ? ` ${notFound.length} no coinciden.` : ''}`);
        } catch {
          setStatus('error');
          setMessage('Error al procesar el archivo.');
        }
      },
      error: () => { setStatus('error'); setMessage('Error al leer el archivo.'); },
    });
  }, [campaigns, updateCampaignCRM]);

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Carga de Datos CRM</h1>
        <p className="text-sm text-muted-foreground">Sube el reporte CSV/Excel del Suite CRM. Se mapea automáticamente por número de contrato.</p>
      </div>

      <div className="max-w-lg">
        <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-accent/30 transition-colors">
          <Upload className="w-10 h-10 text-muted-foreground mb-3" />
          <span className="text-sm font-medium text-muted-foreground">Arrastra o haz clic para subir CSV</span>
          <span className="text-xs text-muted-foreground mt-1">Columnas: Número Contrato, Horas Realizadas Total, Horas Planificadas Total, Horas Realizadas Mes, Horas Planificadas Mes</span>
          <input type="file" accept=".csv,.xlsx" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>

        {status !== 'idle' && (
          <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${status === 'success' ? 'bg-accent text-accent-foreground' : 'bg-destructive/10 text-destructive'}`}>
            {status === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
            <div>
              <span className="text-sm font-medium">{message}</span>
              {unmatched.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-semibold text-destructive mb-1">⚠️ Campañas no encontradas:</div>
                  <ul className="text-xs space-y-0.5">
                    {unmatched.map((u, i) => <li key={i} className="text-muted-foreground">• {u}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
