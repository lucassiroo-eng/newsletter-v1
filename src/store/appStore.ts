import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Agent, Campaign, SkillEntry, WeeklyPlanEntry, PlanningCell, AgentException } from '@/types/models';
import { getCurrentWeek } from '@/lib/weekUtils';

interface AppState {
  agents: Agent[];
  campaigns: Campaign[];
  skills: SkillEntry[];
  weeklyPlan: WeeklyPlanEntry[];
  planningCells: PlanningCell[];
  exceptions: AgentException[];
  selectedWeek: string;

  addAgent: (a: Agent) => void;
  updateAgent: (a: Agent) => void;
  deleteAgent: (id: string) => void;

  addCampaign: (c: Campaign) => void;
  updateCampaign: (c: Campaign) => void;
  deleteCampaign: (id: string) => void;
  updateCampaignCRM: (id: string, data: Partial<Pick<Campaign, 'horas_realizadas_total' | 'horas_planificadas_total' | 'horas_realizadas_mes' | 'horas_planificadas_mes'>>) => void;

  setSkill: (s: SkillEntry) => void;
  removeSkill: (agentId: string, campaignId: string) => void;

  setWeeklyPlanHours: (campaignId: string, week: string, horas: number) => void;

  updatePlanningCell: (cell: PlanningCell) => void;
  setPlanningCellsForWeek: (week: string, cells: PlanningCell[]) => void;

  setSelectedWeek: (week: string) => void;

  addException: (e: AgentException) => void;
  removeException: (agentId: string, semana: string) => void;

  loadSeed: (seed: {
    agents: Agent[];
    campaigns: Campaign[];
    skills: SkillEntry[];
    weeklyPlan: WeeklyPlanEntry[];
    planningCells: PlanningCell[];
  }) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      agents: [],
      campaigns: [],
      skills: [],
      weeklyPlan: [],
      planningCells: [],
      exceptions: [],
      selectedWeek: getCurrentWeek(),

      addAgent: (a) => set((s) => ({ agents: [...s.agents, a] })),
      updateAgent: (a) => set((s) => ({ agents: s.agents.map((x) => (x.id === a.id ? a : x)) })),
      deleteAgent: (id) => set((s) => ({
        agents: s.agents.filter((x) => x.id !== id),
        skills: s.skills.filter((x) => x.agent_id !== id),
        planningCells: s.planningCells.filter((x) => x.agent_id !== id),
      })),

      addCampaign: (c) => set((s) => ({ campaigns: [...s.campaigns, c] })),
      updateCampaign: (c) => set((s) => ({ campaigns: s.campaigns.map((x) => (x.id === c.id ? c : x)) })),
      deleteCampaign: (id) => set((s) => ({
        campaigns: s.campaigns.filter((x) => x.id !== id),
        skills: s.skills.filter((x) => x.campaign_id !== id),
        weeklyPlan: s.weeklyPlan.filter((x) => x.campaign_id !== id),
        planningCells: s.planningCells.filter((x) => x.campaign_id !== id),
      })),
      updateCampaignCRM: (id, data) => set((s) => ({
        campaigns: s.campaigns.map((c) => c.id === id ? { ...c, ...data } : c),
      })),

      setSkill: (sk) => set((s) => {
        const rest = s.skills.filter((x) => !(x.agent_id === sk.agent_id && x.campaign_id === sk.campaign_id));
        return { skills: [...rest, sk] };
      }),
      removeSkill: (agentId, campaignId) => set((s) => ({
        skills: s.skills.filter((x) => !(x.agent_id === agentId && x.campaign_id === campaignId)),
      })),

      setWeeklyPlanHours: (campaignId, week, horas) => set((s) => {
        const rest = s.weeklyPlan.filter((x) => !(x.campaign_id === campaignId && x.week === week));
        if (horas > 0) return { weeklyPlan: [...rest, { campaign_id: campaignId, week, horas }] };
        return { weeklyPlan: rest };
      }),

      updatePlanningCell: (cell) => set((s) => {
        const rest = s.planningCells.filter(
          (x) => !(x.campaign_id === cell.campaign_id && x.agent_id === cell.agent_id && x.week === cell.week)
        );
        if (cell.horas > 0) return { planningCells: [...rest, cell] };
        return { planningCells: rest };
      }),
      setPlanningCellsForWeek: (week, cells) => set((s) => ({
        planningCells: [...s.planningCells.filter((x) => x.week !== week), ...cells],
      })),

      setSelectedWeek: (week) => set({ selectedWeek: week }),

      addException: (e) => set((s) => ({
        exceptions: [...s.exceptions.filter((x) => !(x.agent_id === e.agent_id && x.semana === e.semana)), e],
      })),
      removeException: (agentId, semana) => set((s) => ({
        exceptions: s.exceptions.filter((x) => !(x.agent_id === agentId && x.semana === semana)),
      })),

      loadSeed: (seed) => set({
        agents: seed.agents,
        campaigns: seed.campaigns,
        skills: seed.skills,
        weeklyPlan: seed.weeklyPlan,
        planningCells: seed.planningCells,
      }),
    }),
    { name: 'shiftplan-v2' }
  )
);
