import { z } from 'zod';
import { TaskPriority, TaskStatus } from '../enums.js';

export interface TaskSource {
  channel: 'telegram' | 'zalo' | 'web' | 'internal';
  externalId?: string;
  threadId?: string;
}

export interface Task {
  id: string;
  companyId: string;
  projectId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  dueDate: string | null;
  source: TaskSource | null;
  createdAt: string;
  updatedAt: string;
}

export const CreateTaskInput = z.object({
  projectId: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(500),
  description: z.string().max(10_000).nullable().optional(),
  status: z
    .enum([
      TaskStatus.TODO,
      TaskStatus.IN_PROGRESS,
      TaskStatus.REVIEW,
      TaskStatus.DONE,
      TaskStatus.CANCELLED,
    ])
    .default(TaskStatus.TODO),
  priority: z
    .enum([
      TaskPriority.LOW,
      TaskPriority.MEDIUM,
      TaskPriority.HIGH,
      TaskPriority.URGENT,
    ])
    .default(TaskPriority.MEDIUM),
  assigneeId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});
export type CreateTaskInput = z.infer<typeof CreateTaskInput>;

export const UpdateTaskInput = CreateTaskInput.partial();
export type UpdateTaskInput = z.infer<typeof UpdateTaskInput>;

export const ChangeTaskStatusInput = z.object({
  status: z.enum([
    TaskStatus.TODO,
    TaskStatus.IN_PROGRESS,
    TaskStatus.REVIEW,
    TaskStatus.DONE,
    TaskStatus.CANCELLED,
  ]),
});
export type ChangeTaskStatusInput = z.infer<typeof ChangeTaskStatusInput>;
