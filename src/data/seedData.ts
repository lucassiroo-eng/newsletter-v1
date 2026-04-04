import type { Agent, Campaign, SkillEntry, WeeklyPlanEntry, PlanningCell, TimeBlock, AgentRole } from '@/types/models';
import { createDefaultSchedule } from '@/types/models';
import { getCurrentWeek } from '@/lib/weekUtils';

const AGENT_SCHEDULES: Record<string, { horas: number; bloques: TimeBlock[] }> = {
  amoreno: { horas: 37, bloques: ["9-14", "15-17", "15-18"] },
  fcortes: { horas: 37, bloques: ["9-14", "15-17", "15-18"] },
  plopez: { horas: 37, bloques: ["9-14", "15-17", "15-18"] },
  tgarcia: { horas: 37, bloques: ["9-14", "15-17", "15-18"] },
  eblanco: { horas: 37, bloques: ["9-14", "15-17", "15-18"] },
  mcandela: { horas: 37, bloques: ["9-14", "15-17", "15-18"] },
  slopez: { horas: 37, bloques: ["9-14", "15-17", "15-18"] },
  cmunoz: { horas: 37, bloques: ["9-14", "15-18"] },
  aventura: { horas: 37, bloques: ["9-14", "15-18"] },
  mgarcia: { horas: 37, bloques: ["9-14", "15-18"] },
  bgagliardi: { horas: 33, bloques: ["9-14", "15-17"] },
  cgarcia: { horas: 33, bloques: ["9-14", "15-17"] },
  srodriguez: { horas: 33, bloques: ["9-14", "15-17"] },
  lvalls: { horas: 33, bloques: ["9-14", "15-17"] },
  lbenavente: { horas: 33, bloques: ["9-14", "15-17"] },
  twright: { horas: 31, bloques: ["9-14", "15-18"] },
  amontalban: { horas: 31, bloques: ["9-14", "15-18"] },
  cwider: { horas: 30, bloques: ["9-14", "15-17"] },
  mgomez: { horas: 30, bloques: ["9-14", "15-18"] },
  ggautier: { horas: 25, bloques: ["9-14"] },
  ggrau: { horas: 25, bloques: ["9-14"] },
  ialbaladejo: { horas: 25, bloques: ["9-14"] },
  smancebo: { horas: 25, bloques: ["9-14"] },
  svelazquez: { horas: 25, bloques: ["9-14"] },
  ecarrillo: { horas: 25, bloques: ["9-14"] },
  agarcia: { horas: 25, bloques: ["9-14"] },
  eboga: { horas: 25, bloques: ["9-14"] },
  mcatalan: { horas: 25, bloques: ["9-14"] },
  cmorel: { horas: 25, bloques: ["9-14"] },
};

const AGENT_NAMES: Record<string, string> = {
  amoreno: 'A. Moreno', fcortes: 'F. Cortés', plopez: 'P. López',
  tgarcia: 'T. García', eblanco: 'E. Blanco', mcandela: 'M. Candela',
  slopez: 'S. López', bgagliardi: 'B. Gagliardi', cgarcia: 'C. García',
  srodriguez: 'S. Rodríguez', lvalls: 'L. Valls', ggrau: 'G. Grau',
  twright: 'T. Wright', mgomez: 'M. Gómez', amontalban: 'A. Montalbán',
  ggautier: 'G. Gautier', ialbaladejo: 'I. Albaladejo', smancebo: 'S. Mancebo',
  cwider: 'C. Wider', svelazquez: 'S. Velázquez', ecarrillo: 'E. Carrillo',
  mgarcia: 'M. García', lbenavente: 'L. Benavente', agarcia: 'A. García',
  cmunoz: 'C. Muñoz', aventura: 'A. Ventura', eboga: 'E. Boga',
  mcatalan: 'M. Catalán', cmorel: 'C. Morel',
};

function buildAgents(): Agent[] {
  return Object.entries(AGENT_SCHEDULES).map(([id, sched]) => ({
    id,
    nombre: AGENT_NAMES[id] || id,
    horario: createDefaultSchedule(sched.bloques),
    horas_maximas_semanales: sched.horas,
    idiomas: ['Español'],
    nivel: 'senior' as const,
  }));
}

