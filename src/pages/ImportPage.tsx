import { useCallback, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import type { CampaignWeeklyData } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

export default function ImportPage() {
  const { campaigns, setWeeklyData } = useAppStore();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFile = useCallback((file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data: CampaignWeeklyData[] = [];
          for (const row of results.data as Record<string, string>[]) {
            const campaignName = row['Campaña'] || row['Campaign'] || row['campaign'] || row['campaña'];
            const horasRealizadas = parseFloat(row['Horas Realizadas'] || row['horas_realizadas'] || '0');
            const horasPlanificadas = parseFloat(row['Horas Planificadas'] || row['horas_planificadas'] || '0');

            const campaign = campaigns.find((c) => c.nombre.toLowerCase() === campaignName?.toLowerCase());
            if (campaign) {
              data.push({ campaign_id: campaign.id, horas_realizadas: horasRealizadas, horas_planificadas: horasPlanificadas });
            }
          }
          setWeeklyData(data);
          setStatus('success');
          setMessage(`${data.length} campañas importadas correctamente.`);
        } catch {
          setStatus('error');
          setMessage('Error al procesar el archivo.');
        }
      },
      error: () => {
        setStatus('error');
        setMessage('Error al leer el archivo CSV.');
      },
    });
  }, [campaigns, setWeeklyData]);

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Importar Datos Semanales</h1>
        <p className="text-sm text-muted-foreground">Sube el reporte CSV de Suite CRM con las horas realizadas y planificadas</p>
      </div>

      <div className="max-w-lg">
        <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-accent/30 transition-colors">
          <Upload className="w-10 h-10 text-muted-foreground mb-3" />
          <span className="text-sm font-medium text-muted-foreground">Arrastra o haz clic para subir CSV</span>
          <span className="text-xs text-muted-foreground mt-1">Columnas: Campaña, Horas Realizadas, Horas Planificadas</span>
          <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>

        {status !== 'idle' && (
          <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${status === 'success' ? 'bg-accent text-accent-foreground' : 'bg-destructive/10 text-destructive'}`}>
            {status === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
