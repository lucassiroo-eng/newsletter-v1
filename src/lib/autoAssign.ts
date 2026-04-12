import type { Agent, Campaign, AssignmentCell } from "@/types/models";

interface AutoAssignResult {
  assignments: AssignmentCell[];
  unassignedHours: { campaignId: string; remaining: number }[];
}

export function autoAssign(
  campaigns: Campaign[],
  agents: Agent[],
  weekKey: string,
  weeklyPlanHours: (campId: string) => number,
  existingAssignments: AssignmentCell[]
): AutoAssignResult {
  // Clone existing assignments for this week
  const result: AssignmentCell[] = existingAssignments
    .filter((a) => a.weekKey === weekKey)
    .map((a) => ({ ...a }));

  const agentUsed: Record<string, number> = {};
  agents.forEach((a) => (agentUsed[a.id] = 0));
  result.forEach((a) => {
    agentUsed[a.agentId] = (agentUsed[a.agentId] ?? 0) + a.hours;
  });

  const campaignAssigned: Record<string, number> = {};
  result.forEach((a) => {
    campaignAssigned[a.campaignId] = (campaignAssigned[a.campaignId] ?? 0) + a.hours;
  });

  const unassigned: { campaignId: string; remaining: number }[] = [];

  // Sort campaigns by hours needed (descending)
  const sortedCampaigns = campaigns
    .filter((c) => c.estado === "en_ejecucion" || c.estado === "pre_planificada")
    .map((c) => ({
      campaign: c,
      needed: weeklyPlanHours(c.id) - (campaignAssigned[c.id] ?? 0),
    }))
    .filter((c) => c.needed > 0)
    .sort((a, b) => b.needed - a.needed);

  for (const { campaign, needed } of sortedCampaigns) {
    let remaining = needed;

    // Get eligible agents (trained for this campaign)
    const eligible = agents
      .filter((a) => a.campanasFormado.includes(campaign.id))
      .sort((a, b) => {
        // 1. Coordinators first
        const aCoord = a.campanasCoordina.includes(campaign.id) ? -1 : 0;
        const bCoord = b.campanasCoordina.includes(campaign.id) ? -1 : 0;
        if (aCoord !== bCoord) return aCoord - bCoord;

        // 2. Fewer campaigns assigned = preferred
        const aCount = result.filter((r) => r.agentId === a.id && r.weekKey === weekKey).length;
        const bCount = result.filter((r) => r.agentId === b.id && r.weekKey === weekKey).length;
        if (aCount !== bCount) return aCount - bCount;

        // 3. More available hours
        const aAvail = a.horasSemanales - (agentUsed[a.id] ?? 0);
        const bAvail = b.horasSemanales - (agentUsed[b.id] ?? 0);
        return bAvail - aAvail;
      });

    for (const agent of eligible) {
      if (remaining <= 0) break;

      const available = agent.horasSemanales - (agentUsed[agent.id] ?? 0);
      if (available <= 0) continue;

      const assign = Math.min(remaining, available);

      // Check if already has an assignment for this pair
      const existingIdx = result.findIndex(
        (r) => r.agentId === agent.id && r.campaignId === campaign.id && r.weekKey === weekKey
      );

      if (existingIdx >= 0) {
        result[existingIdx]!.hours += assign;
      } else {
        result.push({
          agentId: agent.id,
          campaignId: campaign.id,
          weekKey,
          hours: assign,
        });
      }

      agentUsed[agent.id] = (agentUsed[agent.id] ?? 0) + assign;
      remaining -= assign;
    }

    if (remaining > 0) {
      unassigned.push({ campaignId: campaign.id, remaining });
    }
  }

  return { assignments: result, unassignedHours: unassigned };
}