interface CampaignSeed {
  nombre: string;
  objetivo_total: number;
  objetivo_mes: number;
  horas_realizadas_total: number;
  horas_planificadas_total: number;
  es_sc4l: boolean;
  horas_semana_actual: number;
}

const CAMPAIGN_DATA: CampaignSeed[] = [
  { nombre: '035ZEHNSDRVISITAS0624', objetivo_total: 1275, objetivo_mes: 50, horas_realizadas_total: 781, horas_planificadas_total: 210, es_sc4l: false, horas_semana_actual: 13 },
  { nombre: '040ATEISDR25HORAS0624', objetivo_total: 294, objetivo_mes: 25, horas_realizadas_total: 286, horas_planificadas_total: 0, es_sc4l: false, horas_semana_actual: 0 },
  { nombre: '059GPSSANIDAD0924', objetivo_total: 450, objetivo_mes: 0, horas_realizadas_total: 374, horas_planificadas_total: 75, es_sc4l: false, horas_semana_actual: 10 },
  { nombre: '087SC4LMIG50HOSTED1024', objetivo_total: 0, objetivo_mes: 90, horas_realizadas_total: 2018, horas_planificadas_total: 575, es_sc4l: true, horas_semana_actual: 25 },
  { nombre: '122ONERVISITAS0125', objetivo_total: 1100, objetivo_mes: 50, horas_realizadas_total: 431, horas_planificadas_total: 611, es_sc4l: false, horas_semana_actual: 13 },
  { nombre: '124DYLUVISITAS0125', objetivo_total: 1050, objetivo_mes: 100, horas_realizadas_total: 882, horas_planificadas_total: 345, es_sc4l: false, horas_semana_actual: 25 },
  { nombre: '136GIGALEADS0225', objetivo_total: 690, objetivo_mes: 100, horas_realizadas_total: 827, horas_planificadas_total: 75, es_sc4l: false, horas_semana_actual: 25 },
  { nombre: '139CEGINURTURING0225', objetivo_total: 4050, objetivo_mes: 200, horas_realizadas_total: 3111, horas_planificadas_total: 985, es_sc4l: false, horas_semana_actual: 50 },
  { nombre: '158NEXUPLYCA0425', objetivo_total: 1400, objetivo_mes: 100, horas_realizadas_total: 926, horas_planificadas_total: 1075, es_sc4l: false, horas_semana_actual: 25 },
  { nombre: '159ARMILICITACIONES0425', objetivo_total: 1134, objetivo_mes: 100, horas_realizadas_total: 964, horas_planificadas_total: 525, es_sc4l: false, horas_semana_actual: 25 },
  { nombre: '163MOJIREUNIONES0325', objetivo_total: 650, objetivo_mes: 75, horas_realizadas_total: 508, horas_planificadas_total: 130, es_sc4l: false, horas_semana_actual: 20 },
  { nombre: '179FUTULEADS0425', objetivo_total: 900, objetivo_mes: 100, horas_realizadas_total: 652, horas_planificadas_total: 500, es_sc4l: false, horas_semana_actual: 25 },
  { nombre: '182VANAREUNIONES0525', objetivo_total: 240, objetivo_mes: 0, horas_realizadas_total: 176, horas_planificadas_total: 65, es_sc4l: false, horas_semana_actual: 5 },
  { nombre: '185PENWLEADS0525', objetivo_total: 348, objetivo_mes: 42, horas_realizadas_total: 300, horas_planificadas_total: 30, es_sc4l: false, horas_semana_actual: 10 },
  { nombre: '195ECORLEADSEG0625', objetivo_total: 600, objetivo_mes: 50, horas_realizadas_total: 337, horas_planificadas_total: 250, es_sc4l: false, horas_semana_actual: 13 },
  { nombre: '203CEGIDESPACHOS0625', objetivo_total: 1600, objetivo_mes: 200, horas_realizadas_total: 1504, horas_planificadas_total: 1210, es_sc4l: false, horas_semana_actual: 50 },
  { nombre: '237SUPPSDR0925', objetivo_total: 150, objetivo_mes: 50, horas_realizadas_total: 288, horas_planificadas_total: 100, es_sc4l: false, horas_semana_actual: 13 },
  { nombre: '246SNCAS200FY261025', objetivo_total: 2215, objetivo_mes: 205, horas_realizadas_total: 1022, horas_planificadas_total: 670, es_sc4l: false, horas_semana_actual: 45 },
  { nombre: '247SNCASXRTFY261025', objetivo_total: 884, objetivo_mes: 108, horas_realizadas_total: 377, horas_planificadas_total: 265, es_sc4l: false, horas_semana_actual: 20 },
  { nombre: '248SNCASX3FY261025', objetivo_total: 884, objetivo_mes: 126, horas_realizadas_total: 443, horas_planificadas_total: 300, es_sc4l: false, horas_semana_actual: 25 },
  { nombre: '251SOFFADMINPU1025', objetivo_total: 100, objetivo_mes: 50, horas_realizadas_total: 75, horas_planificadas_total: 161, es_sc4l: false, horas_semana_actual: 10 },
  { nombre: '252LENZSDR2MESES1025', objetivo_total: 309, objetivo_mes: 50, horas_realizadas_total: 173, horas_planificadas_total: 125, es_sc4l: false, horas_semana_actual: 10 },
  { nombre: '257SNCAHRFY26', objetivo_total: 1727, objetivo_mes: 216, horas_realizadas_total: 622, horas_planificadas_total: 480, es_sc4l: false, horas_semana_actual: 40 },
  { nombre: '258ALTOSMBLEADS1025', objetivo_total: 400, objetivo_mes: 100, horas_realizadas_total: 417, horas_planificadas_total: 200, es_sc4l: false, horas_semana_actual: 25 },
  { nombre: '261NORMCOLABO1025', objetivo_total: 150, objetivo_mes: 0, horas_realizadas_total: 91, horas_planificadas_total: 58, es_sc4l: false, horas_semana_actual: 13 },
  { nombre: '277GLINREUSANIDAD1225', objetivo_total: 150, objetivo_mes: 50, horas_realizadas_total: 76, horas_planificadas_total: 85, es_sc4l: false, horas_semana_actual: 13 },
  { nombre: '280SAGE1PCSMAQAGR1225', objetivo_total: 85, objetivo_mes: 0, horas_realizadas_total: 57, horas_planificadas_total: 30, es_sc4l: false, horas_semana_actual: 10 },
  { nombre: '284COMALEADS0126', objetivo_total: 500, objetivo_mes: 100, horas_realizadas_total: 81, horas_planificadas_total: 425, es_sc4l: false, horas_semana_actual: 25 },
  { nombre: '285ABASLEADSINDUS0126', objetivo_total: 1100, objetivo_mes: 100, horas_realizadas_total: 108, horas_planificadas_total: 625, es_sc4l: false, horas_semana_actual: 25 },
  { nombre: '286PSICREUNIONES0126', objetivo_total: 150, objetivo_mes: 50, horas_realizadas_total: 52, horas_planificadas_total: 110, es_sc4l: false, horas_semana_actual: 10 },
  { nombre: '287BEE2IBERIA_0126', objetivo_total: 170, objetivo_mes: 56, horas_realizadas_total: 0, horas_planificadas_total: 105, es_sc4l: false, horas_semana_actual: 13 },
  { nombre: '288IPSOLEADSYSEG_0126', objetivo_total: 150, objetivo_mes: 50, horas_realizadas_total: 50, horas_planificadas_total: 98, es_sc4l: false, horas_semana_actual: 13 },
  { nombre: '292QUANSEGUIMIENTO0126', objetivo_total: 200, objetivo_mes: 0, horas_realizadas_total: 43, horas_planificadas_total: 150, es_sc4l: false, horas_semana_actual: 25 },
  { nombre: '293METAPOSTAREU0126', objetivo_total: 300, objetivo_mes: 0, horas_realizadas_total: 37, horas_planificadas_total: 268, es_sc4l: false, horas_semana_actual: 13 },
  { nombre: '295SAGEINFORRETAIL0126', objetivo_total: 85, objetivo_mes: 0, horas_realizadas_total: 11, horas_planificadas_total: 60, es_sc4l: false, horas_semana_actual: 10 },
  { nombre: '299ZENTENVIOS0226', objetivo_total: 200, objetivo_mes: 40, horas_realizadas_total: 379, horas_planificadas_total: 150, es_sc4l: false, horas_semana_actual: 0 },
  { nombre: 'ANVER_F2_ABR_DIC19', objetivo_total: 615, objetivo_mes: 20, horas_realizadas_total: 1358, horas_planificadas_total: 40, es_sc4l: false, horas_semana_actual: 5 },
  { nombre: 'GESTION COMERCIAL', objetivo_total: 0, objetivo_mes: 0, horas_realizadas_total: 386, horas_planificadas_total: 400, es_sc4l: false, horas_semana_actual: 25 },
  { nombre: 'GIOS_FASE2_SEP19', objetivo_total: 1793, objetivo_mes: 35, horas_realizadas_total: 1862, horas_planificadas_total: 210, es_sc4l: false, horas_semana_actual: 13 },
  { nombre: 'MONTAJE CAMPAÑAS', objetivo_total: 0, objetivo_mes: 0, horas_realizadas_total: 0, horas_planificadas_total: 240, es_sc4l: false, horas_semana_actual: 15 },
  { nombre: 'SAGAZ_COM_INT_1122', objetivo_total: 0, objetivo_mes: 0, horas_realizadas_total: 1993, horas_planificadas_total: 705, es_sc4l: false, horas_semana_actual: 15 },
  { nombre: 'SC4L', objetivo_total: 500, objetivo_mes: 75, horas_realizadas_total: 0, horas_planificadas_total: 500, es_sc4l: true, horas_semana_actual: 25 },
  { nombre: 'ULLED_MEMORIA_1123', objetivo_total: 630, objetivo_mes: 20, horas_realizadas_total: 538, horas_planificadas_total: 80, es_sc4l: false, horas_semana_actual: 5 },
];

