import type { Column } from "@foundry/shared";

export interface CreateColumnInput {
  projectId: string;
  name: string;
  color?: string;
}

export interface UpdateColumnInput {
  name?: string;
  color?: string;
}

export interface IColumnRepository {
  list(projectId: string): Promise<Column[]>;
  getById(id: string): Promise<Column>;
  create(input: CreateColumnInput): Promise<Column>;
  update(id: string, input: UpdateColumnInput): Promise<Column>;
  delete(id: string): Promise<void>;
  reorder(projectId: string, columnIds: string[]): Promise<Column[]>;
  seedDefaults(projectId: string): Promise<Column[]>;
}
