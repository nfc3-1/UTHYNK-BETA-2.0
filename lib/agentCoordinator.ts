import { reasoningAgents } from '@/lib/agents';

export type AgentConclusion = {
  agent: string;
  conclusion: string;
};

export function coordinateAgents(prompt: string): AgentConclusion[] {
  return reasoningAgents.map((agent) => ({
    agent: agent.role,
    conclusion: `${agent.role} perspective on: ${prompt}`,
  }));
}

export function synthesizeConclusions(conclusions: AgentConclusion[]) {
  return conclusions
    .map((item) => `${item.agent}: ${item.conclusion}`)
    .join('\n');
}