function cId(name: string) { return name.toLowerCase().replace(/[^a-z0-9]/g, '_'); }

function buildCampaigns(): Campaign[] {
  return CAMPAIGN_DATA.map((c) => ({
    id: cId(c.nombre),
    nombre: c.nombre,
    numero_contrato: c.nombre,
    tipo_objetivo: (c.objetivo_mes > 0 ? 'Mensual' : 'Total') as const,
    objetivo_mensual: c.objetivo_mes,
    objetivo_total: c.objetivo_total,
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'en_ejecucion' as const,
    coordinadora_id: null,
    idiomas_requeridos: ['Español'],
    es_sc4l: c.es_sc4l,
    horas_realizadas_total: c.horas_realizadas_total,
    horas_planificadas_total: c.horas_planificadas_total,
    horas_realizadas_mes: 0,
    horas_planificadas_mes: 0,
  }));
}

type SkillInfo = { horas: number; rol: AgentRole; prioridad: 1 | 2 | 3 };
const SKILLS_MAP: Record<string, Record<string, SkillInfo>> = {
  '059GPSSANIDAD0924': { amoreno: { horas: 10, rol: 'Coordinadora', prioridad: 1 } },
  '124DYLUVISITAS0125': { bgagliardi: { horas: 10, rol: 'Coordinadora', prioridad: 1 }, twright: { horas: 8, rol: 'Agente de Apoyo', prioridad: 1 }, cmunoz: { horas: 5, rol: 'Agente de Apoyo', prioridad: 2 } },
  '246SNCAS200FY261025': { cgarcia: { horas: 5, rol: 'Agente de Apoyo', prioridad: 2 }, ggrau: { horas: 15, rol: 'Agente de Apoyo', prioridad: 1 }, mcandela: { horas: 25, rol: 'Coordinadora', prioridad: 1 }, ggautier: { horas: 0, rol: 'Agente de Apoyo', prioridad: 3 } },
  '035ZEHNSDRVISITAS0624': { eblanco: { horas: 8, rol: 'Coordinadora', prioridad: 1 }, agarcia: { horas: 0, rol: 'Agente de Apoyo', prioridad: 1 }, lbenavente: { horas: 5, rol: 'Agente de Apoyo', prioridad: 2 } },
  '122ONERVISITAS0125': { eblanco: { horas: 13, rol: 'Coordinadora', prioridad: 1 }, cmorel: { horas: 0, rol: 'Agente de Apoyo', prioridad: 1 } },
  'ULLED_MEMORIA_1123': { eblanco: { horas: 0, rol: 'Coordinadora', prioridad: 1 }, plopez: { horas: 5, rol: 'Agente de Apoyo', prioridad: 1 } },
  '139CEGINURTURING0225': { ecarrillo: { horas: 25, rol: 'Coordinadora', prioridad: 1 }, agarcia: { horas: 15, rol: 'Agente de Apoyo', prioridad: 1 }, ialbaladejo: { horas: 10, rol: 'Agente de Apoyo', prioridad: 1 }, bgagliardi: { horas: 0, rol: 'Agente de Apoyo', prioridad: 2 }, fcortes: { horas: 0, rol: 'Agente de Apoyo', prioridad: 3 } },
  'ANVER_F2_ABR_DIC19': { ialbaladejo: { horas: 5, rol: 'Coordinadora', prioridad: 1 } },
  '247SNCASXRTFY261025': { mcatalan: { horas: 0, rol: 'Coordinadora', prioridad: 1 }, amoreno: { horas: 0, rol: 'Agente de Apoyo', prioridad: 1 }, tgarcia: { horas: 3, rol: 'Agente de Apoyo', prioridad: 1 }, plopez: { horas: 0, rol: 'Agente de Apoyo', prioridad: 2 }, fcortes: { horas: 15, rol: 'Agente de Apoyo', prioridad: 3 }, mgomez: { horas: 5, rol: 'Agente de Apoyo', prioridad: 3 } },
  'GIOS_FASE2_SEP19': { plopez: { horas: 5, rol: 'Coordinadora', prioridad: 1 }, lvalls: { horas: 8, rol: 'Agente de Apoyo', prioridad: 1 } },
  'SAGAZ_COM_INT_1122': { svelazquez: { horas: 10, rol: 'Coordinadora', prioridad: 1 } },
  '040ATEISDR25HORAS0624': { tgarcia: { horas: 0, rol: 'Coordinadora', prioridad: 1 } },
  'SC4L': { smancebo: { horas: 25, rol: 'Agente de Apoyo', prioridad: 1 }, cmorel: { horas: 0, rol: 'Agente de Apoyo', prioridad: 1 }, ialbaladejo: { horas: 0, rol: 'Agente de Apoyo', prioridad: 2 }, ggautier: { horas: 0, rol: 'Agente de Apoyo', prioridad: 2 }, cwider: { horas: 0, rol: 'Agente de Apoyo', prioridad: 3 }, srodriguez: { horas: 0, rol: 'Agente de Apoyo', prioridad: 3 } },
  '136GIGALEADS0225': { agarcia: { horas: 5, rol: 'Agente de Apoyo', prioridad: 1 }, amoreno: { horas: 5, rol: 'Agente de Apoyo', prioridad: 1 }, ggautier: { horas: 5, rol: 'Agente de Apoyo', prioridad: 2 }, srodriguez: { horas: 10, rol: 'Agente de Apoyo', prioridad: 1 } },
  '158NEXUPLYCA0425': { amontalban: { horas: 8, rol: 'Agente de Apoyo', prioridad: 1 }, eblanco: { horas: 10, rol: 'Agente de Apoyo', prioridad: 1 }, eboga: { horas: 15, rol: 'Agente de Apoyo', prioridad: 1 } },
  '159ARMILICITACIONES0425': { bgagliardi: { horas: 15, rol: 'Agente de Apoyo', prioridad: 1 }, mgarcia: { horas: 10, rol: 'Agente de Apoyo', prioridad: 1 } },
  '163MOJIREUNIONES0325': { slopez: { horas: 10, rol: 'Agente de Apoyo', prioridad: 1 }, srodriguez: { horas: 10, rol: 'Agente de Apoyo', prioridad: 1 } },
  '179FUTULEADS0425': { lbenavente: { horas: 10, rol: 'Agente de Apoyo', prioridad: 1 }, srodriguez: { horas: 10, rol: 'Agente de Apoyo', prioridad: 1 } },
  '182VANAREUNIONES0525': { eblanco: { horas: 5, rol: 'Agente de Apoyo', prioridad: 1 } },
  '185PENWLEADS0525': { aventura: { horas: 5, rol: 'Agente de Apoyo', prioridad: 1 }, plopez: { horas: 5, rol: 'Agente de Apoyo', prioridad: 1 } },
  '195ECORLEADSEG0625': { amoreno: { horas: 13, rol: 'Agente de Apoyo', prioridad: 1 } },
  '203CEGIDESPACHOS0625': { aventura: { horas: 20, rol: 'Agente de Apoyo', prioridad: 1 }, mgomez: { horas: 15, rol: 'Agente de Apoyo', prioridad: 1 }, tgarcia: { horas: 15, rol: 'Agente de Apoyo', prioridad: 1 } },
  '237SUPPSDR0925': { svelazquez: { horas: 5, rol: 'Agente de Apoyo', prioridad: 1 }, twright: { horas: 8, rol: 'Agente de Apoyo', prioridad: 1 } },
  '248SNCASX3FY261025': { cgarcia: { horas: 8, rol: 'Agente de Apoyo', prioridad: 1 }, ggrau: { horas: 10, rol: 'Agente de Apoyo', prioridad: 1 }, lbenavente: { horas: 5, rol: 'Agente de Apoyo', prioridad: 2 }, mgarcia: { horas: 9, rol: 'Agente de Apoyo', prioridad: 2 } },
  '257SNCAHRFY26': { bgagliardi: { horas: 4, rol: 'Agente de Apoyo', prioridad: 2 }, cgarcia: { horas: 20, rol: 'Agente de Apoyo', prioridad: 1 }, ggrau: { horas: 4, rol: 'Agente de Apoyo', prioridad: 2 }, lvalls: { horas: 15, rol: 'Agente de Apoyo', prioridad: 1 }, slopez: { horas: 6, rol: 'Agente de Apoyo', prioridad: 1 } },
  '258ALTOSMBLEADS1025': { cmunoz: { horas: 10, rol: 'Agente de Apoyo', prioridad: 1 }, slopez: { horas: 15, rol: 'Agente de Apoyo', prioridad: 1 } },
  '261NORMCOLABO1025': { cmunoz: { horas: 5, rol: 'Agente de Apoyo', prioridad: 1 }, plopez: { horas: 8, rol: 'Agente de Apoyo', prioridad: 1 } },
  '267HONELEADSES1125': { amontalban: { horas: 5, rol: 'Agente de Apoyo', prioridad: 1 }, amoreno: { horas: 5, rol: 'Agente de Apoyo', prioridad: 1 } },
  '277GLINREUSANIDAD1225': { srodriguez: { horas: 5, rol: 'Agente de Apoyo', prioridad: 1 }, twright: { horas: 5, rol: 'Agente de Apoyo', prioridad: 1 } },
  '280SAGE1PCSMAQAGR1225': { ggrau: { horas: 5, rol: 'Agente de Apoyo', prioridad: 1 }, mgomez: { horas: 5, rol: 'Agente de Apoyo', prioridad: 1 }, tgarcia: { horas: 10, rol: 'Agente de Apoyo', prioridad: 1 } },
  '284COMALEADS0126': { lvalls: { horas: 10, rol: 'Agente de Apoyo', prioridad: 1 }, tgarcia: { horas: 15, rol: 'Agente de Apoyo', prioridad: 1 } },
  '285ABASLEADSINDUS0126': { cmunoz: { horas: 10, rol: 'Agente de Apoyo', prioridad: 1 }, fcortes: { horas: 15, rol: 'Agente de Apoyo', prioridad: 1 } },
  '286PSICREUNIONES0126': { ialbaladejo: { horas: 5, rol: 'Agente de Apoyo', prioridad: 1 }, plopez: { horas: 5, rol: 'Agente de Apoyo', prioridad: 1 }, twright: { horas: 5, rol: 'Agente de Apoyo', prioridad: 2 } },
  '287BEE2IBERIA_0126': { cmorel: { horas: 0, rol: 'Agente de Apoyo', prioridad: 1 } },
  '288IPSOLEADSYSEG_0126': { bgagliardi: { horas: 5, rol: 'Agente de Apoyo', prioridad: 1 }, fcortes: { horas: 8, rol: 'Agente de Apoyo', prioridad: 1 } },
  '292QUANSEGUIMIENTO0126': { amontalban: { horas: 11, rol: 'Agente de Apoyo', prioridad: 1 }, ggautier: { horas: 5, rol: 'Agente de Apoyo', prioridad: 2 }, lbenavente: { horas: 5, rol: 'Agente de Apoyo', prioridad: 2 } },
  '293METAPOSTAREU0126': { ggautier: { horas: 5, rol: 'Agente de Apoyo', prioridad: 1 }, mgarcia: { horas: 5, rol: 'Agente de Apoyo', prioridad: 1 }, slopez: { horas: 5, rol: 'Agente de Apoyo', prioridad: 1 } },
  '295SAGEINFORRETAIL0126': { mgomez: { horas: 5, rol: 'Agente de Apoyo', prioridad: 1 } },
  '275DEXTLEADSTAND1125': { amontalban: { horas: 10, rol: 'Agente de Apoyo', prioridad: 1 } },
  '276DESPREUDIR1125': { svelazquez: { horas: 5, rol: 'Agente de Apoyo', prioridad: 1 } },
  '087SC4LMIG50HOSTED1024': { agarcia: { horas: 5, rol: 'Agente de Apoyo', prioridad: 1 }, aventura: { horas: 5, rol: 'Agente de Apoyo', prioridad: 1 }, ialbaladejo: { horas: 10, rol: 'Agente de Apoyo', prioridad: 1 }, smancebo: { horas: 10, rol: 'Agente de Apoyo', prioridad: 1 } },
  'GESTION COMERCIAL': { cwider: { horas: 25, rol: 'Coordinadora', prioridad: 1 } },
  'MONTAJE CAMPAÑAS': { mgarcia: { horas: 15, rol: 'Coordinadora', prioridad: 1 } },
};

