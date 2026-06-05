import type { Project } from "@foundry/shared";

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
}

export interface TaskCount {
  total: number;
  byStatus: Record<string, number>;
}

export interface IProjectRepository {
  list(includeArchived?: boolean): Promise<Project[]>;
  getById(id: string): Promise<Project>;
  create(input: CreateProjectInput): Promise<Project>;
  update(id: string, input: UpdateProjectInput): Promise<Project>;
  delete(id: string): Promise<void>;
  archive(id: string): Promise<Project>;
  unarchive(id: string): Promise<Project>;
  getTaskCount(id: string): Promise<TaskCount>;
}
