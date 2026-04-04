import type { Agent, Campaign, SkillEntry, WeeklyPlanEntry, PlanningCell, AgentException } from '@/types/models';

interface AssignContext {
  agents: Agent[];
  campaigns: Campaign[];
  skills: SkillEntry[];
  weeklyPlan: WeeklyPlanEntry[];
  exceptions: AgentException[];
  selectedWeek: string;
}

export function autoAssign(ctx: AssignContext): PlanningCell[] {
  const week = ctx.selectedWeek;
  const cells = new Map<string, number>();
  const key = (cId: string, aId: string) => `${cId}::${aId}`;
  const getCell = (cId: string, aId: string) => cells.get(key(cId, aId)) || 0;

  const agentCapacity = new Map<string, number>();
  ctx.agents.forEach((a) => {
    const exc = ctx.exceptions.find((e) => e.agent_id === a.id && e.semana === week);
    agentCapacity.set(a.id, exc ? exc.horas_disponibles : a.horas_maximas_semanales);
  });

  const targets = new Map<string, number>();
  ctx.weeklyPlan
    .filter((w) => w.week === week)
    .forEach((w) => targets.set(w.campaign_id, w.horas));

  const remaining = new Map<string, number>(targets);

  const tryAssign = (cId: string, aId: string, maxH: number): number => {
    const cap = agentCapacity.get(aId) || 0;
    const rem = remaining.get(cId) || 0;
    if (cap <= 0 || rem <= 0 || maxH <= 0) return 0;
    const assign = Math.min(cap, rem, maxH);
    if (assign > 0) {
      cells.set(key(cId, aId), getCell(cId, aId) + assign);
      agentCapacity.set(aId, cap - assign);
      remaining.set(cId, rem - assign);
    }
    return assign;
  };

  const activeCampaigns = ctx.campaigns
    .filter((c) => (targets.get(c.id) || 0) > 0)
    .sort((a, b) => (targets.get(b.id) || 0) - (targets.get(a.id) || 0));

  // 1) Coordinators first (5h min)
  for (const c of activeCampaigns) {
    if (c.es_sc4l) continue;
    const coordSkill = ctx.skills.find((s) => s.campaign_id === c.id && s.rol === 'Coordinadora');
    if (coordSkill) tryAssign(c.id, coordSkill.agent_id, 5);
    else if (c.coordinadora_id) tryAssign(c.id, c.coordinadora_id, 5);
  }

  // 2) Assign by priority, fewest campaigns first
  const agentCampaignCount = new Map<string, number>();
  ctx.agents.forEach((a) => agentCampaignCount.set(a.id, 0));

  for (const c of activeCampaigns) {
    if ((remaining.get(c.id) || 0) <= 0) continue;
    const cSkills = ctx.skills
      .filter((s) => s.campaign_id === c.id)
      .sort((a, b) => {
        if (a.prioridad !== b.prioridad) return a.prioridad - b.prioridad;
        return (agentCampaignCount.get(a.agent_id) || 0) - (agentCampaignCount.get(b.agent_id) || 0);
      });

    for (const skill of cSkills) {
      if ((remaining.get(c.id) || 0) <= 0) break;
      const cap = agentCapacity.get(skill.agent_id) || 0;
      if (cap <= 0) continue;
      const assigned = tryAssign(c.id, skill.agent_id, cap);
      if (assigned > 0) agentCampaignCount.set(skill.agent_id, (agentCampaignCount.get(skill.agent_id) || 0) + 1);
    }
  }

  // 3) Fill remaining agent capacity
  for (const agent of ctx.agents) {
    const cap = agentCapacity.get(agent.id) || 0;
    if (cap <= 0) continue;
    const aSkills = ctx.skills.filter((s) => s.agent_id === agent.id).sort((a, b) => a.prioridad - b.prioridad);
    for (const skill of aSkills) {
      if ((agentCapacity.get(agent.id) || 0) <= 0) break;
      if ((remaining.get(skill.campaign_id) || 0) <= 0) continue;
      tryAssign(skill.campaign_id, agent.id, agentCapacity.get(agent.id) || 0);
    }
  }

  const result: PlanningCell[] = [];
  cells.forEach((horas, k) => {
    if (horas > 0) {
      const [campaign_id, agent_id] = k.split('::');
      result.push({ campaign_id, agent_id, week, horas });
    }
  });
  return result;
}
