import { RuntimeAdapter } from './types';
import { claudeCodeAdapter } from './claude-code';
import { openclawAdapter } from './openclaw';
import { n8nAdapter } from './n8n';
import { internalAdapter } from './internal';

const adapters: Record<string, RuntimeAdapter> = {
  'claude-code': claudeCodeAdapter,
  openclaw: openclawAdapter,
  n8n: n8nAdapter,
  internal: internalAdapter,
};

export const getRuntimeAdapter = (runtimeType: string): RuntimeAdapter | null =>
  adapters[runtimeType] || null;

export const listRuntimeTypes = (): string[] => Object.keys(adapters);

export type { RuntimeAdapter, AgentJobContext, RuntimeRunResult } from './types';
