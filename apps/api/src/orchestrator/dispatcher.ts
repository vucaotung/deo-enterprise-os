import * as redis from '../redis';

// Per-runtime, per-tenant queue: jobs:queue:<runtime_type>:<company_id>
//
// Why split by runtime_type: each runtime (claude-code, openclaw, n8n,
// internal) is a separate execution surface; congestion in one should
// not block another. Why split by company_id: tenant isolation so a
// noisy tenant cannot starve others.
export const buildQueueKey = (runtimeType: string, companyId: string): string =>
  `jobs:queue:${runtimeType}:${companyId}`;

export interface DispatchInput {
  agentJobId: string;
  runtimeType: string;
  companyId: string;
}

export const dispatchAgentJob = async (input: DispatchInput): Promise<string> => {
  const queueKey = buildQueueKey(input.runtimeType, input.companyId);
  await redis.lpush(queueKey, input.agentJobId);
  return queueKey;
};

export const popAgentJob = async (queueKey: string): Promise<string | null> => {
  const value = await redis.lpop(queueKey);
  return value || null;
};
