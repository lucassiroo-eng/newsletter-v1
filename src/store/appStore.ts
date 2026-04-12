import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Agent, Campaign, WeeklyPlanEntry, AssignmentCell } from "@/types/models";

interface AppState {
  agents: Agent[];
  campaigns: Campaign[];
  weeklyPlan: WeeklyPlanEntry[];
  assignments: AssignmentCell[];

  // Agents
  addAgent: (a: Agent) => void;
  updateAgent: (id: string, a: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;

  // Campaigns
  addCampaign: (c: Campaign) => void;
  updateCampaign: (id: string, c: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;

  // Weekly Plan
  setWeeklyPlanHours: (campaignId: string, weekKey: string, hours: number) => void;
  getWeeklyPlanHours: (campaignId: string, weekKey: string) => number;

  // Assignments
  setAssignment: (agentId: string, campaignId: string, weekKey: string, hours: number) => void;
  getAssignment: (agentId: string, campaignId: string, weekKey: string) => number;
  clearWeekAssignments: (weekKey: string) => void;

  // CRM Import
  updateCampaignCrmData: (numeroContrato: string, data: {
    horasRealizadasTotal: number;
    horasPlanificadasTotal: number;
    horasRealizadasMes: number;
    horasPlanificadasMes: number;
  }) => boolean;

  // Seed data
  loadSeedData: () => void;
  clearAll: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      agents: [],
      campaigns: [],
      weeklyPlan: [],
      assignments: [],

      addAgent: (a) => set((s) => ({ agents: [...s.agents, a] })),
      updateAgent: (id, data) =>
        set((s) => ({
          agents: s.agents.map((a) => (a.id === id ? { ...a, ...data } : a)),
        })),
      deleteAgent: (id) =>
        set((s) => ({
          agents: s.agents.filter((a) => a.id !== id),
          assignments: s.assignments.filter((a) => a.agentId !== id),
        })),

      addCampaign: (c) => set((s) => ({ campaigns: [...s.campaigns, c] })),
      updateCampaign: (id, data) =>
        set((s) => ({
          campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),
      deleteCampaign: (id) =>
        set((s) => ({
          campaigns: s.campaigns.filter((c) => c.id !== id),
          weeklyPlan: s.weeklyPlan.filter((w) => w.campaignId !== id),
          assignments: s.assignments.filter((a) => a.campaignId !== id),
        })),

      setWeeklyPlanHours: (campaignId, weekKey, hours) =>
        set((s) => {
          const existing = s.weeklyPlan.findIndex(
            (w) => w.campaignId === campaignId && w.weekKey === weekKey
          );
          if (hours === 0) {
            return {
              weeklyPlan: s.weeklyPlan.filter(
                (w) => !(w.campaignId === campaignId && w.weekKey === weekKey)
              ),
            };
          }
          if (existing >= 0) {
            const updated = [...s.weeklyPlan];
            updated[existing] = { campaignId, weekKey, hours };
            return { weeklyPlan: updated };
          }
          return { weeklyPlan: [...s.weeklyPlan, { campaignId, weekKey, hours }] };
        }),

      getWeeklyPlanHours: (campaignId, weekKey) => {
        const entry = get().weeklyPlan.find(
          (w) => w.campaignId === campaignId && w.weekKey === weekKey
        );
        return entry?.hours ?? 0;
      },

      setAssignment: (agentId, campaignId, weekKey, hours) =>
        set((s) => {
          const existing = s.assignments.findIndex(
            (a) => a.agentId === agentId && a.campaignId === campaignId && a.weekKey === weekKey
          );
          if (hours === 0) {
            return {
              assignments: s.assignments.filter(
                (a) => !(a.agentId === agentId && a.campaignId === campaignId && a.weekKey === weekKey)
              ),
            };
          }
          if (existing >= 0) {
            const updated = [...s.assignments];
            updated[existing] = { agentId, campaignId, weekKey, hours };
            return { assignments: updated };
          }
          return { assignments: [...s.assignments, { agentId, campaignId, weekKey, hours }] };
        }),

      getAssignment: (agentId, campaignId, weekKey) => {
        const entry = get().assignments.find(
          (a) => a.agentId === agentId && a.campaignId === campaignId && a.weekKey === weekKey
        );
        return entry?.hours ?? 0;
      },

      clearWeekAssignments: (weekKey) =>
        set((s) => ({
          assignments: s.assignments.filter((a) => a.weekKey !== weekKey),
        })),

      updateCampaignCrmData: (numeroContrato, data) => {
        const camp = get().campaigns.find((c) => c.numeroContrato === numeroContrato);
        if (!camp) return false;
        get().updateCampaign(camp.id, data);
        return true;
      },

      loadSeedData: () => {
        const { agents: existingAgents } = get();
        if (existingAgents.length > 0) return;

        const agents = generateSeedAgents();
        const campaigns = generateSeedCampaigns(agents);

        set({ agents, campaigns, weeklyPlan: [], assignments: [] });
      },

      clearAll: () => set({ agents: [], campaigns: [], weeklyPlan: [], assignments: [] }),
    }),
    {
      name: "shiftplan-v2",
    }
  )
);

// ---- Seed Data ----
function generateSeedAgents(): Agent[] {
  const names = [
    "María García", "Carlos López", "Ana Martínez", "Pedro Sánchez", "Laura Fernández",
    "David Rodríguez", "Elena González", "Jorge Díaz", "Carmen Ruiz", "Miguel Torres",
    "Isabel Moreno", "Francisco Jiménez", "Lucía Álvarez", "Antonio Romero", "Marta Navarro",
    "Roberto Molina", "Patricia Ortega", "Alejandro Serrano", "Rosa Domínguez", "Javier Morales",
  ];

  const idiomas = ["Español", "Catalán", "Inglés", "Francés", "Portugués"];
  const defaultSched = () => {
    const s: any = {};
    for (const d of ["L", "M", "X", "J", "V"]) {
      s[d] = { morning: true, afternoon: Math.random() > 0.5 ? (Math.random() > 0.5 ? "15-17" : "15-18") : null };
    }
    return s;
  };

  return names.map((nombre, i) => {
    const horario = defaultSched();
    let hrs = 0;
    for (const d of ["L", "M", "X", "J", "V"]) {
      if (horario[d].morning) hrs += 5;
      if (horario[d].afternoon === "15-17") hrs += 2;
      if (horario[d].afternoon === "15-18") hrs += 3;
    }
    return {
      id: `agent-${i + 1}`,
      nombre,
      horario,
      horasSemanales: hrs,
      idiomas: [idiomas[0]!, ...(Math.random() > 0.5 ? [idiomas[i % idiomas.length]!] : [])].filter((v, j, a) => a.indexOf(v) === j),
      campanasFormado: [],
      campanasCoordina: [],
      nivel: i < 8 ? "senior" as const : "junior" as const,
    };
  });
}

function generateSeedCampaigns(agents: Agent[]): Campaign[] {
  const campaignNames = [
    "Vodafone Retención", "Movistar Captación", "Orange Winback", "Yoigo Cross-sell",
    "Iberdrola Eficiencia", "Endesa Solar", "Naturgy Mantenimiento", "Repsol Fidelización",
    "BBVA Seguros", "Santander Inversiones", "CaixaBank Hipotecas", "Mapfre Auto",
    "Línea Directa Hogar", "Mutua Madrileña Salud", "Allianz Vida",
  ];

  const campaigns = campaignNames.map((nombre, i) => {
    const isMensual = Math.random() > 0.4;
    const objTotal = Math.round((200 + Math.random() * 800) / 10) * 10;
    const objMes = isMensual ? Math.round(objTotal / 6 / 5) * 5 : 0;

    return {
      id: `camp-${i + 1}`,
      nombre,
      numeroContrato: `CT-${2026}-${String(i + 1).padStart(4, "0")}`,
      tipoObjetivo: isMensual ? "Mensual" as const : "Total" as const,
      objetivoMensual: objMes,
      objetivoTotal: objTotal,
      fechaInicio: "2026-01-01",
      fechaFin: "2026-12-31",
      estado: i < 12 ? "en_ejecucion" as const : "pre_planificada" as const,
      coordinadoraId: agents[i % agents.length]!.id,
      idiomasRequeridos: ["Español"],
      horasRealizadasTotal: Math.round(Math.random() * objTotal * 0.3),
      horasPlanificadasTotal: Math.round(Math.random() * objTotal * 0.1),
      horasRealizadasMes: Math.round(Math.random() * (objMes || 50) * 0.4),
      horasPlanificadasMes: Math.round(Math.random() * (objMes || 50) * 0.2),
    };
  });

  // Assign agents to campaigns
  campaigns.forEach((camp, ci) => {
    const numAgents = 3 + Math.floor(Math.random() * 5);
    const agentIds: string[] = [camp.coordinadoraId];
    for (let j = 0; j < numAgents; j++) {
      const aid = agents[(ci + j + 1) % agents.length]!.id;
      if (!agentIds.includes(aid)) agentIds.push(aid);
    }
    agentIds.forEach((aid) => {
      const agent = agents.find((a) => a.id === aid)!;
      if (!agent.campanasFormado.includes(camp.id)) {
        agent.campanasFormado.push(camp.id);
      }
    });
    // Set coordinator
    const coord = agents.find((a) => a.id === camp.coordinadoraId)!;
    if (!coord.campanasCoordina.includes(camp.id)) {
      coord.campanasCoordina.push(camp.id);
    }
  });

  return campaigns;
}
