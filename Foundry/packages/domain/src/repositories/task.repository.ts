import type { Task, Tag } from "@foundry/shared";

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  startDate?: string | null;
  endDate?: string | null;
  estimateHours?: number;
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  startDate?: string | null;
  endDate?: string | null;
  estimateHours?: number;
}

export interface SearchTasksInput {
  query: string;
  projectId?: string;
  status?: string;
  priority?: string;
  overdue?: boolean;
  limit?: number;
}

export interface ITaskRepository {
  list(projectId?: string): Promise<Task[]>;
  getById(id: string): Promise<Task>;
  create(input: CreateTaskInput): Promise<Task>;
  update(id: string, input: UpdateTaskInput): Promise<Task>;
  delete(id: string): Promise<void>;
  move(id: string, status: string): Promise<Task>;
  search(input: SearchTasksInput): Promise<Task[]>;
  getTags(taskId: string): Promise<Tag[]>;
  addTag(taskId: string, tagId: string): Promise<void>;
  removeTag(taskId: string, tagId: string): Promise<void>;
  getHistory(taskId: string): Promise<unknown[]>;
}
