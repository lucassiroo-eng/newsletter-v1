import { useState, useRef } from "react";
import { useAppStore } from "@/store/appStore";
import Papa from "papaparse";
import { Upload, CheckCircle, AlertTriangle, FileSpreadsheet } from "lucide-react";

interface CrmRow {
  nombre_campana?: string;
  numero_contrato?: string;
  horas_realizadas_total?: string;
  horas_planificadas_total?: string;
  horas_realizadas_mes?: string;
  horas_planificadas_mes?: string;
  [key: string]: string | undefined;
}

export function ImportPage() {
  const { campaigns, updateCampaignCrmData } = useAppStore();
  const [results, setResults] = useState<{ matched: string[]; unmatched: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResults(null);

    Papa.parse<CrmRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        if (res.errors.length > 0) {
          setError("Error al leer el archivo: " + res.errors[0]?.message);
          return;
        }

        const matched: string[] = [];
        const unmatched: string[] = [];

        for (const row of res.data) {
          const contrato = row.numero_contrato?.trim();
          const nombre = row.nombre_campana?.trim() ?? contrato ?? "Desconocida";

          if (!contrato) {
            unmatched.push(nombre + " (sin nº contrato)");
            continue;
          }

          const ok = updateCampaignCrmData(contrato, {
            horasRealizadasTotal: parseFloat(row.horas_realizadas_total ?? "0") || 0,
            horasPlanificadasTotal: parseFloat(row.horas_planificadas_total ?? "0") || 0,
            horasRealizadasMes: parseFloat(row.horas_realizadas_mes ?? "0") || 0,
            horasPlanificadasMes: parseFloat(row.horas_planificadas_mes ?? "0") || 0,
          });

          if (ok) matched.push(nombre);
          else unmatched.push(nombre + ` (${contrato})`);
        }

        setResults({ matched, unmatched });
      },
    });
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-brand-950 mb-2">Importar datos del CRM</h1>
      <p className="text-sm text-surface-300 mb-6">
        Sube el archivo CSV exportado del Suite CRM. Se mapeará por número de contrato.
      </p>

      <div className="bg-white rounded-xl border border-surface-200 p-6 mb-6">
        <h3 className="text-sm font-medium mb-3">Formato esperado del CSV</h3>
        <div className="bg-surface-50 rounded-lg p-4 font-mono text-xs overflow-x-auto mb-4">
          <div>nombre_campana,numero_contrato,horas_realizadas_total,horas_planificadas_total,horas_realizadas_mes,horas_planificadas_mes</div>
          <div className="text-surface-300">Vodafone Retención,CT-2026-0001,120,30,25,10</div>
        </div>

        <div className="flex items-center gap-4">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFile}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium"
          >
            <Upload size={16} /> Seleccionar archivo CSV
          </button>
          <span className="text-xs text-surface-300">{campaigns.length} campañas en la app</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-4">
          <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          {results.matched.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={16} className="text-green-600" />
                <h3 className="text-sm font-medium text-green-800">{results.matched.length} campañas actualizadas</h3>
              </div>
              <ul className="text-xs text-green-700 space-y-0.5">
                {results.matched.map((m) => <li key={m}>✓ {m}</li>)}
              </ul>
            </div>
          )}
          {results.unmatched.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-orange-600" />
                <h3 className="text-sm font-medium text-orange-800">{results.unmatched.length} campañas NO encontradas</h3>
              </div>
              <p className="text-xs text-orange-700 mb-2">Estas campañas del CRM no coinciden con ningún nº de contrato en la app:</p>
              <ul className="text-xs text-orange-700 space-y-0.5">
                {results.unmatched.map((u) => <li key={u}>⚠ {u}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
