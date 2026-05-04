import { z } from 'zod';
import { ProjectStatus } from '../enums.js';

export interface Project {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  ownerId: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export const CreateProjectInput = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  status: z
    .enum([
      ProjectStatus.PLANNING,
      ProjectStatus.ACTIVE,
      ProjectStatus.PAUSED,
      ProjectStatus.COMPLETED,
      ProjectStatus.ARCHIVED,
    ])
    .default(ProjectStatus.PLANNING),
  ownerId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});
export type CreateProjectInput = z.infer<typeof CreateProjectInput>;

export const UpdateProjectInput = CreateProjectInput.partial();
export type UpdateProjectInput = z.infer<typeof UpdateProjectInput>;
