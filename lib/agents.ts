export type ReasoningAgent = {
  id: string;
  role: string;
  objective: string;
};

export const reasoningAgents: ReasoningAgent[] = [
  {
    id: 'strategist',
    role: 'Strategist',
    objective: 'Evaluate incentives and long-term positioning.',
  },
  {
    id: 'skeptic',
    role: 'Skeptic',
    objective: 'Challenge weak assumptions and unsupported claims.',
  },
  {
    id: 'operator',
    role: 'Operator',
    objective: 'Focus on execution realism and practical tradeoffs.',
  },
  {
    id: 'ethicist',
    role: 'Ethicist',
    objective: 'Evaluate second-order ethical consequences.',
  },
];

export function orchestrateAgentPrompts(userPrompt: string) {
  return reasoningAgents.map((agent) => ({
    agent: agent.role,
    instruction: `${agent.objective} Scenario: ${userPrompt}`,
  }));
}
