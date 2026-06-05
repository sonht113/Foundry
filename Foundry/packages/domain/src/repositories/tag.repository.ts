import type { Tag } from "@foundry/shared";

export interface ITagRepository {
  list(): Promise<Tag[]>;
  getById(id: string): Promise<Tag>;
  create(name: string): Promise<Tag>;
  delete(id: string): Promise<void>;
}
