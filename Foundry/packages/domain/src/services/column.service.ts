import type { IColumnRepository, CreateColumnInput, UpdateColumnInput } from "../repositories/column.repository";
import type { Column } from "@foundry/shared";
import { ValidationError } from "../errors";

export interface ColumnServiceDeps {
  columnRepo: IColumnRepository;
}

export function createColumnService(deps: ColumnServiceDeps) {
  async function list(projectId: string): Promise<Column[]> {
    return deps.columnRepo.list(projectId);
  }

  async function getById(id: string): Promise<Column> {
    return deps.columnRepo.getById(id);
  }

  async function create(input: CreateColumnInput): Promise<Column> {
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError("Column name is required");
    }
    return deps.columnRepo.create(input);
  }

  async function update(id: string, input: UpdateColumnInput): Promise<Column> {
    return deps.columnRepo.update(id, input);
  }

  async function remove(id: string): Promise<void> {
    return deps.columnRepo.delete(id);
  }

  async function reorder(projectId: string, columnIds: string[]): Promise<Column[]> {
    return deps.columnRepo.reorder(projectId, columnIds);
  }

  return { list, getById, create, update, remove, reorder };
}

export type ColumnService = ReturnType<typeof createColumnService>;
