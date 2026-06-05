import type { Note } from "@foundry/shared";

export interface INoteRepository {
  list(taskId: string): Promise<Note[]>;
  getById(id: string): Promise<Note>;
  create(taskId: string, content: string): Promise<Note>;
  update(id: string, content: string): Promise<Note>;
  delete(id: string): Promise<void>;
}
