export type DayOfWeek = 'L' | 'M' | 'X' | 'J' | 'V';
export type MorningBlock = '9-14';
export type AfternoonBlock = '15-17' | '15-18' | null;

export interface DaySchedule {
  morning: boolean;       // 9-14
  afternoon: AfternoonBlock;  // null = no afternoon
}

export type WeekSchedule = Record<DayOfWeek, DaySchedule>;

export type ExperienceLevel = 'junior' | 'senior';

export interface Agent {
  id: string;
  nombre: string;
  horario: WeekSchedule;
  horasSemanales: number; // calculated
  idiomas: string[];
  campanasFormado: string[]; // campaign IDs
  campanasCoordina: string[]; // campaign IDs
  nivel: ExperienceLevel;
}

export type CampaignObjectiveType = 'Mensual' | 'Total';
export type CampaignStatus = 'en_ejecucion' | 'pre_planificada' | 'pipeline' | 'finalizada';

export interface Campaign {
  id: string;
  nombre: string;
  numeroContrato: string;
  tipoObjetivo: CampaignObjectiveType;
  objetivoMensual: number; // 0 if Total type
  objetivoTotal: number;
  fechaInicio: string;
  fechaFin: string;
  estado: CampaignStatus;
  coordinadoraId: string; // agent ID
  idiomasRequeridos: string[];
  // CRM data (updated via import)
  horasRealizadasTotal: number;
  horasPlanificadasTotal: number;
  horasRealizadasMes: number;
  horasPlanificadasMes: number;
}

// Weekly plan: hours per campaign per week
export interface WeeklyPlanEntry {
  campaignId: string;
  weekKey: string; // "2026-W15"
  hours: number;
}

// Assignment matrix: agent-campaign-week
export interface AssignmentCell {
  agentId: string;
  campaignId: string;
  weekKey: string;
  hours: number;
}

export const DAYS: DayOfWeek[] = ['L', 'M', 'X', 'J', 'V'];
export const DAY_LABELS: Record<DayOfWeek, string> = {
  L: 'Lunes', M: 'Martes', X: 'Miércoles', J: 'Jueves', V: 'Viernes',
};

export const STATUS_LABELS: Record<CampaignStatus, string> = {
  en_ejecucion: 'En ejecución',
  pre_planificada: 'Pre-planificada',
  pipeline: 'Pipeline',
  finalizada: 'Finalizada',
};

export const STATUS_COLORS: Record<CampaignStatus, string> = {
  en_ejecucion: 'bg-status-green',
  pre_planificada: 'bg-status-blue',
  pipeline: 'bg-status-orange',
  finalizada: 'bg-surface-300',
};

export function calcWeeklyHours(schedule: WeekSchedule): number {
  let total = 0;
  for (const day of DAYS) {
    const d = schedule[day];
    if (d.morning) total += 5; // 9-14 = 5h
    if (d.afternoon === '15-17') total += 2;
    if (d.afternoon === '15-18') total += 3;
  }
  return total;
}

export function defaultSchedule(): WeekSchedule {
  const s: Partial<WeekSchedule> = {};
  for (const d of DAYS) {
    s[d] = { morning: true, afternoon: null };
  }
  return s as WeekSchedule;
}
