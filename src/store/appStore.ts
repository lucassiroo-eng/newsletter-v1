import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Agent, Campaign, SkillEntry, CampaignWeeklyData, PlanningCell, AgentException } from '@/types/models';

interface AppState {
  agents: Agent[];
  campaigns: Campaign[];
  skills: SkillEntry[];
  weeklyData: CampaignWeeklyData[];
  planningCells: PlanningCell[];
  exceptions: AgentException[];

  addAgent: (a: Agent) => void;
  updateAgent: (a: Agent) => void;
  deleteAgent: (id: string) => void;

  addCampaign: (c: Campaign) => void;
  updateCampaign: (c: Campaign) => void;
  deleteCampaign: (id: string) => void;

  setSkill: (s: SkillEntry) => void;
  removeSkill: (agentId: string, campaignId: string) => void;

  setWeeklyData: (data: CampaignWeeklyData[]) => void;
  setPlanningCells: (cells: PlanningCell[]) => void;
  updatePlanningCell: (cell: PlanningCell) => void;

  addException: (e: AgentException) => void;
  removeException: (agentId: string, semana: string) => void;

  loadSeed: (seed: {
    agents: Agent[];
    campaigns: Campaign[];
    skills: SkillEntry[];
    weeklyData: CampaignWeeklyData[];
    planningCells: PlanningCell[];
  }) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      agents: [],
      campaigns: [],
      skills: [],
      weeklyData: [],
      planningCells: [],
      exceptions: [],

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
        weeklyData: s.weeklyData.filter((x) => x.campaign_id !== id),
        planningCells: s.planningCells.filter((x) => x.campaign_id !== id),
      })),

      setSkill: (sk) => set((s) => {
        const rest = s.skills.filter((x) => !(x.agent_id === sk.agent_id && x.campaign_id === sk.campaign_id));
        return { skills: [...rest, sk] };
      }),
      removeSkill: (agentId, campaignId) => set((s) => ({
        skills: s.skills.filter((x) => !(x.agent_id === agentId && x.campaign_id === campaignId)),
      })),

      setWeeklyData: (data) => set({ weeklyData: data }),
      setPlanningCells: (cells) => set({ planningCells: cells }),
      updatePlanningCell: (cell) => set((s) => {
        const rest = s.planningCells.filter(
          (x) => !(x.campaign_id === cell.campaign_id && x.agent_id === cell.agent_id)
        );
        if (cell.horas > 0) return { planningCells: [...rest, cell] };
        return { planningCells: rest };
      }),

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
        weeklyData: seed.weeklyData,
        planningCells: seed.planningCells,
      }),
    }),
    { name: 'workforce-scheduler' }
  )
);
