/**
 * Agent-related utilities and helpers
 */

// Agent data normalization
export const normalizeAgent = (rawAgent) => {
  if (!rawAgent || typeof rawAgent !== 'object') {
    throw new Error('Invalid agent data');
  }

  // Extract agent ID from various possible field names
  const agentId = rawAgent.agent_id || rawAgent.agentId || rawAgent.id;

  if (!agentId) {
    throw new Error('Agent ID is required');
  }

  return {
    agentId: String(agentId),
    name: rawAgent.name || `Agent ${agentId}`,
    ...rawAgent,
  };
};

// Agent validation
export const isValidAgent = (agent) => {
  return (
    agent &&
    typeof agent === 'object' &&
    typeof agent.agentId === 'string' &&
    agent.agentId.length > 0 &&
    typeof agent.name === 'string'
  );
};

// Agents response processing
export const processAgentsResponse = (response) => {
  if (!response || typeof response !== 'object') {
    return [];
  }

  const agents = response.agents || [];

  return agents
    .map((rawAgent) => {
      try {
        return normalizeAgent(rawAgent);
      } catch (error) {
        console.warn('Failed to normalize agent:', rawAgent, error);
        return null;
      }
    })
    .filter((agent) => agent !== null && isValidAgent(agent));
};

// Agent factory
export const createAgent = (agentId, name, additionalData = {}) => {
  if (!agentId || typeof agentId !== 'string') {
    throw new Error('Agent ID must be a non-empty string');
  }

  return {
    agentId,
    name: name || `Agent ${agentId}`,
    ...additionalData,
  };
};
