/**
 * Agent-related types and interfaces
 */

export interface RawAgentData {
  agent_id?: string;
  agentId?: string;
  id?: string;
  name?: string;
  [key: string]: unknown;
}

export interface Agent {
  agentId: string;
  name: string;
  [key: string]: unknown;
}

export interface AgentsResponse {
  agents?: RawAgentData[];
  [key: string]: unknown;
}
