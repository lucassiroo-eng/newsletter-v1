export type TimeBlock = "9 a 2" | "3 a 5" | "3 a 6";

export const TIME_BLOCK_HOURS: Record<TimeBlock, number> = {
  "9 a 2": 5,
  "3 a 5": 2,
  "3 a 6": 3,
};

export const ALL_TIME_BLOCKS: TimeBlock[] = ["9 a 2", "3 a 5", "3 a 6"];

export type CampaignObjectiveType = "Mensual" | "Total";

export type AgentRole = "Coordinadora" | "Agente de Apoyo" | "Agente de Cierre";
export const ALL_AGENT_ROLES: AgentRole[] = ["Coordinadora", "Agente de Apoyo", "Agente de Cierre"];

export interface Agent {
  id: string;
  nombre: string;
  horas_maximas_semanales: number;
  bloques_horarios: TimeBlock[];
}

export interface Campaign {
  id: string;
  nombre: string;
  tipo_objetivo: CampaignObjectiveType;
  objetivo_horas: number; // weekly target for planning
  objetivo_anual: number;
  objetivo_mensual: number;
  horas_realizadas_ytd: number;
  horas_planificadas_ytd: number;
  coordinadora_id: string | null;
  es_sc4l: boolean;
}

export type SkillPriority = 1 | 2 | 3;

export interface SkillEntry {
  agent_id: string;
  campaign_id: string;
  prioridad: SkillPriority;
  rol: AgentRole;
}

export interface CampaignWeeklyData {
  campaign_id: string;
  horas_realizadas: number;
  horas_planificadas: number;
}

export interface PlanningCell {
  campaign_id: string;
  agent_id: string;
  horas: number;
}

export interface AgentException {
  agent_id: string;
  semana: string; // ISO week string
  horas_disponibles: number;
  motivo: string;
}