function buildSkills(): SkillEntry[] {
  const skills: SkillEntry[] = [];
  for (const [campaignName, agentMap] of Object.entries(SKILLS_MAP)) {
    const id = cId(campaignName);
    for (const [agentId, info] of Object.entries(agentMap)) {
      skills.push({ agent_id: agentId, campaign_id: id, prioridad: info.prioridad, rol: info.rol });
    }
  }
  return skills;
}

function buildWeeklyPlan(): WeeklyPlanEntry[] {
  const week = getCurrentWeek();
  const entries: WeeklyPlanEntry[] = [];
  for (const c of CAMPAIGN_DATA) {
    if (c.horas_semana_actual > 0) {
      const id = cId(c.nombre);
      const wNum = parseInt(week.split('-W')[1]);
      const yr = parseInt(week.split('-W')[0]);
      for (let i = 0; i < 4; i++) {
        entries.push({ campaign_id: id, week: `${yr}-W${String(wNum + i).padStart(2, '0')}`, horas: c.horas_semana_actual });
      }
    }
  }
  return entries;
}

function buildPlanningCells(): PlanningCell[] {
  const week = getCurrentWeek();
  const cells: PlanningCell[] = [];
  for (const [campaignName, agentMap] of Object.entries(SKILLS_MAP)) {
    const id = cId(campaignName);
    for (const [agentId, info] of Object.entries(agentMap)) {
      if (info.horas > 0) cells.push({ campaign_id: id, agent_id: agentId, week, horas: info.horas });
    }
  }
  return cells;
}

export const SEED_DATA = {
  agents: buildAgents(),
  campaigns: buildCampaigns(),
  skills: buildSkills(),
  weeklyPlan: buildWeeklyPlan(),
  planningCells: buildPlanningCells(),
};
