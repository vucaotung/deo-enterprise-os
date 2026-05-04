// Shared enums (Phase 0 v2 checklist mục 3.1).

export const TaskStatus = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done',
  CANCELLED: 'cancelled',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const ProjectStatus = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const ChannelType = {
  TELEGRAM: 'telegram',
  ZALO: 'zalo',
  WEB: 'web',
  INTERNAL: 'internal',
} as const;
export type ChannelType = (typeof ChannelType)[keyof typeof ChannelType];

export const ActorType = {
  HUMAN: 'human',
  AGENT: 'agent',
  SYSTEM: 'system',
  SERVICE: 'service',
} as const;
export type ActorType = (typeof ActorType)[keyof typeof ActorType];
