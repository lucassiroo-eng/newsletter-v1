export type DayOfWeek = 'L' | 'M' | 'X' | 'J' | 'V';
export const ALL_DAYS: DayOfWeek[] = ['L', 'M', 'X', 'J', 'V'];
export const DAY_LABELS: Record<DayOfWeek, string> = { L: 'Lunes', M: 'Martes', X: 'Miércoles', J: 'Jueves', V: 'Viernes' };

export type TimeBlock = "9-14" | "15-17" | "15-18";
export const ALL_TIME_BLOCKS: TimeBlock[] = ["9-14", "15-17", "15-18"];
export const TIME_BLOCK_HOURS: Record<TimeBlock, number> = { "9-14": 5, "15-17": 2, "15-18": 3 };
export const TIME_BLOCK_LABELS: Record<TimeBlock, string> = { "9-14": "Mañana 9-14h", "15-17": "Tarde 15-17h", "15-18": "Tarde 15-18h" };

export type ExperienceLevel = 'junior' | 'senior';
export type CampaignStatus = 'en_ejecucion' | 'pre_planificada' | 'pipeline' | 'finalizada';
export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  en_ejecucion: 'En ejecución', pre_planificada: 'Pre-planificada', pipeline: 'Pipeline', finalizada: 'Finalizada',
};
export type CampaignObjectiveType = 'Mensual' | 'Total';

export type AgentRole = "Coordinadora" | "Agente de Apoyo" | "Agente de Cierre";
export const ALL_AGENT_ROLES: AgentRole[] = ["Coordinadora", "Agente de Apoyo", "Agente de Cierre"];
export type SkillPriority = 1 | 2 | 3;

export interface Agent {
  id: string;
  nombre: string;
  horario: Record<DayOfWeek, TimeBlock[]>;
  horas_maximas_semanales: number;
  idiomas: string[];
  nivel: ExperienceLevel;
}

export interface Campaign {
  id: string;
  nombre: string;
  numero_contrato: string;
  tipo_objetivo: CampaignObjectiveType;
  objetivo_mensual: number;
  objetivo_total: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: CampaignStatus;
  coordinadora_id: string | null;
  idiomas_requeridos: string[];
  es_sc4l: boolean;
  horas_realizadas_total: number;
  horas_planificadas_total: number;
  horas_realizadas_mes: number;
  horas_planificadas_mes: number;
}

export interface SkillEntry {
  agent_id: string;
  campaign_id: string;
  prioridad: SkillPriority;
  rol: AgentRole;
}

export interface WeeklyPlanEntry {
  campaign_id: string;
  week: string;
  horas: number;
}

export interface PlanningCell {
  campaign_id: string;
  agent_id: string;
  week: string;
  horas: number;
}

export interface AgentException {
  agent_id: string;
  semana: string;
  horas_disponibles: number;
  motivo: string;
}

export function calcWeeklyHours(horario: Record<DayOfWeek, TimeBlock[]>): number {
  return ALL_DAYS.reduce((total, day) =>
    total + (horario[day] || []).reduce((dt, block) => dt + TIME_BLOCK_HOURS[block], 0), 0);
}

export function createDefaultSchedule(blocks: TimeBlock[]): Record<DayOfWeek, TimeBlock[]> {
  const schedule = {} as Record<DayOfWeek, TimeBlock[]>;
  for (const day of ALL_DAYS) schedule[day] = [...blocks];
  return schedule;
}
