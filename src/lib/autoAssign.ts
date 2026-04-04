import type { Agent, Campaign, SkillEntry, CampaignWeeklyData, PlanningCell } from '@/types/models';
import { TIME_BLOCK_HOURS } from '@/types/models';

interface AssignContext {
  agents: Agent[];
  campaigns: Campaign[];
  skills: SkillEntry[];
  weeklyData: CampaignWeeklyData[];
}

export function autoAssign(ctx: AssignContext): PlanningCell[] {
  const cells: Map<string, number> = new Map();
  const key = (cId: string, aId: string) => `${cId}::${aId}`;
  const getCell = (cId: string, aId: string) => cells.get(key(cId, aId)) || 0;
  const setCell = (cId: string, aId: string, h: number) => cells.set(key(cId, aId), h);

  const agentCapacity = new Map<string, number>();
  ctx.agents.forEach((a) => agentCapacity.set(a.id, a.horas_maximas_semanales));

  const balances = new Map<string, number>();
  ctx.campaigns.forEach((c) => {
    const wd = ctx.weeklyData.find((w) => w.campaign_id === c.id);
    const done = wd ? wd.horas_realizadas + wd.horas_planificadas : 0;
    const balance = Math.max(0, c.objetivo_horas - done);
    balances.set(c.id, balance);
  });

  const agentBlockSizes = (a: Agent): number[] => {
    return a.bloques_horarios.map((b) => TIME_BLOCK_HOURS[b]).sort((x, y) => y - x);
  };

  const tryAssign = (cId: string, aId: string, maxHours: number): number => {
    const agent = ctx.agents.find((a) => a.id === aId)!;
    const cap = agentCapacity.get(aId)!;
    const bal = balances.get(cId)!;
    if (cap <= 0 || bal <= 0 || maxHours <= 0) return 0;

    const blocks = agentBlockSizes(agent);
    if (blocks.length === 0) return 0;

    const toAssign = Math.min(cap, bal, maxHours);
    let assigned = 0;
    let remaining = toAssign;
    for (const blockSize of blocks) {
      while (remaining >= blockSize) {
        assigned += blockSize;
        remaining -= blockSize;
      }
    }
    if (assigned === 0 && toAssign > 0) {
      const smallest = blocks[blocks.length - 1];
      assigned = Math.min(smallest, toAssign, cap, bal);
    }

    if (assigned > 0) {
      setCell(cId, aId, getCell(cId, aId) + assigned);
      agentCapacity.set(aId, cap - assigned);
      balances.set(cId, bal - assigned);
    }
    return assigned;
  };

  const sortedCampaigns = [...ctx.campaigns]
    .filter((c) => (balances.get(c.id) || 0) > 0)
    .sort((a, b) => (balances.get(b.id) || 0) - (balances.get(a.id) || 0));

  // RULE 1: Coordinadoras get at least 5h (unless SC4L)
  for (const campaign of sortedCampaigns) {
    if (campaign.es_sc4l) continue;
    // Find coordinator from skills with rol=Coordinadora
    const coordSkill = ctx.skills.find((s) => s.campaign_id === campaign.id && s.rol === 'Coordinadora');
    if (!coordSkill) {
      // Fallback to campaign.coordinadora_id
      if (!campaign.coordinadora_id) continue;
      const hasSkill = ctx.skills.some((s) => s.agent_id === campaign.coordinadora_id && s.campaign_id === campaign.id);
      if (!hasSkill) continue;
      tryAssign(campaign.id, campaign.coordinadora_id, 5);
    } else {
      tryAssign(campaign.id, coordSkill.agent_id, 5);
    }
  }

  // RULES 3-6: Assign by skill priority, minimize agent count
  for (const campaign of sortedCampaigns) {
    if ((balances.get(campaign.id) || 0) <= 0) continue;

    const campaignSkills = ctx.skills
      .filter((s) => s.campaign_id === campaign.id)
      .sort((a, b) => a.prioridad - b.prioridad);

    for (const skill of campaignSkills) {
      if ((balances.get(campaign.id) || 0) <= 0) break;
      const cap = agentCapacity.get(skill.agent_id) || 0;
      if (cap <= 0) continue;
      tryAssign(campaign.id, skill.agent_id, cap);
    }
  }

  // RULE 7: Fill remaining agent capacity
  for (const agent of ctx.agents) {
    const cap = agentCapacity.get(agent.id) || 0;
    if (cap <= 0) continue;

    const agentSkills = ctx.skills
      .filter((s) => s.agent_id === agent.id)
      .sort((a, b) => a.prioridad - b.prioridad);

    for (const skill of agentSkills) {
      if ((agentCapacity.get(agent.id) || 0) <= 0) break;
      const bal = balances.get(skill.campaign_id) || 0;
      if (bal <= 0) continue;
      tryAssign(skill.campaign_id, agent.id, agentCapacity.get(agent.id) || 0);
    }
  }

  const result: PlanningCell[] = [];
  cells.forEach((horas, k) => {
    if (horas > 0) {
      const [campaign_id, agent_id] = k.split('::');
      result.push({ campaign_id, agent_id, horas });
    }
  });
  return result;
}
